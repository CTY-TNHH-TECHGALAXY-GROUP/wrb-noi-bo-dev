import assert from 'node:assert/strict';
import type { SupabaseClient } from '@supabase/supabase-js';
import { handleVipItems } from '../src/app/api/orders/handleVipItems';
import { resolveVipServiceId } from '../src/lib/vipPricingEngine';

assert.equal(resolveVipServiceId('NHS0800', 60, 2, 'Ráy'), 'NHP0008');
assert.throws(() => resolveVipServiceId('NHT0006', 240, 1, 'Therapy Service'));
assert.throws(() => resolveVipServiceId('NHS0800', 65, 1, 'Ráy'));
assert.throws(() => resolveVipServiceId('NHS9999', 60, 1, 'Ráy'));

type SavedItem = {
  serviceId: string;
  technicianCodes: string[];
  options: { displayName: string; vipDuration: number; selectedSkills: string[] };
};
const inserted: SavedItem[] = [];
const db = {
  from: (table: string) => {
    assert.equal(table, 'BookingItems');
    return { insert: async (rows: SavedItem[]) => {
      inserted.push(...rows);
      return { error: null };
    } };
  },
} as unknown as SupabaseClient;

// Three different 60-minute VIP skills and two Deep Body therapies.
const cases = [
  { serviceId: 'NHS0800', vipGroupId: 'ear', vipDisplayName: 'Ráy', vipDuration: 60, vipSkillIds: ['earChuyen'], vipStaffId: 'KTV-01', priceVND: 720000 },
  { serviceId: 'NHP0004', vipGroupId: 'nail', vipDisplayName: 'Nail', vipDuration: 60, vipSkillIds: ['nailChuyen'], vipStaffId: 'KTV-02', priceVND: 720000 },
  { serviceId: 'NHP0001', vipGroupId: 'oil', vipDisplayName: 'Massage Tinh Dầu', vipDuration: 60, vipSkillIds: ['oilBody'], vipStaffId: 'KTV-03', priceVND: 720000 },
  { serviceId: 'NHT0004', vipGroupId: 'thai', vipDisplayName: 'Body chuyên sâu: Thái', vipDuration: 70, vipSkillIds: ['thaiTherapy'], vipStaffId: 'KTV-04', priceVND: 840000 },
  { serviceId: 'NHT0004', vipGroupId: 'thai-stone', vipDisplayName: 'Body chuyên sâu: Thái + Đá nóng', vipDuration: 120, vipSkillIds: ['thaiTherapy', 'hotStone'], vipStaffId: 'KTV-05', priceVND: 1440000 },
];

void handleVipItems(db, 'test-booking', cases).then(() => {
  assert.equal(inserted.length, 5);
  const expected = [
    { serviceId: 'NHP0001', name: 'Ráy', duration: 60, skills: ['earChuyen'], ktv: 'KTV-01', badge: 'VIP' },
    { serviceId: 'NHP0001', name: 'Nail', duration: 60, skills: ['nailChuyen'], ktv: 'KTV-02', badge: 'VIP' },
    { serviceId: 'NHP0001', name: 'Massage Tinh Dầu', duration: 60, skills: ['oilBody'], ktv: 'KTV-03', badge: 'VIP' },
    { serviceId: 'NHT0002', name: 'Body chuyên sâu: Thái', duration: 70, skills: ['Body chuyên sâu: Thái'], ktv: 'KTV-04', badge: 'THERAPY' },
    { serviceId: 'NHT0004', name: 'Body chuyên sâu: Thái + Đá nóng', duration: 120, skills: ['Body chuyên sâu: Thái + Đá nóng'], ktv: 'KTV-05', badge: 'THERAPY' },
  ];

  inserted.forEach((row, index) => {
    const want = expected[index];
    assert.equal(row.serviceId, want.serviceId);
    assert.equal(row.options.displayName, want.name);
    assert.equal(row.options.vipDuration, want.duration);
    assert.deepEqual(row.options.selectedSkills, want.skills);
    assert.deepEqual(row.technicianCodes, [want.ktv]);
    const adminBadge = row.serviceId.startsWith('NHP') ? 'VIP' : row.serviceId.startsWith('NHT') ? 'THERAPY' : '';
    assert.equal(adminBadge, want.badge);
    console.log(`${index + 1}. ${adminBadge} ${row.serviceId} ${row.options.displayName} ${want.duration}p ${row.technicianCodes[0]}: OK`);
  });
}).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
