import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { calculateMinDuration, lookupPrice, type VipPricingTable } from '@/lib/vipPricingEngine';

export const dynamic = 'force-dynamic';

// ─── Types ────────────────────────────────────────────────────────────────────

type BookingConfidence = 'CONFIRMED' | 'NEEDS_CONFIRM' | 'RISKY';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Get today's date in Vietnam timezone */
const getTodayVN = (): string =>
  new Date().toLocaleDateString('sv', { timeZone: 'Asia/Ho_Chi_Minh' });

/**
 * POST /api/booking/vip-appointment
 *
 * Pha 4: Nâng cấp với server-side validation:
 * 1. Re-validate pricing (không tin client)
 * 2. Validate duration >= minDuration
 * 3. Check KTVLeaveRequests → set confidence
 * 4. Check TurnQueue (walk-in) → BUSY warning
 * 5. Set booking status theo confidence
 * 6. Notification message theo confidence level
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ─── Step 1: Parse & Validate Input ──────────────────────────────────────
    const {
      customerName,
      customerPhone,
      customerEmail,
      selectedStaffIds,
      selectedSkills,   // string[] — skill IDs selected
      duration,         // number — minutes
      timeSlot,         // "HH:mm" | "BRANCH_DECIDE" | null
      appointmentDate,  // "YYYY-MM-DD" | null
      lang,
      // confidence from client — we re-validate server-side
      clientConfidence,
    } = body;

    if (!customerName?.trim())
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    if (!customerPhone?.trim())
      return NextResponse.json({ error: 'Customer phone is required' }, { status: 400 });
    if (!selectedStaffIds || selectedStaffIds.length === 0)
      return NextResponse.json({ error: 'At least one staff must be selected' }, { status: 400 });
    if (!duration || duration < 60)
      return NextResponse.json({ error: 'Duration is required (min 60 mins)' }, { status: 400 });

    const supabase = getSupabaseAdmin();
    if (!supabase)
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });

    const now = new Date();
    const targetDate = appointmentDate || getTodayVN();

    // ─── Step 2: Server-side Pricing Validation ───────────────────────────────
    const skills: string[] = Array.isArray(selectedSkills) ? selectedSkills : [];
    const { minDuration } = calculateMinDuration(skills);

    if (duration < minDuration) {
      return NextResponse.json({
        error: 'DURATION_TOO_SHORT',
        message: `Với ${skills.length} dịch vụ đã chọn, thời gian tối thiểu là ${minDuration} phút.`,
        minDuration,
      }, { status: 400 });
    }

    // Fetch pricing table from SystemConfigs
    const { data: pricingConfig } = await supabase
      .from('SystemConfigs')
      .select('value')
      .eq('key', 'menu_vip_pricing')
      .maybeSingle();

    let pricingTable: VipPricingTable | null = null;
    if (pricingConfig?.value) {
      const raw = pricingConfig.value;
      pricingTable = typeof raw === 'string' ? JSON.parse(raw) : raw;
    }

    // Re-calculate server-side price (không tin client)
    const serverPrice = pricingTable
      ? lookupPrice(pricingTable, selectedStaffIds.length, duration)
      : 0;

    // ─── Step 3: Server-side Availability Check → Confidence ─────────────────
    const warnings: string[] = [];
    let confidence: BookingConfidence = 'CONFIRMED';

    // 3a: Check KTVLeaveRequests
    const { data: leaveList } = await supabase
      .from('KTVLeaveRequests')
      .select('employeeId, status')
      .eq('date', targetDate)
      .in('status', ['APPROVED', 'PENDING'])
      .in('employeeId', selectedStaffIds);

    const onLeaveIds = new Set((leaveList ?? []).map((l: any) => l.employeeId));

    for (const staffId of selectedStaffIds) {
      if (onLeaveIds.has(staffId)) {
        const leaveRecord = leaveList?.find((l: any) => l.employeeId === staffId);
        const isApproved = leaveRecord?.status === 'APPROVED';
        warnings.push(
          isApproved
            ? `KTV ${staffId} đã được duyệt nghỉ ngày ${targetDate}`
            : `KTV ${staffId} đang chờ duyệt nghỉ ngày ${targetDate}`
        );
        confidence = 'RISKY'; // Escalate to RISKY
      }
    }

    // 3b: Check TurnQueue (walk-in: if today + no timeSlot → check busy)
    const isToday = targetDate === getTodayVN();
    const isWalkIn = !timeSlot || timeSlot === 'BRANCH_DECIDE';

    if (isToday && confidence !== 'RISKY') {
      const { data: tqList } = await supabase
        .from('TurnQueue')
        .select('employee_id, status, estimated_end_time')
        .eq('date', targetDate)
        .in('employee_id', selectedStaffIds);

      for (const tq of tqList ?? []) {
        if (tq.status === 'working' || tq.status === 'assigned') {
          const endTimeStr = tq.estimated_end_time
            ? `, dự kiến rảnh lúc ${tq.estimated_end_time}`
            : '';
          warnings.push(`KTV ${tq.employee_id} đang phục vụ khách${endTimeStr}`);
          if (confidence === 'CONFIRMED') confidence = 'NEEDS_CONFIRM';
        }
      }

      // If no TurnQueue record → staff not checked in yet
      const checkedInIds = new Set((tqList ?? []).map((t: any) => t.employee_id));
      for (const staffId of selectedStaffIds) {
        if (!checkedInIds.has(staffId) && !onLeaveIds.has(staffId)) {
          warnings.push(`KTV ${staffId} chưa điểm danh hôm nay`);
          if (confidence === 'CONFIRMED') confidence = 'NEEDS_CONFIRM';
        }
      }
    }

    // 3c: Future date → always NEEDS_CONFIRM (can't verify TurnQueue)
    if (!isToday && confidence === 'CONFIRMED') {
      confidence = 'NEEDS_CONFIRM';
    }

    // ─── Step 4: Generate Booking ID & Status ────────────────────────────────
    const vnTimeStr = now.toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
    const vnTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const dateCode = `${String(vnTime.getDate()).padStart(2, '0')}${String(vnTime.getMonth() + 1).padStart(2, '0')}${vnTime.getFullYear()}`;

    // Count to generate billCode
    const { count } = await supabase
      .from('Bookings')
      .select('*', { count: 'exact', head: true })
      .ilike('billCode', `%-${dateCode}`);

    const nextNum = (count || 0) + 1;
    const billCode = `${String(nextNum).padStart(3, '0')}-${dateCode}`;
    const branchCode = '11NDK'; // TODO: Dynamically pass this from frontend later
    const bookingId = `${branchCode}-${billCode}`;

    // Map confidence → booking status
    const bookingStatus = confidence === 'CONFIRMED' ? 'NEW' : 'PENDING_CONFIRM';

    // ─── Step 5: Build notes (rich metadata) ─────────────────────────────────
    const notesObj = {
      type: 'VIP_APPOINTMENT',
      confidence,
      warnings,
      selectedSkills: skills,
      selectedStaffIds,
      duration,
      timeSlot: timeSlot || 'BRANCH_DECIDE',
      appointmentDate: appointmentDate || null,
      serverPrice,          // validated server-side price
      clientLang: lang || 'vi',
      bookedAt: vnTimeStr,
      isRisky: confidence === 'RISKY',
      bufferWarning: false, // TODO Pha 4.5: check from timeline
    };

    // ─── Step 6: Insert Booking ───────────────────────────────────────────────
    const { data: booking, error: bookingError } = await supabase
      .from('Bookings')
      .insert({
        id: bookingId,
        billCode,
        branchName: 'Ngan Ha Spa',
        bookingDate: vnTimeStr,
        timeBooking: timeSlot && timeSlot !== 'BRANCH_DECIDE' ? timeSlot : null,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail?.trim() || null,
        customerLang: lang || 'vi',
        technicianCode: selectedStaffIds[0] || null,
        totalAmount: serverPrice || 0,
        paymentMethod: 'CASH', // default payment method
        source: 'VIP_MENU',
        status: bookingStatus,
        notes: JSON.stringify(notesObj),
        createdAt: vnTimeStr,
        updatedAt: vnTimeStr,
      })
      .select('id, billCode')
      .single();

    if (bookingError) {
      console.error('[VIP-Appointment] Insert error:', bookingError);
      return NextResponse.json(
        { error: 'Failed to create appointment', detail: bookingError.message },
        { status: 500 }
      );
    }

    // ─── Step 6.5: Insert Booking Items ───────────────────────────────────────
    const MAP_VIP_SKILL_TO_SERVICE_ID: Record<string, string> = {
      shampoo: 'NHS0202',
      earCombo: 'NHS0600',
      earChuyen: 'NHS0600',
      razorShave: 'NHS0700',
      machineShave: 'NHS0700',
      facial: 'NHS0301',
      nailCombo: 'NHS0500',
      nailChuyen: 'NHS0500',
      heelScrub: 'NHS0400',
      hairCut: 'NHS0701',
      hairExtensionShampoo: 'NHS0202',
      thaiBody: 'NHS0028',
      shiatsuBody: 'NHS0015',
      oilBody: 'NHS0001',
      hotStoneBody: 'NHS0022',
      bodyMix: 'NHS0040',
      foot: 'NHS0100',
    };

    const itemsToInsert = [];
    if (skills.length > 0) {
      skills.forEach((skillId, index) => {
        const serviceId = MAP_VIP_SKILL_TO_SERVICE_ID[skillId] || 'NHS0800';
        itemsToInsert.push({
          id: `${bookingId}-item${index + 1}`,
          bookingId: bookingId,
          serviceId: serviceId,
          quantity: 1,
          price: index === 0 ? (serverPrice || 0) : 0,
          technicianCodes: selectedStaffIds,
          status: 'WAITING',
        });
      });
    } else {
      itemsToInsert.push({
        id: `${bookingId}-item1`,
        bookingId: bookingId,
        serviceId: 'NHS0800',
        quantity: 1,
        price: serverPrice || 0,
        technicianCodes: selectedStaffIds,
        status: 'WAITING',
      });
    }

    const { error: itemsError } = await supabase
      .from('BookingItems')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error('[VIP-Appointment] BookingItems Insert error:', itemsError);
    }

    // ─── Step 7: Notification theo Confidence ────────────────────────────────
    try {
      const ktvDisplay = selectedStaffIds.join(', ');
      const timeDisplay = timeSlot && timeSlot !== 'BRANCH_DECIDE'
        ? `Hẹn lúc ${timeSlot}` : 'Walk-in / Tiệm quyết định';
      const dateDisplay = appointmentDate || getTodayVN();
      const priceDisplay = serverPrice > 0 ? `${serverPrice.toLocaleString('vi-VN')}đ` : '—';

      let notifEmoji: string;
      let notifPrefix: string;

      if (confidence === 'RISKY') {
        notifEmoji = '🔴';
        notifPrefix = 'ĐẶT LỊCH VIP KHẨN';
      } else if (confidence === 'NEEDS_CONFIRM') {
        notifEmoji = '⚠️';
        notifPrefix = 'Đặt lịch VIP CẦN XÁC NHẬN';
      } else {
        notifEmoji = '📋';
        notifPrefix = 'Đặt lịch VIP mới';
      }

      let notifMessage =
        `${notifEmoji} ${notifPrefix}\n` +
        `👤 ${customerName.trim()} — ${customerPhone.trim()}\n` +
        `👨‍⚕️ KTV: ${ktvDisplay}\n` +
        `⏱️ ${duration} phút · ${priceDisplay}\n` +
        `📅 ${dateDisplay} — ${timeDisplay}`;

      // Append warnings for non-CONFIRMED
      if (warnings.length > 0) {
        notifMessage += `\n⚡ ${warnings.join(' | ')}`;
      }

      await supabase.from('StaffNotifications').insert({
        bookingId: bookingId,
        employeeId: null, // null = broadcast to all admin/reception
        type: 'NEW_ORDER',
        message: notifMessage,
        isRead: false,
        createdAt: now.toISOString(),
      });
    } catch (notifErr) {
      // Non-critical: log but don't fail
      console.error('[VIP-Appointment] Notification error:', notifErr);
    }

    // ─── Step 8: Return Response ──────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      billCode: booking.billCode,
      confidence,
      warnings,
      serverPrice,
      bookingStatus,
      message: confidence === 'CONFIRMED'
        ? 'Đặt lịch VIP thành công!'
        : 'Đặt lịch VIP đã ghi nhận — tiệm sẽ liên hệ xác nhận.',
    });

  } catch (error: any) {
    console.error('[VIP-Appointment] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
