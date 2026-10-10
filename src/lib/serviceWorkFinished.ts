/**
 * Khách chấm sao KHÔNG được tự kết thúc dịch vụ.
 *
 * Trạng thái `DONE` của BookingItems thuộc về luồng KTV (repo Quản trị: `handleFinishService`
 * + RPC `ktv_release_work_atomic`): DONE chỉ khi KTV đã bấm Kết thúc (mọi chặng đã bắt đầu có
 * `actualEndTime`), đã bàn giao (`handoverTime`) và khách đã chấm. Hàm này sao chép đúng
 * `segmentProgress` ở `lib/dispatch-status.ts` của repo Quản trị để WRB không tự đặt DONE sớm.
 *
 * Ca T027 10/10/2026 (đơn 11NDK-005-10102026): khách chấm 5 sao lúc 18:19 khi KTV chưa bấm xong →
 * route này ghi DONE → app KTV nhảy sang Đánh giá → bàn giao 409 "No completed live work to
 * release" → T027 kẹt phân công + sổ tua hơn 1 giờ.
 */
export type ServiceWorkProgress = {
    /** Không có chặng KTV nào (dịch vụ tiện ích / dịch vụ "sau" đã gộp) → không có gì để bảo vệ. */
    noKtvWork: boolean;
    /** Mọi chặng đã bắt đầu đều có actualEndTime và không còn chặng có KTV chưa bắt đầu. */
    allSegsDone: boolean;
    /** Mọi chặng đã bắt đầu đều có handoverTime. */
    allHandovered: boolean;
};

type Segment = Record<string, unknown>;

export function parseSegments(raw: unknown): Segment[] {
    let value: unknown = raw;
    try {
        for (let i = 0; i < 2 && typeof value === 'string'; i++) value = JSON.parse(value);
    } catch {
        return [];
    }
    return Array.isArray(value)
        ? value.filter((s): s is Segment => !!s && typeof s === 'object' && !Array.isArray(s))
        : [];
}

export function serviceWorkProgress(rawSegments: unknown): ServiceWorkProgress {
    const live = parseSegments(rawSegments).filter(s => s.voided !== true && s.voided !== 'true');
    const started = live.filter(s => !!s.actualStartTime);
    const hasUnstartedSegs = live.some(s => !s.actualStartTime && !!s.ktvId);
    return {
        noKtvWork: live.length === 0,
        allSegsDone: started.length > 0 && started.every(s => !!s.actualEndTime) && !hasUnstartedSegs,
        allHandovered: started.length > 0 && started.every(s => !!s.handoverTime),
    };
}

/**
 * Khách vừa chấm sao: được phép ghi `status = 'DONE'` cho item này không?
 * - Item đã CANCELLED → không bao giờ (huỷ là trạng thái chốt; trước đây bị đè thành DONE).
 * - Không có chặng KTV → giữ hành vi cũ (DONE), không ai bị kẹt.
 * - Có chặng → chỉ DONE khi KTV đã xong VÀ đã bàn giao (cùng điều kiện với finish handler).
 *   Chưa đủ → không đụng status; KTV bấm Kết thúc / bàn giao xong thì phía Quản trị tự tính DONE
 *   (đã có điểm → `alreadyRated`).
 */
export function customerRatingMayCloseItem(rawSegments: unknown, currentStatus?: unknown): boolean {
    if (String(currentStatus ?? '').toUpperCase() === 'CANCELLED') return false;
    const p = serviceWorkProgress(rawSegments);
    return p.noKtvWork || (p.allSegsDone && p.allHandovered);
}
