import assert from 'node:assert/strict';
import { resolveStaffDescription, type VipStaffInfo } from '../src/lib/vipStaffUtils';

console.log('🧪 Running Test Suite: Staff Professional Description DB Resolution...');

// Base mock staff with no description
const baseStaff: VipStaffInfo = {
  id: 'KTV01',
  fullName: 'Lisa',
  avatarUrl: null,
  gender: 'Nữ',
  skills: { bodyMix: true },
  height: 165,
  availability: 'AVAILABLE',
  estimatedEndTime: null,
  currentOrderId: null,
  shiftType: 'SHIFT_1',
  shiftStart: '09:00',
  shiftEnd: '17:00',
};

// Test 1: Null/undefined staff or empty staff description returns null (must be hidden, NOT hardcoded)
assert.equal(resolveStaffDescription(null), null);
assert.equal(resolveStaffDescription(baseStaff), null);
console.log('  ✓ 1. Null staff or staff without description returns null (hidden)');

// Test 2: Staff with empty, whitespace, or "0 năm" description returns null
const staffWithEmptyDesc: VipStaffInfo = {
  ...baseStaff,
  certificateDescription: '   ',
};
assert.equal(resolveStaffDescription(staffWithEmptyDesc), null);

const staffWithZeroExp: VipStaffInfo = {
  ...baseStaff,
  certificateDescription: '0 năm',
};
assert.equal(resolveStaffDescription(staffWithZeroExp), null);
console.log('  ✓ 2. Blank or dummy values ("0 năm") return null (hidden)');

// Test 3: Staff with valid string description in DB returns the exact description
const staffWithRealDesc: VipStaffInfo = {
  ...baseStaff,
  certificateDescription: 'Chứng chỉ trị liệu cơ mạc chuyên sâu quốc tế 2024',
};
assert.equal(
  resolveStaffDescription(staffWithRealDesc, 'vi'),
  'Chứng chỉ trị liệu cơ mạc chuyên sâu quốc tế 2024'
);
console.log('  ✓ 3. Real description from DB is correctly resolved');

// Test 4: Multilingual object description resolves correctly per language
const staffWithI18nDesc: VipStaffInfo = {
  ...baseStaff,
  certificateDescription: {
    vi: 'Chuyên gia bấm huyệt và trị liệu cơ khớp 7 năm kinh nghiệm.',
    en: 'Expert in acupressure and musculoskeletal therapy with 7 years experience.',
  },
};
assert.equal(
  resolveStaffDescription(staffWithI18nDesc, 'vi'),
  'Chuyên gia bấm huyệt và trị liệu cơ khớp 7 năm kinh nghiệm.'
);
assert.equal(
  resolveStaffDescription(staffWithI18nDesc, 'en'),
  'Expert in acupressure and musculoskeletal therapy with 7 years experience.'
);
console.log('  ✓ 4. Multilingual DB descriptions resolve correctly for VI and EN');

console.log('\n🎉 ALL 4 STAFF DESCRIPTION TESTS PASSED SUCCESSFULLY!');
