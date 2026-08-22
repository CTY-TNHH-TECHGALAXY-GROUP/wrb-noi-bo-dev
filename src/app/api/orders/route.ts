import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import crypto from 'node:crypto';
import { generateAccessToken } from '@/lib/token';
import { handleStandardItems } from './handleStandardItems';
import { handleVipItems } from './handleVipItems';
import { ALL_VIP_SKILLS, type VipLang } from '@/lib/vipSkills.constants';
import { getSkillName } from '@/lib/vipStaffUtils';

const SKILL_MAP = Object.fromEntries(ALL_VIP_SKILLS.map(s => [s.id, s]));

const DAY_CUTOFF_HOUR = 8; // Reset day at 8:00 AM

export async function POST(request: Request) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        if (!supabaseAdmin) throw new Error("Supabase Admin client not initialized");
        const body = await request.json();
        const { customer, items, paymentMethod, amountPaid, totalVND, lang, vatInvoice, preBookingId } = body;

        // Normalize language code to prevent mismatch (e.g. 'VN' → 'vi', 'vn' → 'vi')
        const VALID_LANGS = ['vi', 'en', 'kr', 'jp', 'cn'];
        const normalizedLang = (() => {
            const raw = (lang || '').toLowerCase().trim();
            return VALID_LANGS.includes(raw) ? raw : 'vi';
        })();
        console.log(`[POST /api/orders] lang from body: "${lang}", normalized: "${normalizedLang}"`);

        const now = new Date();
        const vnDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
        const currentHour = vnDate.getHours();

        const businessDate = new Date(vnDate);
        if (currentHour < DAY_CUTOFF_HOUR) {
            businessDate.setDate(businessDate.getDate() - 1);
        }

        const day = businessDate.getDate().toString().padStart(2, '0');
        const month = (businessDate.getMonth() + 1).toString().padStart(2, '0');
        const year = businessDate.getFullYear();

        const dateCode = `${day}${month}${year}`;

        // 1. Generate Bill Number
        // Lấy tất cả mã bill trong ngày để tìm số lớn nhất (tránh lỗi khi có đơn bị xoá)
        const { data: existingBookings } = await supabaseAdmin
            .from('Bookings')
            .select('billCode')
            .ilike('billCode', `%-${dateCode}`);

        let maxNumber = 0;
        
        if (existingBookings && existingBookings.length > 0) {
            existingBookings.forEach((item: any) => {
                if (item.billCode) {
                    const codePart = item.billCode.split('-')[0];
                    const num = parseInt(codePart, 10);
                    if (!isNaN(num) && num > maxNumber) {
                        maxNumber = num;
                    }
                }
            });
        }

        const nextNum = maxNumber + 1;
        const billNum = `${String(nextNum).padStart(3, '0')}-${dateCode}`;
        const branchCode = '11NDK';
        const customId = `${branchCode}-${billNum}`;

        // 2. Separate items by type
        const standardItems = items.filter((i: any) => i.itemType !== 'vip');
        const vipItems = items.filter((i: any) => i.itemType === 'vip');
        const hasStandard = standardItems.length > 0;
        const hasVip = vipItems.length > 0;

        // Determine source
        const source = hasVip && hasStandard
            ? 'MIXED_WALK_IN'
            : hasVip
                ? 'VIP_WALK_IN'
                : 'STANDARD_WALK_IN';

        console.log(`[POST /api/orders] source: ${source}, standard: ${standardItems.length}, vip: ${vipItems.length}`);

        const vnTimeStr = new Date().toISOString();

        // 2.5 Generate or find Customer ID
        let customerId = customer.id;

        if (!customerId && (customer.email || customer.phone)) {
            let query = supabaseAdmin.from('Customers').select('id');

            if (customer.email && customer.phone) {
                query = query.or(`email.eq.${customer.email},phone.eq.${customer.phone}`);
            } else if (customer.email) {
                query = query.eq('email', customer.email);
            } else if (customer.phone) {
                query = query.eq('phone', customer.phone);
            }

            const { data: existingCustomer } = await query.limit(1).maybeSingle();
            if (existingCustomer) {
                customerId = existingCustomer.id;
            }
        }

        if (!customerId) {
            customerId = `CUS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        }

        const fallbackId = Date.now().toString();
        // Normalize gender: 'Male' → 'male', 'Female' → 'female', 'Nam' → 'male', 'Nữ' → 'female'
        const normalizeGender = (g: string | undefined | null): string | null => {
            if (!g) return null;
            const lower = g.toLowerCase().trim();
            if (lower === 'male' || lower === 'nam') return 'male';
            if (lower === 'female' || lower === 'nữ' || lower === 'nu') return 'female';
            return null;
        };
        const normalizedGender = normalizeGender(customer.gender);

        const customerData: Record<string, any> = {
            id: customerId,
            fullName: customer.name || "Guest",
            phone: customer.phone?.trim() || `GUEST-${fallbackId}`,
            email: customer.email?.trim() || `guest-${fallbackId}@no-email.com`,
            ...(normalizedGender && { gender: normalizedGender }),
            createdAt: vnTimeStr,
            updatedAt: vnTimeStr
        };

        // Add VAT invoice info if provided
        console.log('[API Order] vatInvoice received:', JSON.stringify(vatInvoice));
        if (vatInvoice && vatInvoice.taxCode) {
            customerData.taxCode = vatInvoice.taxCode;
            customerData.companyName = vatInvoice.companyName || null;
            customerData.companyAddress = vatInvoice.companyAddress || null;
            customerData.companyEmail = vatInvoice.companyEmail || null;
            customerData.companyPhone = vatInvoice.companyPhone || null;
            console.log('[API Order] VAT data added to customerData:', {
                taxCode: customerData.taxCode,
                companyName: customerData.companyName,
                companyAddress: customerData.companyAddress,
                companyEmail: customerData.companyEmail,
                companyPhone: customerData.companyPhone
            });
        }

        console.log('[API Order] Final customerData keys:', Object.keys(customerData));
        const { error: customerError } = await supabaseAdmin
            .from('Customers')
            .upsert(customerData, { onConflict: 'id', ignoreDuplicates: false });

        if (customerError) {
            console.error("⚠️ [API Order] Lỗi lưu thông tin khách hàng:", customerError);
        }

        // 3. Create Booking (1 booking for all items)
        const accessToken = generateAccessToken();
        const { data: booking, error: bookingError } = await supabaseAdmin
            .from('Bookings')
            .insert({
                id: customId,
                customerId: customerId,
                customerName: customer.name || "Guest",
                customerPhone: customer.phone || "",
                customerEmail: customer.email || "",
                totalAmount: totalVND,
                paymentMethod: paymentMethod,
                createdAt: vnTimeStr,
                updatedAt: vnTimeStr,
                status: 'NEW',
                billCode: billNum,
                customerLang: normalizedLang,
                accessToken: accessToken,
                source: source
            })
            .select()
            .single();

        if (bookingError) throw bookingError;

        // 3.5 Update PreBookings if applicable
        if (preBookingId) {
            const { error: preBookingError } = await supabaseAdmin
                .from('PreBookings')
                .update({ status: 'CONVERTED' })
                .eq('id', preBookingId);
            
            if (preBookingError) {
                console.error("⚠️ [API Order] Lỗi cập nhật PreBookings:", preBookingError);
            }
        }

        // 4. Delegate to handlers (separated for isolation)
        if (hasStandard) {
            await handleStandardItems(supabaseAdmin, customId, standardItems, 0);
        }
        if (hasVip) {
            await handleVipItems(supabaseAdmin, customId, vipItems, standardItems.length);
        }

        // 5. Build and Send Notification
        try {
            let notifMessage = `📋 ĐƠN HÀNG MỚI (Giỏ Hàng)\n`;
            notifMessage += `👤 ${customerData.fullName} — ${customerData.phone}\n`;
            notifMessage += `💰 Tổng thanh toán: ${totalVND.toLocaleString('vi-VN')}đ (${paymentMethod})\n\n`;

            if (hasVip) {
                notifMessage += `📦 DỊCH VỤ VIP:\n`;
                vipItems.forEach((item: any) => {
                    const ktv = item.vipStaffId ? ` | KTV: ${item.vipStaffId}` : '';
                    // Dịch lại tiếng Việt cho thông báo để nhân viên dễ hiểu
                    const skillIds: string[] = item.vipSkillIds || [];
                    const skillNames = skillIds.map((id: string) => {
                        let name = SKILL_MAP[id]?.name?.vi || id;
                        if (name.toLowerCase().includes('ráy')) name = 'Ráy';
                        if (name.toLowerCase().includes('nail') || name.toLowerCase().includes('móng')) name = 'Nail';
                        return name;
                    });
                    const uniqueSkillNames = [...new Set(skillNames)];
                    const vnDisplayName = uniqueSkillNames.length > 0 ? uniqueSkillNames.join(' + ') : 'Gói VIP';
                    
                    notifMessage += `- ${vnDisplayName} (${item.vipDuration || 60}p)${ktv}\n`;
                    if (item.vipCustomerNotes && item.vipCustomerNotes.trim()) {
                        notifMessage += `  📝 Ghi chú: ${item.vipCustomerNotes.trim()}\n`;
                    }
                });
                notifMessage += `\n`;
            }

            if (hasStandard) {
                notifMessage += `📦 DỊCH VỤ THƯỜNG:\n`;
                standardItems.forEach((item: any) => {
                    const itemName = item.names?.vi || item.name || item.id || 'Dịch vụ';
                    notifMessage += `- ${itemName} x${item.qty}\n`;
                });
                notifMessage += `\n`;
            }

            await supabaseAdmin.from('StaffNotifications').insert({
                bookingId: customId,
                employeeId: null, // null = broadcast to all admin/reception
                type: 'NEW_ORDER',
                message: notifMessage.trim(),
                isRead: false,
                createdAt: vnTimeStr,
            });
            
            // Cập nhật lại notes cho Bookings để hiển thị trên Admin Dashboard nếu có VIP notes
            const allVipNotes = vipItems
                .map((item: any) => item.vipCustomerNotes?.trim())
                .filter(Boolean);
            
            if (allVipNotes.length > 0) {
                const notesObj = {
                    type: 'CHECKOUT_CART',
                    source,
                    vipCustomerNotes: allVipNotes.join(' | ')
                };
                await supabaseAdmin
                    .from('Bookings')
                    .update({ notes: JSON.stringify(notesObj) })
                    .eq('id', customId);
            }

        } catch (notifErr) {
            console.error('[API Order] Notification error:', notifErr);
        }

        return NextResponse.json({ success: true, billNum, bookingId: customId, accessToken });
    } catch (error: any) {
        console.error("❌ API Order Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        if (!supabaseAdmin) throw new Error("Supabase Admin client not initialized");
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');
        const phone = searchParams.get('phone');

        if (!email && !phone) {
            return NextResponse.json({ success: false, error: 'Email or phone required' }, { status: 400 });
        }

        // Build query with email OR phone
        let query = supabaseAdmin
            .from('Bookings')
            .select(`
                id,
                billCode,
                totalAmount,
                bookingDate,
                createdAt,
                timeBooking,
                notes,
                focusAreaNote,
                status,
                rating,
                technicianCode,
                accessToken,
                BookingItems!BookingItems_bookingId_fkey (
                    id,
                    serviceId,
                    quantity,
                    price,
                    options,
                    itemRating,
                    ktvRatings,
                    itemFeedback,
                    technicianCodes
                )
            `);

        if (email && phone) {
            query = query.or(`customerEmail.eq.${email},customerPhone.eq.${phone}`);
        } else if (email) {
            query = query.eq('customerEmail', email);
        } else if (phone) {
            query = query.eq('customerPhone', phone);
        }

        const { data: bookings, error } = await query
            .order('bookingDate', { ascending: false });

        if (error) throw error;

        // Fetch all services to map names
        const { data: allServices } = await supabaseAdmin
            .from('Services')
            .select('id, nameVN, nameEN, nameCN, nameKR, nameJP, duration')
            .limit(1000);

        const svcMap = new Map();
        if (allServices) {
            allServices.forEach((s: any) => {
                if (s.id) svcMap.set(String(s.id).trim().toLowerCase(), s);
            });
        }

        // Fetch staff names for technicianCodes (booking-level + item-level)
        const allTechCodes = new Set<string>();
        bookings.forEach((b: any) => {
            if (b.technicianCode) allTechCodes.add(b.technicianCode);
            b.BookingItems?.forEach((i: any) => {
                if (i.technicianCodes && Array.isArray(i.technicianCodes)) {
                    i.technicianCodes.forEach((code: string) => allTechCodes.add(code));
                }
                if (i.ktvRatings && typeof i.ktvRatings === 'object') {
                    Object.keys(i.ktvRatings).forEach((code: string) => allTechCodes.add(code));
                }
            });
        });
        const techCodes = [...allTechCodes];
        const staffMap = new Map<string, string>();
        if (techCodes.length > 0) {
            const { data: staffList } = await supabaseAdmin
                .from('Staff')
                .select('id, fullName')
                .in('id', techCodes);

            if (staffList) {
                staffList.forEach((s: any) => {
                    if (s.id) staffMap.set(s.id, s.fullName || s.id);
                });
            }
        }

        const result = bookings.map((b: any) => {
            // Format datetime: prefer createdAt, fallback to bookingDate
            const rawDate = b.createdAt || b.bookingDate;
            let formattedDate = '';
            try {
                let dateStr = String(rawDate);
                if (dateStr && !dateStr.endsWith('Z') && !dateStr.match(/([+-]\d{2}:?\d{2})$/)) {
                    // Nếu thời gian lưu trong DB chưa có múi giờ, mặc định nó là UTC do server push lên
                    dateStr += 'Z';
                }
                const d = new Date(dateStr);
                const formatter = new Intl.DateTimeFormat('en-GB', {
                    timeZone: 'Asia/Ho_Chi_Minh',
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit', hour12: false
                });
                formattedDate = formatter.format(d).replace(',', '');
            } catch {
                formattedDate = rawDate ? String(rawDate).split('T')[0] : '';
            }

            // Parse real notes from DB
            let customerNote = '';
            if (b.focusAreaNote) {
                customerNote = b.focusAreaNote;
            }
            if (b.notes) {
                try {
                    const parsed = JSON.parse(b.notes);
                    if (parsed?.vipCustomerNotes) {
                        customerNote = customerNote ? `${customerNote} | ${parsed.vipCustomerNotes}` : parsed.vipCustomerNotes;
                    }
                } catch {
                    // notes is plain text
                    if (b.notes !== 'Supabase Booking') {
                        customerNote = customerNote ? `${customerNote} | ${b.notes}` : b.notes;
                    }
                }
            }

            // Lọc bỏ phần đánh giá KTV (ví dụ: "[Đánh giá KTV: Khách Dễ Thương]") để không cho khách hàng thấy
            if (customerNote) {
                customerNote = customerNote.replace(/\[Đánh giá KTV:.*?\]/gi, '').trim();
                customerNote = customerNote.replace(/(^\|\s*)|(\s*\|\s*$)/g, '').trim();
            }

            return {
                id: b.id,
                date: formattedDate,
                timeBooking: b.timeBooking || null,
                total: b.totalAmount,
                status: b.status,
                rating: b.rating,
                technicianCode: b.technicianCode || null,
                staffName: b.technicianCode ? (staffMap.get(b.technicianCode) || b.technicianCode) : null,
                items: b.BookingItems.map((i: any) => {
                    const sId = String(i.serviceId || '').trim().toLowerCase();
                    const svc = svcMap.get(sId);
                    
                    const namesObj: Record<string, string> = {
                        vi: '', en: '', jp: '', kr: '', cn: ''
                    };
                    
                    const isVip = i.options?.selectedSkills && Array.isArray(i.options.selectedSkills) && i.options.selectedSkills.length > 0;
                    
                    if (isVip) {
                        const langs: VipLang[] = ['vi', 'en', 'jp', 'kr', 'cn'];
                        langs.forEach(langCode => {
                            const skillNames = i.options.selectedSkills.map((id: string) => {
                                const s = SKILL_MAP[id];
                                return s ? getSkillName(s, langCode) : id;
                            });
                            const uniqueNames = [...new Set(skillNames)];
                            namesObj[langCode] = uniqueNames.length > 0 ? uniqueNames.join(' + ') : (i.options.displayName || 'VIP Bespoke');
                        });
                    } else {
                        // Ưu tiên tên từ Database, fallback xuống displayName nếu DB rỗng
                        namesObj.vi = svc?.nameVN || i.options?.displayName || '';
                        namesObj.en = svc?.nameEN || svc?.nameVN || i.options?.displayName || '';
                        namesObj.jp = svc?.nameJP || svc?.nameEN || svc?.nameVN || i.options?.displayName || '';
                        namesObj.kr = svc?.nameKR || svc?.nameEN || svc?.nameVN || i.options?.displayName || '';
                        namesObj.cn = svc?.nameCN || svc?.nameEN || svc?.nameVN || i.options?.displayName || '';
                    }

                    const finalName = i.options?.displayName || svc?.nameVN || svc?.nameEN || `Dịch vụ ${i.serviceId}`;
                    const finalDuration = i.options?.vipDuration || svc?.duration || null;

                    // Map KTV names for this item
                    const itemStaffNames = (i.technicianCodes || []).map((code: string) => staffMap.get(code) || code);

                    // Per-KTV ratings
                    let ktvRatingDetails: { code: string; name: string; rating: number }[] = [];
                    if (i.ktvRatings && typeof i.ktvRatings === 'object') {
                        ktvRatingDetails = Object.entries(i.ktvRatings).map(([code, rating]) => ({
                            code,
                            name: staffMap.get(code) || code,
                            rating: Number(rating),
                        }));
                    }

                    return {
                        id: i.serviceId,
                        name: finalName,
                        names: namesObj,
                        duration: finalDuration,
                        qty: i.quantity,
                        price: i.price,
                        options: i.options,
                        itemRating: i.itemRating || null,
                        itemFeedback: i.itemFeedback || null,
                        staffNames: itemStaffNames,
                        ktvRatings: ktvRatingDetails,
                    };
                }),
                note: customerNote || null,
                accessToken: b.accessToken || null,
            };
        });

        return NextResponse.json({ success: true, orders: result });
    } catch (error: any) {
        console.error("❌ API GET Order Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
