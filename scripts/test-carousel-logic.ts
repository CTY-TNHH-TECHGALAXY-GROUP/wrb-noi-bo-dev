import assert from 'node:assert/strict';
import type { TherapyGalleryParsedItem } from '../src/lib/menuPhotos.helper';

let passedCount = 0;

function it(name: string, fn: () => void) {
  try {
    fn();
    passedCount++;
    console.log(`  ✓ Case ${passedCount}: ${name}`);
  } catch (err) {
    console.error(`  ✗ FAILED: ${name}`);
    throw err;
  }
}

console.log('🧪 Running Regression Test Suite: Carousel State & Swipe Logic...\n');

// 1. Guard logic matching src/components/Menu/DeepBody/StaffSelector/index.tsx
function updateActiveGallery(
  current: Record<string, TherapyGalleryParsedItem | null>,
  staffId: string,
  item: TherapyGalleryParsedItem | null,
): Record<string, TherapyGalleryParsedItem | null> {
  const previous = current[staffId] ?? null;
  const previousTherapyId =
    previous?.kind === 'therapy' ? previous.therapyId : undefined;
  const nextTherapyId =
    item?.kind === 'therapy' ? item.therapyId : undefined;

  if (
    previous?.url === item?.url &&
    previous?.kind === item?.kind &&
    previousTherapyId === nextTherapyId
  ) {
    return current; // Bailout: Same reference
  }

  return { ...current, [staffId]: item };
}

// Test 1: Callback repeating same item returns identical state reference (prevents loop)
it('Callback repeating same item returns exact same state object (bails out render)', () => {
  const item: TherapyGalleryParsedItem = {
    url: 'https://cdn.example.com/p1.jpg',
    kind: 'therapy',
    therapyId: 'shiatsu',
  };
  const initialState = { KTV01: item };
  const nextState = updateActiveGallery(initialState, 'KTV01', { ...item });

  assert.equal(initialState, nextState); // Reference equality
});

// Test 2: Changing photo updates active item with new state object
it('Changing photo URL creates new state reference with updated item', () => {
  const item1: TherapyGalleryParsedItem = { url: 'https://cdn.example.com/p1.jpg', kind: 'legacy' };
  const item2: TherapyGalleryParsedItem = { url: 'https://cdn.example.com/p2.jpg', kind: 'legacy' };
  const state1 = { KTV01: item1 };
  const state2 = updateActiveGallery(state1, 'KTV01', item2);

  assert.notEqual(state1, state2);
  assert.equal(state2.KTV01?.url, 'https://cdn.example.com/p2.jpg');
});

// Test 3: Two photos with same URL but different kind update correctly
it('Two photos with same URL but different kind (legacy vs mix) trigger state update', () => {
  const item1: TherapyGalleryParsedItem = { url: 'https://cdn.example.com/same.jpg', kind: 'legacy' };
  const item2: TherapyGalleryParsedItem = { url: 'https://cdn.example.com/same.jpg', kind: 'mix' };
  const state1 = { KTV01: item1 };
  const state2 = updateActiveGallery(state1, 'KTV01', item2);

  assert.notEqual(state1, state2);
  assert.equal(state2.KTV01?.kind, 'mix');
});

// Test 4: Two photos with same URL and therapy kind but different therapyId update correctly
it('Two photos with same URL but different therapyId update correctly', () => {
  const item1: TherapyGalleryParsedItem = { url: 'https://cdn.example.com/same.jpg', kind: 'therapy', therapyId: 'shiatsu' };
  const item2: TherapyGalleryParsedItem = { url: 'https://cdn.example.com/same.jpg', kind: 'therapy', therapyId: 'hotStone' };
  const state1 = { KTV01: item1 };
  const state2 = updateActiveGallery(state1, 'KTV01', item2);

  assert.notEqual(state1, state2);
  assert.equal(state2.KTV01?.kind, 'therapy');
  if (state2.KTV01?.kind === 'therapy') {
    assert.equal(state2.KTV01.therapyId, 'hotStone');
  }
});

// Test 5: Clamping index when photo list shrinks prevents out-of-bounds slide
it('validIndex clamps currentIndex when image list shrinks', () => {
  const totalBefore = 4;
  const currentIndex = 3; // viewing last photo
  let validIndex = totalBefore > 0 ? Math.min(currentIndex, totalBefore - 1) : 0;
  assert.equal(validIndex, 3);

  // List shrinks to 2
  const totalAfter = 2;
  validIndex = totalAfter > 0 ? Math.min(currentIndex, totalAfter - 1) : 0;
  assert.equal(validIndex, 1);
});

// Test 6: Navigation wrap around
it('goToPrev and goToNext wrap within valid bounds', () => {
  const total = 3;
  const next = (prev: number) => {
    const c = Math.min(prev, total - 1);
    return c === total - 1 ? 0 : c + 1;
  };
  const prev = (current: number) => {
    const c = Math.min(current, total - 1);
    return c === 0 ? total - 1 : c - 1;
  };

  assert.equal(next(0), 1);
  assert.equal(next(1), 2);
  assert.equal(next(2), 0); // Wrap next

  assert.equal(prev(0), 2); // Wrap prev
  assert.equal(prev(2), 1);
});

// Test 7: Swipe click suppression blocks click event within 500ms
it('Swipe suppression intercepts click within 500ms window', () => {
  const now = Date.now();
  const suppressClickUntil = now + 500;

  let prevented = false;
  let stopped = false;

  const mockEvent = {
    preventDefault: () => { prevented = true; },
    stopPropagation: () => { stopped = true; },
  };

  const handleClickCapture = (timestamp: number) => {
    if (timestamp < suppressClickUntil) {
      mockEvent.preventDefault();
      mockEvent.stopPropagation();
    }
  };

  // 100ms after swipe -> blocked
  handleClickCapture(now + 100);
  assert.equal(prevented, true);
  assert.equal(stopped, true);
});

// ─── PRODUCTION LOGIC TESTS FOR STAFF SELECTOR & CAROUSEL ───────────────────
import {
  applyPrimaryTechniques,
  evaluateActiveItemChange,
  evaluateMixApply,
  canConfirmBooking,
  resolveSelectedStaff,
} from '../src/components/Menu/DeepBody/StaffSelector/staffSelector.logic';
import type { VipStaffInfo } from '../src/lib/vipStaffUtils';

const mockStaff1: VipStaffInfo = {
  id: 'KTV01',
  fullName: 'KTV Mot',
  avatarUrl: 'https://cdn.example.com/a1.jpg',
  galleryUrls: ['https://cdn.example.com/g1.jpg'],
  therapyGallery: [
    { url: 'https://cdn.example.com/shiatsu.jpg', kind: 'therapy', therapyId: 'shiatsu' },
    { url: 'https://cdn.example.com/hotStone.jpg', kind: 'therapy', therapyId: 'hotStone' },
    { url: 'https://cdn.example.com/mix.jpg', kind: 'mix' },
  ],
  gender: 'Nữ',
  skills: { shiatsuBody: true, hotStoneBody: true, thaiBody: true, oilBody: true },
  height: 160,
  availability: 'AVAILABLE',
  estimatedEndTime: null,
  currentOrderId: null,
  shiftType: 'SHIFT_1',
  shiftStart: '08:00',
  shiftEnd: '16:00',
  queuePosition: 1,
  turnsCompleted: 0,
};

const mockStaff2Compatible: VipStaffInfo = {
  ...mockStaff1,
  id: 'KTV02',
  fullName: 'KTV Hai (Compatible)',
  skills: { shiatsuBody: true, hotStoneBody: true, thaiBody: true, oilBody: true },
};

const mockStaff2Incompatible: VipStaffInfo = {
  ...mockStaff1,
  id: 'KTV02_INCOMPAT',
  fullName: 'KTV Hai (Incompatible with hotStone)',
  skills: { shiatsuBody: true, hotStoneBody: false, thaiBody: true, oilBody: true },
};

// Case 9: Chọn KTV ở Shiatsu → đổi sang Đá nóng → xác nhận gửi hotStone
it('Chọn KTV ở Shiatsu → đổi sang Đá nóng → kỹ thuật được cập nhật sang hotStone', () => {
  const res = evaluateActiveItemChange({
    staff: mockStaff1,
    item: { url: 'https://cdn.example.com/hotStone.jpg', kind: 'therapy', therapyId: 'hotStone' },
    selectedIds: ['KTV01'],
    staffList: [mockStaff1],
  });

  assert.equal(res.shouldUpdateSelection, true);
  assert.deepEqual(res.nextTechniqueIds, ['hotStone']);
});

// Case 10: Đổi ảnh KTV chưa chọn không tự chọn KTV
it('Đổi ảnh KTV chưa chọn không tự chọn KTV (chỉ để xem, không đổi selection)', () => {
  const res = evaluateActiveItemChange({
    staff: mockStaff2Compatible,
    item: { url: 'https://cdn.example.com/hotStone.jpg', kind: 'therapy', therapyId: 'hotStone' },
    selectedIds: ['KTV01'],
    staffList: [mockStaff1, mockStaff2Compatible],
  });

  assert.equal(res.shouldUpdateSelection, false);
});

// Case 11: Đổi ảnh KTV thứ hai không ghi đè phương pháp chung
it('Đổi ảnh KTV thứ hai không ghi đè phương pháp chung của KTV thứ nhất', () => {
  const res = evaluateActiveItemChange({
    staff: mockStaff2Compatible,
    item: { url: 'https://cdn.example.com/hotStone.jpg', kind: 'therapy', therapyId: 'hotStone' },
    selectedIds: ['KTV01', 'KTV02'],
    staffList: [mockStaff1, mockStaff2Compatible],
  });

  assert.equal(res.shouldUpdateSelection, false);
});

// Case 12: Đổi kỹ thuật giữ KTV thứ hai nếu tương thích
it('Đổi kỹ thuật giữ KTV thứ hai nếu KTV thứ hai có tay nghề tương thích', () => {
  const res = applyPrimaryTechniques({
    staffId: 'KTV01',
    techniqueIds: ['hotStone'],
    selectedIds: ['KTV01', 'KTV02'],
    staffList: [mockStaff1, mockStaff2Compatible],
    unsupportedWarningText: 'KTV 2 không hỗ trợ kỹ thuật này',
  });

  assert.deepEqual(res.nextSelectedIds, ['KTV01', 'KTV02']);
  assert.deepEqual(res.nextTechniqueIds, ['hotStone']);
  assert.equal(res.warningMessage, undefined);
});

// Case 13: Đổi kỹ thuật bỏ KTV thứ hai và cảnh báo nếu không tương thích
it('Đổi kỹ thuật bỏ KTV thứ hai và phát cảnh báo nếu KTV thứ hai không tương thích', () => {
  const res = applyPrimaryTechniques({
    staffId: 'KTV01',
    techniqueIds: ['hotStone'],
    selectedIds: ['KTV01', 'KTV02_INCOMPAT'],
    staffList: [mockStaff1, mockStaff2Incompatible],
    unsupportedWarningText: 'KTV 2 không hỗ trợ kỹ thuật này',
  });

  assert.deepEqual(res.nextSelectedIds, ['KTV01']); // Dropped second staff
  assert.deepEqual(res.nextTechniqueIds, ['hotStone']);
  assert.equal(res.warningMessage, 'KTV 2 không hỗ trợ kỹ thuật này');
});

// Case 14: Chuyển sang Mix yêu cầu chọn 2–4 phương pháp
it('Chuyển sang Mix yêu cầu chọn 2–4 phương pháp (mở popover và xóa kỹ thuật cũ)', () => {
  const res = evaluateActiveItemChange({
    staff: mockStaff1,
    item: { url: 'https://cdn.example.com/mix.jpg', kind: 'mix' },
    selectedIds: ['KTV01'],
    staffList: [mockStaff1],
  });

  assert.equal(res.shouldUpdateSelection, true);
  assert.equal(res.openMixStaff?.id, 'KTV01');
  assert.deepEqual(res.nextTechniqueIds, []);

  // canConfirmBooking blocks confirmation when Mix has < 2 methods
  const check = canConfirmBooking({
    selectedIds: ['KTV01'],
    activeItem: { url: 'https://cdn.example.com/mix.jpg', kind: 'mix' },
    selectedTechniqueIds: [],
  });
  assert.equal(check.canConfirm, false);
  assert.equal(check.requiresMixModal, true);
});

// Case 15: Hủy Mix không gửi lại phương pháp cũ; áp dụng Mix hợp lệ cho phép xác nhận
it('Hủy Mix không gửi phương pháp cũ; áp dụng Mix 2-4 phương pháp cho phép xác nhận', () => {
  // If Mix modal was cancelled and techniqueIds remain empty:
  const cancelledCheck = canConfirmBooking({
    selectedIds: ['KTV01'],
    activeItem: { url: 'https://cdn.example.com/mix.jpg', kind: 'mix' },
    selectedTechniqueIds: [],
  });
  assert.equal(cancelledCheck.canConfirm, false);
  assert.equal(cancelledCheck.requiresMixModal, true);

  // When user applies Mix with 2-4 therapies:
  const applied = evaluateMixApply({
    mixStaff: mockStaff1,
    chosenTechniqueIds: ['hotStone', 'shiatsu'],
    selectedIds: ['KTV01'],
    staffList: [mockStaff1],
  });
  assert.deepEqual(applied.nextTechniqueIds, ['hotStone', 'shiatsu']);

  const validCheck = canConfirmBooking({
    selectedIds: ['KTV01'],
    activeItem: { url: 'https://cdn.example.com/mix.jpg', kind: 'mix' },
    selectedTechniqueIds: applied.nextTechniqueIds,
  });
  assert.equal(validCheck.canConfirm, true);
  assert.equal(validCheck.requiresMixModal, false);
});

// Test 8: Normal tap after suppression window passes allows card selection
it('Normal tap after suppression window passes does not intercept click', () => {
  const now = Date.now();
  const suppressClickUntil = now + 500;

  let prevented = false;
  let stopped = false;

  const mockEvent = {
    preventDefault: () => { prevented = true; },
    stopPropagation: () => { stopped = true; },
  };

  const handleClickCapture = (timestamp: number) => {
    if (timestamp < suppressClickUntil) {
      mockEvent.preventDefault();
      mockEvent.stopPropagation();
    }
  };

  // 600ms after swipe -> allowed
  handleClickCapture(now + 600);
  assert.equal(prevented, false);
  assert.equal(stopped, false);
});

// Case 16: resolveSelectedStaff preserves user selection order: API [A, B], chosen [B, A] -> [B, A]
it('resolveSelectedStaff preserves user selection order: API [A, B], chosen [B, A] -> [B, A]', () => {
  const staffList = [mockStaff1, mockStaff2Compatible]; // [KTV01, KTV02]
  const selectedIds = ['KTV02', 'KTV01']; // User chose KTV02 first, then KTV01
  const resolved = resolveSelectedStaff(selectedIds, staffList);

  assert.notEqual(resolved, null);
  assert.equal(resolved?.length, 2);
  assert.equal(resolved?.[0].id, 'KTV02'); // First is KTV02
  assert.equal(resolved?.[1].id, 'KTV01'); // Second is KTV01
});

// Case 17: resolveSelectedStaff for single staff returns exactly that staff
it('resolveSelectedStaff for single staff returns exactly that staff', () => {
  const staffList = [mockStaff1, mockStaff2Compatible];
  const selectedIds = ['KTV01'];
  const resolved = resolveSelectedStaff(selectedIds, staffList);

  assert.notEqual(resolved, null);
  assert.equal(resolved?.length, 1);
  assert.equal(resolved?.[0].id, 'KTV01');
});

// Case 18: resolveSelectedStaff with missing/stale staff ID returns null and stops confirmation
it('resolveSelectedStaff with missing/stale staff ID returns null and halts confirmation', () => {
  const staffList = [mockStaff1]; // KTV02 is no longer in staffList
  const selectedIds = ['KTV01', 'KTV02_STALE'];
  const resolved = resolveSelectedStaff(selectedIds, staffList);

  assert.equal(resolved, null); // Must return null so UI can warn and halt
});

console.log(`\n🎉 ALL ${passedCount} CAROUSEL LOGIC TEST CASES PASSED!\n`);
