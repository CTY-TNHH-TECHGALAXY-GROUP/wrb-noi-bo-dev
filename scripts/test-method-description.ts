import assert from 'node:assert/strict';
import { resolveTechniqueDbDescription } from '../src/lib/deepBody.constants';

console.log('🧪 Running Test Suite: Method / Technique Description DB Resolution...');

const mockServices = [
  {
    id: 'NHS0013',
    names: { vi: 'Tinh dầu dừa', en: 'Aroma coconut oil' },
    descriptions: {
      vi: 'Chăm sóc toàn thân với dầu dừa',
      en: 'Full-body care with coconut oil',
    },
  },
  {
    id: 'NHS0031',
    names: { vi: 'Thái', en: 'Thai' },
    descriptions: {
      vi: 'Chăm sóc toàn thân căng cơ và ấn huyệt (không dầu)',
      en: 'Full-body care with stretching and pressure (no oil)',
    },
  },
  {
    id: 'NHT0003',
    names: { vi: 'Điều trị Therapy', en: 'Therapy Treatment' },
    descriptions: {
      vi: 'Điều trị Therapy', // Matches title exactly -> no actual description in DB
      en: 'Therapy Treatment',
    },
  },
];

// Test 1: Empty or undefined services returns null (hidden)
assert.equal(resolveTechniqueDbDescription('coconutOil', []), null);
assert.equal(resolveTechniqueDbDescription('coconutOil', undefined), null);
console.log('  ✓ 1. Empty or undefined services returns null (hidden)');

// Test 2: Description matching service name returns null (hidden, not hardcoded)
assert.equal(resolveTechniqueDbDescription('mixofourtherapies', mockServices, 'vi'), null);
assert.equal(resolveTechniqueDbDescription('mixofourtherapies', mockServices, 'en'), null);
console.log('  ✓ 2. Description matching name (dummy duplicate) returns null (hidden)');

// Test 3: Real DB description is resolved accurately in Vietnamese
const descVi = resolveTechniqueDbDescription('coconutOil', mockServices, 'vi');
assert.equal(descVi, 'Chăm sóc toàn thân với dầu dừa');
const thaiVi = resolveTechniqueDbDescription('thaiTherapy', mockServices, 'vi');
assert.equal(thaiVi, 'Chăm sóc toàn thân căng cơ và ấn huyệt (không dầu)');
console.log('  ✓ 3. Real description from DB is correctly resolved in VI');

// Test 4: Real DB description is resolved accurately in English
const descEn = resolveTechniqueDbDescription('coconutOil', mockServices, 'en');
assert.equal(descEn, 'Full-body care with coconut oil');
const thaiEn = resolveTechniqueDbDescription('thaiTherapy', mockServices, 'en');
assert.equal(thaiEn, 'Full-body care with stretching and pressure (no oil)');
console.log('  ✓ 4. Real description from DB is correctly resolved in EN');

console.log('\n🎉 ALL 4 METHOD DESCRIPTION TESTS PASSED SUCCESSFULLY!');
