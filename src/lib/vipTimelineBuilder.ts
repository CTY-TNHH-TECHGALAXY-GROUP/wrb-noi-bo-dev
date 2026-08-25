// =============================================
// 📅 VIP MENU — TIMELINE BUILDER
// Builds a 15-minute slot array (08:00→22:00 = 56 slots)
// showing KTV availability for a given date.
// =============================================

// 🔧 CONFIGURATION
const TIMELINE_START_HOUR = 8;   // 08:00
const TIMELINE_END_HOUR = 22;    // 22:00
const SLOT_MINUTES = 15;         // 15 minutes per slot
const BUFFER_MINUTES = 30;       // Free slots within 30min of busy = bufferWarning
const TOTAL_SLOTS = ((TIMELINE_END_HOUR - TIMELINE_START_HOUR) * 60) / SLOT_MINUTES; // 56

// --- Slot Types ---
export type SlotStatus =
  | 'FREE'            // Rảnh, có thể đặt
  | 'BUSY'            // Đang phục vụ (confirmed)
  | 'BUSY_ESTIMATED'  // Đơn hẹn giờ (dự kiến)
  | 'VIP_BOOKED'      // VIP đã đặt trước
  | 'OFF_SHIFT'       // Ngoài giờ ca làm việc
  | 'BUFFER_WARNING'; // Rảnh nhưng sát đơn bận (< 30p buffer)

export interface TimeSlot {
  slotIndex: number;   // 0-55
  time: string;        // "08:00", "08:15", ...
  status: SlotStatus;
  orderId?: string;    // Booking ID nếu BUSY/VIP_BOOKED
  suggested?: boolean; // Slot được gợi ý (khoảng rảnh tối ưu)
}

export interface TimelineResult {
  ktvId: string;
  date: string;
  slots: TimeSlot[];
  suggestedSlots: number[]; // slotIndex[] các khoảng rảnh tối ưu
}

// --- Shift type to hours mapping ---
const SHIFT_HOURS: Record<string, { start: number; end: number }> = {
  SHIFT_1: { start: 9, end: 17 },
  SHIFT_2: { start: 11, end: 19 },
  SHIFT_3: { start: 17, end: 24 },
  FREE:    { start: 8, end: 22 },
  REQUEST: { start: 8, end: 22 }, // Default full day for custom
};

// --- Helpers ---

/** Convert "HH:mm" to slot index (0-based from 08:00) */
export const timeToSlotIndex = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  const minutesFrom8 = (h - TIMELINE_START_HOUR) * 60 + m;
  return Math.floor(minutesFrom8 / SLOT_MINUTES);
};

/** Convert minutes-from-midnight to slot index */
export const minutesToSlotIndex = (totalMinutes: number): number => {
  const minutesFrom8 = totalMinutes - TIMELINE_START_HOUR * 60;
  return Math.floor(minutesFrom8 / SLOT_MINUTES);
};

/** Convert slot index to "HH:mm" string */
export const slotIndexToTime = (index: number): string => {
  const totalMinutes = TIMELINE_START_HOUR * 60 + index * SLOT_MINUTES;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/** Convert duration in minutes to number of slots */
const minutesToSlots = (minutes: number): number =>
  Math.ceil(minutes / SLOT_MINUTES);

/**
 * Build initial slot array — all FREE.
 */
const buildInitialSlots = (): TimeSlot[] =>
  Array.from({ length: TOTAL_SLOTS }, (_, i) => ({
    slotIndex: i,
    time: slotIndexToTime(i),
    status: 'FREE' as SlotStatus,
  }));

/**
 * Mark a range of slots with a given status.
 * Clamps to valid range [0, TOTAL_SLOTS).
 */
const markSlots = (
  slots: TimeSlot[],
  fromSlot: number,
  toSlot: number, // exclusive
  status: SlotStatus,
  orderId?: string
): void => {
  const start = Math.max(0, fromSlot);
  const end = Math.min(TOTAL_SLOTS, toSlot);
  for (let i = start; i < end; i++) {
    // Don't downgrade from more specific statuses
    if (slots[i].status === 'FREE' || slots[i].status === 'BUFFER_WARNING') {
      slots[i].status = status;
      if (orderId) slots[i].orderId = orderId;
    }
  }
};

/**
 * Apply OFF_SHIFT slots based on shift type.
 * Slots outside working hours are OFF_SHIFT.
 */
const applyShiftMask = (slots: TimeSlot[], shiftType: string): void => {
  const shift = SHIFT_HOURS[shiftType] || SHIFT_HOURS.FREE;

  // Before shift start
  const shiftStartSlot = Math.max(0, (shift.start - TIMELINE_START_HOUR) * (60 / SLOT_MINUTES));
  // After shift end
  const shiftEndSlot = Math.min(TOTAL_SLOTS, (shift.end - TIMELINE_START_HOUR) * (60 / SLOT_MINUTES));

  for (let i = 0; i < shiftStartSlot; i++) {
    if (slots[i].status === 'FREE') slots[i].status = 'OFF_SHIFT';
  }
  for (let i = shiftEndSlot; i < TOTAL_SLOTS; i++) {
    if (slots[i].status === 'FREE') slots[i].status = 'OFF_SHIFT';
  }
};

/**
 * Apply BUFFER_WARNING to FREE slots within 30 minutes of a BUSY/BUSY_ESTIMATED slot.
 * Both before and after busy blocks get buffer warning.
 */
const applyBufferWarnings = (slots: TimeSlot[]): void => {
  const bufferSlots = minutesToSlots(BUFFER_MINUTES); // 2 slots = 30min

  for (let i = 0; i < TOTAL_SLOTS; i++) {
    const s = slots[i].status;
    if (s === 'BUSY' || s === 'BUSY_ESTIMATED' || s === 'VIP_BOOKED') {
      // Mark buffer BEFORE this slot
      for (let b = Math.max(0, i - bufferSlots); b < i; b++) {
        if (slots[b].status === 'FREE') {
          slots[b].status = 'BUFFER_WARNING';
        }
      }
      // Mark buffer AFTER this slot
      for (let b = i + 1; b < Math.min(TOTAL_SLOTS, i + 1 + bufferSlots); b++) {
        if (slots[b].status === 'FREE') {
          slots[b].status = 'BUFFER_WARNING';
        }
      }
    }
  }
};

/**
 * Find suggested slots: contiguous FREE runs of at least minDurationMinutes.
 * Returns the starting slot index of each valid run.
 */
const findSuggestedSlots = (slots: TimeSlot[], minDurationMinutes: number): number[] => {
  const minSlots = minutesToSlots(minDurationMinutes);
  const suggested: number[] = [];

  let runStart = -1;
  let runLength = 0;

  for (let i = 0; i <= TOTAL_SLOTS; i++) {
    const isFree = i < TOTAL_SLOTS && slots[i].status === 'FREE';

    if (isFree) {
      if (runStart === -1) runStart = i;
      runLength++;
    } else {
      if (runLength >= minSlots && runStart !== -1) {
        suggested.push(runStart);
      }
      runStart = -1;
      runLength = 0;
    }
  }

  return suggested;
};

// =============================================
// 📊 MAIN BUILDER — Input Data Types
// =============================================

export interface TimelineInput {
  ktvId: string;
  date: string; // YYYY-MM-DD

  // From TurnQueue
  turnQueueStatus?: 'waiting' | 'working' | 'assigned' | 'off' | null;
  estimatedEndTime?: string | null; // "HH:mm" — when BUSY, until when

  // From Bookings (active bookings for this KTV on this date)
  bookings: {
    id: string;
    timeBooking: string | null;   // "HH:mm" — scheduled start
    duration: number | null;       // minutes (from notes or default)
    status: string;
    isVipAppointment: boolean;
  }[];

  // From KTVShiftRecords
  shiftType?: string | null; // SHIFT_1 | SHIFT_2 | SHIFT_3 | FREE | REQUEST | null

  // For suggested slots
  minDurationMinutes?: number; // default 60
}

/**
 * Main function: build the timeline for one KTV on one date.
 */
export const buildVipTimeline = (input: TimelineInput): TimelineResult => {
  const slots = buildInitialSlots();
  const { ktvId, date, bookings, turnQueueStatus, estimatedEndTime, shiftType, minDurationMinutes = 60 } = input;

  // --- Step 1: Apply shift mask (OFF_SHIFT) ---
  if (shiftType && shiftType !== 'FREE' && shiftType !== 'REQUEST') {
    applyShiftMask(slots, shiftType);
  }

  // --- Step 2: Mark BUSY from TurnQueue (currently working) ---
  if (turnQueueStatus === 'working' && estimatedEndTime) {
    const endSlot = timeToSlotIndex(estimatedEndTime) + 1;
    // Mark from beginning of timeline to estimated end
    markSlots(slots, 0, endSlot, 'BUSY');
  }

  // --- Step 3: Mark bookings ---
  for (const booking of bookings) {
    if (!booking.timeBooking) continue;

    const startSlot = timeToSlotIndex(booking.timeBooking);
    const durationMinutes = booking.duration ?? 60;
    const endSlot = startSlot + minutesToSlots(durationMinutes);

    if (booking.isVipAppointment) {
      markSlots(slots, startSlot, endSlot, 'VIP_BOOKED', booking.id);
    } else if (
      booking.status === 'IN_PROGRESS' ||
      booking.status === 'PREPARING' ||
      booking.status === 'READY'
    ) {
      markSlots(slots, startSlot, endSlot, 'BUSY', booking.id);
    } else if (
      booking.status === 'NEW' ||
      booking.status === 'PENDING_CONFIRM'
    ) {
      markSlots(slots, startSlot, endSlot, 'BUSY_ESTIMATED', booking.id);
    }
  }

  // --- Step 4: Apply buffer warnings ---
  applyBufferWarnings(slots);

  // --- Step 5: Find suggested slots ---
  const suggestedSlotIndices = findSuggestedSlots(slots, minDurationMinutes);

  // Mark suggested on the slot objects
  for (const idx of suggestedSlotIndices) {
    if (slots[idx].status === 'FREE') {
      slots[idx].suggested = true;
    }
  }

  return {
    ktvId,
    date,
    slots,
    suggestedSlots: suggestedSlotIndices,
  };
};

/**
 * Intersect timelines of multiple KTVs.
 * A slot is FREE only if ALL KTVs have it FREE.
 * Returns merged slots with the most restrictive status.
 */
export const intersectTimelines = (timelines: TimelineResult[], minDurationMinutes = 60): TimeSlot[] => {
  if (timelines.length === 0) return buildInitialSlots();
  if (timelines.length === 1) return timelines[0].slots;

  return timelines[0].slots.map((baseSlot, i) => {
    // Priority: BUSY > VIP_BOOKED > BUSY_ESTIMATED > OFF_SHIFT > BUFFER_WARNING > FREE
    const PRIORITY: Record<SlotStatus, number> = {
      BUSY: 5,
      VIP_BOOKED: 4,
      BUSY_ESTIMATED: 3,
      OFF_SHIFT: 2,
      BUFFER_WARNING: 1,
      FREE: 0,
    };

    let worstStatus = baseSlot.status;
    for (let t = 1; t < timelines.length; t++) {
      const other = timelines[t].slots[i];
      if (PRIORITY[other.status] > PRIORITY[worstStatus]) {
        worstStatus = other.status;
      }
    }

    return {
      ...baseSlot,
      status: worstStatus,
      suggested: worstStatus === 'FREE',
    };
  });
};
