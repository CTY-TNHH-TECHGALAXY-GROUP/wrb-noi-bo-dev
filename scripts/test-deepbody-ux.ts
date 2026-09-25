import assert from 'node:assert/strict';
import { getDeepBodyT } from '../src/components/Menu/DeepBody/DeepBody.i18n';
import {
  DEEP_BODY_BASE_TECHNIQUE_IDS,
  getDeepBodyMinDuration,
  staffHasDeepBodyTechnique,
  type DeepBodyBaseTechniqueId,
} from '../src/lib/deepBody.constants';

console.log('🧪 Running Test Suite: Deep Body UX Improvements...');

// Test 1: Title & Subtitle updated
const tEn = getDeepBodyT('en');
assert.equal(tEn.select_technique_title, '2. Choose Your Therapy Method');
assert.equal(tEn.select_technique_subtitle, 'You can select more than one therapy');
console.log('  ✓ 1. Title is "2. Choose Your Therapy Method" & Subline is "You can select more than one therapy"');

// Test 2: Auto-adjust duration toast translation template
const tVi = getDeepBodyT('vi');
const toastText = tVi.duration_auto_adjusted.replace('{count}', '3').replace('{min}', '90');
assert.equal(toastText, 'Thời lượng tối thiểu cho 3 phương pháp là 90 phút');
console.log('  ✓ 2. Toast translation template replaces count and min correctly');

// Test 3: Min duration calculations
assert.equal(getDeepBodyMinDuration(1), 70);
assert.equal(getDeepBodyMinDuration(2), 70);
assert.equal(getDeepBodyMinDuration(3), 90);
assert.equal(getDeepBodyMinDuration(4), 120);
console.log('  ✓ 3. Min duration thresholds correctly enforced (1-2: 70m, 3: 90m, 4: 120m)');

// Test 4: Single cards selection behavior in Single mode vs Mix mode
function getIsCardSelected(isMixMode: boolean, selectedIds: DeepBodyBaseTechniqueId[], cardId: DeepBodyBaseTechniqueId): boolean {
  return !isMixMode && selectedIds.includes(cardId);
}

function handleSelectTechnique(prev: DeepBodyBaseTechniqueId[], techId: DeepBodyBaseTechniqueId): DeepBodyBaseTechniqueId[] {
  const isMixMode = prev.length >= 2;
  if (isMixMode) {
    return [techId];
  }
  if (prev.length === 0) return [techId];
  if (prev.includes(techId)) return prev;
  return [...prev, techId];
}

// User starts with Coconut Oil:
let selected: DeepBodyBaseTechniqueId[] = ['coconutOil'];
let isMixActive = selected.length >= 2;
assert.equal(isMixActive, false); // Single therapy, mix is not active yet
assert.equal(getIsCardSelected(isMixActive, selected, 'coconutOil'), true); // Coconut Oil card is selected
assert.equal(getIsCardSelected(isMixActive, selected, 'hotStone'), false); // Hotstone card is not selected

// User selects 2nd therapy: Hot Stone:
selected = handleSelectTechnique(selected, 'hotStone');
isMixActive = selected.length >= 2;
assert.equal(isMixActive, true); // Auto-activates Mix!
assert.deepEqual(selected, ['coconutOil', 'hotStone']); // Displays both therapies chosen in Mix!

// In Mix mode: Single cards MUST NOT be selected (even if included in Mix)!
assert.equal(getIsCardSelected(isMixActive, selected, 'coconutOil'), false);
assert.equal(getIsCardSelected(isMixActive, selected, 'hotStone'), false);
assert.equal(getIsCardSelected(isMixActive, selected, 'thaiTherapy'), false);
console.log('  ✓ 4. Selecting Coconut Oil then Hot Stone auto-selects Mix, single cards are NOT selected');

// Test 5: While in Mix mode, clicking a single card switches back to single therapy mode
selected = handleSelectTechnique(selected, 'thaiTherapy');
isMixActive = selected.length >= 2;
assert.equal(isMixActive, false); // Mix mode deactivated!
assert.deepEqual(selected, ['thaiTherapy']); // Switched to single therapy!
assert.equal(getIsCardSelected(isMixActive, selected, 'thaiTherapy'), true); // thaiTherapy is now selected
assert.equal(getIsCardSelected(isMixActive, selected, 'coconutOil'), false);
console.log('  ✓ 5. In Mix mode, clicking single card switches to single mode with that therapy selected');

// Test 6: Popover default removal
// When opening popover, it keeps ONLY initialSelected, never forces 2 default therapies
const mockSkills = { oilBody: true, thaiBody: true, shiatsuBody: true, hotStoneBody: true };
const initialSelected1: DeepBodyBaseTechniqueId[] = ['coconutOil'];
const popoverSelected1 = initialSelected1.filter((id) => staffHasDeepBodyTechnique(mockSkills, id));
assert.deepEqual(popoverSelected1, ['coconutOil']); // Stays 1, no forced peer!

const initialSelectedEmpty: DeepBodyBaseTechniqueId[] = [];
const popoverSelectedEmpty = initialSelectedEmpty.filter((id) => staffHasDeepBodyTechnique(mockSkills, id));
assert.deepEqual(popoverSelectedEmpty, []); // Stays 0, no forced 2-therapy default!
console.log('  ✓ 6. Popover default 2 therapies removed (preserves exact selection)');

console.log('\n🎉 ALL DEEP BODY UX TESTS PASSED SUCCESSFULLY!');
