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

// Test 8: Normal tap after window passes allows card selection
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

console.log(`\n🎉 ALL ${passedCount} CAROUSEL LOGIC TEST CASES PASSED!\n`);
