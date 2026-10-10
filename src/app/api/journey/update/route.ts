import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { RATING_CONFIG_KEYS, normalizeScale, clampRating, isTopRating, type RatingScale } from '@/lib/ratingScale';
import { customerRatingMayCloseItem } from '@/lib/serviceWorkFinished';

/**
 * `rating_scale` columns come from admin migration 20261002110000. Until that migration runs on a
 * database, writing the column would fail the whole rating (PGRST204), so probe once per table.
 */
const ratingScaleColumnCache = new Map<string, boolean>();
async function hasRatingScaleColumn(supabase: any, table: 'BookingItems' | 'Bookings'): Promise<boolean> {
    if (ratingScaleColumnCache.has(table)) return ratingScaleColumnCache.get(table)!;
    const { error } = await supabase.from(table).select('rating_scale').limit(1);
    if (error) console.warn(`[journey/update] ${table}.rating_scale missing — rating saved without scale (treated as 4).`);
    ratingScaleColumnCache.set(table, !error);
    return !error;
}

/** Scale of this rating: what the customer saw (4|5); missing → current admin setting. */
async function resolveRatingScale(supabase: any, sent: unknown): Promise<RatingScale> {
    if (Number(sent) === 4 || Number(sent) === 5) return Number(sent) as RatingScale;
    const { data } = await supabase.from('SystemConfigs').select('value').eq('key', RATING_CONFIG_KEYS.scale).maybeSingle();
    return normalizeScale(data?.value);
}

/**
 * Trạng thái đơn = tính từ trạng thái các dịch vụ, bằng RPC dùng chung với quầy/KTV
 * (`dispatch_recompute_booking_status`, migration admin 20260927120000, chỉ service_role gọi được).
 * RPC chưa có trên DB → tự tính tối thiểu: mọi dịch vụ DONE/CANCELLED → DONE, còn lại giữ nguyên.
 * Trả về status sau khi tính (đọc lại từ DB).
 */
async function recomputeBookingStatus(supabase: any, bookingId: string): Promise<string | null> {
    const { error } = await supabase.rpc('dispatch_recompute_booking_status', { p_booking_id: bookingId });
    if (error) {
        console.warn('[journey/update] dispatch_recompute_booking_status failed, fallback:', error.message);
        const { data: items } = await supabase.from('BookingItems').select('status').eq('bookingId', bookingId);
        const statuses: string[] = (items || []).map((i: { status: unknown }) => String(i.status));
        if (statuses.length > 0 && statuses.every(s => s === 'DONE' || s === 'CANCELLED')) {
            await supabase.from('Bookings').update({ status: 'DONE' }).eq('id', bookingId);
        }
    }
    const { data: b } = await supabase.from('Bookings').select('status').eq('id', bookingId).maybeSingle();
    return b?.status ?? null;
}


export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        let { 
            bookingId, 
            status, 
            violations, 
            rating, 
            tipAmount, 
            feedbackNote,
            // Per-item rating support
            bookingItemId,
            itemRating,
            itemFeedback,
        } = body;

        if (typeof bookingId !== 'string' || !bookingId.trim()) {
            return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
        }
        // Trang Journey gửi 'FEEDBACK' (đã kiểm đồ) và 'DONE' KÈM điểm khi khách đánh giá
        // (handleItemRated / handleFeedbackComplete). Chặn 'DONE' không kèm điểm đã làm hỏng MỌI lượt
        // khách tự đánh giá từ 04/10/2026 13:56 (adf5949) → chỉ nhận 'DONE' khi có rating/itemRating.
        // Nhánh đánh giá theo dịch vụ vẫn tự tính DONE ở server, không dùng status gửi lên.
        const isRatingSubmit = rating !== undefined || itemRating !== undefined;
        if (status !== undefined && status !== 'FEEDBACK' && !(status === 'DONE' && isRatingSubmit)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }
        if (bookingItemId !== undefined && typeof bookingItemId !== 'string') {
            return NextResponse.json({ error: 'Invalid bookingItemId' }, { status: 400 });
        }
        if (body.ktvCode !== undefined && body.ktvCode !== null && typeof body.ktvCode !== 'string') {
            return NextResponse.json({ error: 'Invalid ktvCode' }, { status: 400 });
        }

        const supabaseAdmin = getSupabaseAdmin();
        if (!supabaseAdmin) {
            return NextResponse.json({ error: 'Database client not initialized' }, { status: 500 });
        }

        // 🔒 Chỉ chấp nhận accessToken (mã đơn thô dạng 11NDK-001-… đoán được, không phải bí mật).
        // Khách luôn vào Journey bằng token nên không có luồng thật nào gửi mã đơn.
        const { data: resolved, error: resolveError } = await supabaseAdmin
            .from('Bookings')
            .select('id')
            .eq('accessToken', bookingId.trim())
            .maybeSingle();

        if (resolveError) {
            console.error('[journey/update] resolve error:', resolveError);
            return NextResponse.json({ error: resolveError.message }, { status: 500 });
        }
        if (!resolved) {
            return NextResponse.json({ error: 'Unauthorized or Booking not found' }, { status: 403 });
        }
        bookingId = resolved.id; // Use real ID for all subsequent queries

        // --- Per-item rating: khi khách đánh giá 1 dịch vụ cụ thể ---
        if (bookingItemId && itemRating !== undefined) {
            // Clamp to 0 (skipped) .. scale; the scale is saved with the rating in the SAME update
            // so the ledger trigger reads the right scale.
            const ratingScale = await resolveRatingScale(supabaseAdmin, body.ratingScale);
            const clamped = clampRating(itemRating, ratingScale);
            if (clamped === null) return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
            itemRating = clamped;
            const writeScale = await hasRatingScaleColumn(supabaseAdmin, 'BookingItems');

            // Extract ktvCode from request (for per-KTV rating)
            const { ktvCode } = body;

            // 1. Build update payload
            const updatePayload: any = {
                itemFeedback: itemFeedback || null,
            };

            let useKtvRatings = false; // Track if ktvRatings column is available
            // Chặng của item: quyết định khách chấm sao có được đóng item (DONE) hay chưa.
            let itemSegments: unknown = undefined;
            let itemStatus: unknown = undefined;

            if (ktvCode) {
                // Per-KTV rating: try to use ktvRatings JSONB map
                // First read existing item data
                const { data: existingItem, error: readError } = await supabaseAdmin
                    .from('BookingItems')
                    .select('ktvRatings, technicianCodes, segments, status')
                    .eq('id', bookingItemId)
                    .eq('bookingId', bookingId)
                    .maybeSingle();

                if (readError) {
                    // ktvRatings column might not exist — try reading without it
                    console.warn('[journey/update] ktvRatings read failed (column may not exist):', readError.message);
                    
                    const { data: fallbackItem } = await supabaseAdmin
                        .from('BookingItems')
                        .select('technicianCodes, segments, status')
                        .eq('id', bookingItemId)
                        .eq('bookingId', bookingId)
                        .maybeSingle();

                    // Fallback: just update itemRating directly
                    updatePayload.itemRating = itemRating;
                    if (customerRatingMayCloseItem(fallbackItem?.segments, fallbackItem?.status)) updatePayload.status = 'DONE';
                    useKtvRatings = false;
                } else {
                    // ktvRatings column exists — use per-KTV flow
                    useKtvRatings = true;
                    itemSegments = existingItem?.segments;
                    itemStatus = existingItem?.status;
                    const existingRatings: Record<string, number> = existingItem?.ktvRatings || {};
                    existingRatings[ktvCode.trim()] = itemRating;

                    updatePayload.ktvRatings = existingRatings;

                    // Check if ALL KTVs in technicianCodes have been rated
                    const techCodes: string[] = existingItem?.technicianCodes || [];
                    const allKtvsRated = techCodes.length > 0 && techCodes.every(
                        (code: string) => existingRatings[code.trim()] !== undefined
                    );

                    if (allKtvsRated) {
                        // All KTVs rated → set itemRating as the average + mark DONE
                        const ratings = techCodes.map((c: string) => existingRatings[c.trim()]).filter(Boolean);
                        updatePayload.itemRating = Math.round(ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length);
                        if (customerRatingMayCloseItem(itemSegments, itemStatus)) updatePayload.status = 'DONE';
                    }
                    // If not all KTVs rated yet → DON'T set itemRating or DONE status
                }
            } else {
                // Single-KTV: set itemRating + luôn ghi ktvRatings cho lịch sử KTV
                updatePayload.itemRating = itemRating;

                // Đọc technicianCodes để ghi ktvRatings cho KTV; segments để quyết định có được DONE không
                try {
                    const { data: singleItem, error: singleReadErr } = await supabaseAdmin
                        .from('BookingItems')
                        .select('technicianCodes, ktvRatings, segments, status')
                        .eq('id', bookingItemId)
                        .eq('bookingId', bookingId)
                        .maybeSingle();

                    itemSegments = singleItem?.segments;
                    itemStatus = singleItem?.status;
                    if (!singleReadErr && singleItem?.technicianCodes) {
                        useKtvRatings = true;
                        const ktvR: Record<string, number> = singleItem.ktvRatings || {};
                        // Gán rating cho tất cả KTV trong item
                        (singleItem.technicianCodes as string[]).forEach((code: string) => {
                            if (code.trim()) ktvR[code.trim()] = itemRating;
                        });
                        updatePayload.ktvRatings = ktvR;
                    }
                } catch {
                    // ktvRatings column chưa tồn tại — bỏ qua, chỉ dùng itemRating
                }
                if (customerRatingMayCloseItem(itemSegments, itemStatus)) updatePayload.status = 'DONE';
            }

            if (writeScale) updatePayload.rating_scale = ratingScale;

            // 2. Try to update BookingItem
            let updateError;
            ({ error: updateError } = await supabaseAdmin
                .from('BookingItems')
                .update(updatePayload)
                .eq('id', bookingItemId)
                .eq('bookingId', bookingId));

            // If update failed and we tried ktvRatings, retry without it
            if (updateError && updatePayload.ktvRatings) {
                console.warn('[journey/update] Update with ktvRatings failed, retrying without:', updateError.message);
                delete updatePayload.ktvRatings;
                updatePayload.itemRating = itemRating;
                if (customerRatingMayCloseItem(itemSegments, itemStatus)) updatePayload.status = 'DONE';
                useKtvRatings = false;

                ({ error: updateError } = await supabaseAdmin
                    .from('BookingItems')
                    .update(updatePayload)
                    .eq('id', bookingItemId)
                    .eq('bookingId', bookingId));
            }

            if (updateError) {
                console.error('Supabase item rating error:', updateError);
                return NextResponse.json({ error: updateError.message }, { status: 500 });
            }

            // 🌟 Thông báo khi khách đánh giá mức cao nhất của thang ("Xuất sắc")
            if (isTopRating(itemRating, ratingScale)) {
                try {
                    // Xác định danh sách KTV codes
                    let techCodesForNotif: string[] = [];
                    if (ktvCode) {
                        techCodesForNotif = [ktvCode.trim()];
                    } else {
                        // Read technicianCodes from the item
                        const { data: itemForNotif } = await supabaseAdmin
                            .from('BookingItems')
                            .select('technicianCodes')
                            .eq('id', bookingItemId)
                            .eq('bookingId', bookingId)
                            .maybeSingle();
                        techCodesForNotif = (itemForNotif?.technicianCodes || []).map((c: string) => c.trim()).filter(Boolean);
                    }

                    const ktvDisplay = techCodesForNotif.join(', ') || 'KTV';

                    // 1️⃣ Thông báo cho QUẦY LỄ TÂN (dispatch board popup)
                    await supabaseAdmin.from('StaffNotifications').insert({
                        bookingId,
                        type: 'FEEDBACK',
                        message: `🌟 Khách đánh giá XUẤT SẮC cho NV ${ktvDisplay}!`,
                        isRead: false,
                        createdAt: new Date().toISOString(),
                    });

                    // 2️⃣ Thông báo cho TỪNG KTV (KTV dashboard bonusMessage)
                    for (const code of techCodesForNotif) {
                        if (!code) continue;
                        await supabaseAdmin.from('StaffNotifications').insert({
                            bookingId,
                            employeeId: code,
                            type: 'REWARD',
                            message: `🌟 Khách hàng vừa đánh giá bạn XUẤT SẮC! Tiếp tục phát huy nhé!`,
                            isRead: false,
                            createdAt: new Date().toISOString(),
                        });
                    }
                    // 3️⃣ Gọi API Web Push để bắn thông báo ra ngoài màn hình (Push Notification)
                    const adminUrl = process.env.ADMIN_URL || 'http://localhost:3000';
                    const webhookSecret = process.env.WEBHOOK_SECRET || '';

                    // 3.1 Push cho Quầy (ADMIN, RECEPTIONIST)
                    await fetch(`${adminUrl}/api/notifications/push`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-webhook-secret': webhookSecret
                        },
                        body: JSON.stringify({
                            title: 'Đánh giá Xuất Sắc! 🌟',
                            message: `Khách hàng vừa đánh giá XUẤT SẮC cho NV ${ktvDisplay}!`,
                            targetRoles: ['ADMIN', 'RECEPTIONIST']
                        })
                    }).catch(err => console.error('[journey/update] Web Push to Reception failed:', err));

                    // 3.2 Push cho KTV
                    if (techCodesForNotif.length > 0) {
                        await fetch(`${adminUrl}/api/notifications/push`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'x-webhook-secret': webhookSecret
                            },
                            body: JSON.stringify({
                                title: 'Bạn nhận được đánh giá Xuất Sắc! 🌟',
                                message: `Tuyệt vời! Khách hàng vừa đánh giá bạn XUẤT SẮC. Tiếp tục phát huy nhé!`,
                                targetStaffIds: techCodesForNotif
                            })
                        }).catch(err => console.error('[journey/update] Web Push to KTV failed:', err));
                    }

                } catch (notifErr) {
                    // Non-critical: don't fail the rating update if notification fails
                    console.error('[journey/update] Notification insert error:', notifErr);
                }
            }

            // 3. Re-query toàn bộ items để check xem tất cả đã rated chưa
            // Select ktvRatings only if column is available
            const selectFields = useKtvRatings
                ? 'id, itemRating, status, technicianCodes, ktvRatings'
                : 'id, itemRating, status, technicianCodes';

            const { data: allItems, error: fetchError } = await supabaseAdmin
                .from('BookingItems')
                .select(selectFields)
                .eq('bookingId', bookingId);

            if (fetchError) {
                console.error('Error fetching items after rating:', fetchError);
                return NextResponse.json({ error: fetchError.message }, { status: 500 });
            }

            // Check all rated: for multi-KTV items with ktvRatings, check per-KTV
            const allRated = (allItems || []).length > 0 
                && (allItems || []).every((i: any) => {
                    const techCodes: string[] = i.technicianCodes || [];
                    if (useKtvRatings && techCodes.length > 1 && i.ktvRatings) {
                        // Multi-KTV with ktvRatings: check all tech codes rated
                        const ktvR: Record<string, number> = i.ktvRatings || {};
                        return techCodes.every((c: string) => ktvR[c.trim()] !== undefined);
                    }
                    // Fallback: check itemRating
                    return i.itemRating !== null && i.itemRating !== undefined;
                });

            if (allRated) {
                // Tất cả dịch vụ đã được đánh giá → KHÔNG ép booking DONE nữa. Trạng thái đơn tính từ
                // trạng thái các item (RPC dùng chung với quầy/KTV); KTV chưa bấm xong → đơn vẫn IN_PROGRESS.
                const bookingStatus = await recomputeBookingStatus(supabaseAdmin, bookingId);
                const { error: bookingError } = await supabaseAdmin
                    .from('Bookings')
                    .update({
                        ...(bookingStatus === 'DONE' && { timeEnd: new Date().toISOString() }),
                        ...(tipAmount !== undefined && { tipAmount }),
                        ...(feedbackNote !== undefined && { feedbackNote }),
                    })
                    .eq('id', bookingId);

                if (bookingError) {
                    console.error('Supabase booking DONE error:', bookingError);
                    return NextResponse.json({ error: bookingError.message }, { status: 500 });
                }

                return NextResponse.json({ success: true, allRated: true, bookingStatus }, { status: 200 });
            }

            return NextResponse.json({ success: true, allRated: false, itemId: bookingItemId }, { status: 200 });
        }

        // --- Booking-level update (legacy / non-item-specific) ---
        const updatePayload: any = {};

        // 'DONE' từ màn Feedback KHÔNG ghi thẳng: trạng thái đơn tính lại từ item sau khi lưu điểm.
        if (status && status !== 'DONE') updatePayload.status = status;
        if (violations !== undefined) updatePayload.violations = violations;
        if (rating !== undefined) {
            const ratingScale = await resolveRatingScale(supabaseAdmin, body.ratingScale);
            updatePayload.rating = clampRating(rating, ratingScale) ?? rating;
            if (await hasRatingScaleColumn(supabaseAdmin, 'Bookings')) updatePayload.rating_scale = ratingScale;
        }
        if (tipAmount !== undefined) updatePayload.tipAmount = tipAmount;
        if (feedbackNote !== undefined) updatePayload.feedbackNote = feedbackNote;

        const { data, error } = await supabaseAdmin
            .from('Bookings')
            .update(updatePayload)
            .eq('id', bookingId)
            .select()
            .maybeSingle();

        if (error) {
            console.error('Supabase update error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        if (!data) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }
        if (status === 'DONE') {
            const bookingStatus = await recomputeBookingStatus(supabaseAdmin, bookingId);
            if (bookingStatus === 'DONE' && !data.timeEnd) {
                await supabaseAdmin.from('Bookings').update({ timeEnd: new Date().toISOString() }).eq('id', bookingId);
            }
            return NextResponse.json({ success: true, booking: { ...data, status: bookingStatus } }, { status: 200 });
        }

        return NextResponse.json({ success: true, booking: data }, { status: 200 });

    } catch (error: any) {
        console.error('API Error updating journey:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
