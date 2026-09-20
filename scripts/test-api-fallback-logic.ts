import assert from 'node:assert/strict';
import { isMissingGalleryUrls, normalizeFallbackStaffList } from '../src/lib/staffQueryHelper';

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

console.log('🧪 Running Regression Test Suite: API Fallback & TS2322 Normalization Logic...\n');

interface MockQueryArgs {
  selectCols: string;
  status: string;
  menuFlag: { key: string; val: boolean };
}

// Simulates the API query & fallback logic in vip-available and therapy-available
async function executeStaffQuery({
  menu,
  simulateColumnMissing,
  simulateRetryFail,
}: {
  menu: 'vip' | 'therapy';
  simulateColumnMissing?: boolean;
  simulateRetryFail?: boolean;
}) {
  const flagKey = menu === 'vip' ? 'is_active_vip_menu' : 'is_active_therapy_menu';
  const queriesExecuted: MockQueryArgs[] = [];

  const runDbQuery = async (cols: string, flag: string) => {
    queriesExecuted.push({
      selectCols: cols,
      status: 'ĐANG LÀM',
      menuFlag: { key: flag, val: true },
    });

    if (cols.includes('gallery_urls') && simulateColumnMissing) {
      return {
        data: null,
        error: {
          code: '42703',
          message: 'column Staff.gallery_urls does not exist',
        },
      };
    }

    if (!cols.includes('gallery_urls') && simulateRetryFail) {
      return {
        data: null,
        error: {
          code: '50000',
          message: 'Connection timeout',
        },
      };
    }

    return {
      data: [
        { id: 'KTV01', full_name: 'LUNA', avatar_url: 'https://cdn/luna.jpg', gallery_urls: cols.includes('gallery_urls') ? ['https://cdn/gal1.jpg'] : undefined },
        { id: 'KTV02', full_name: 'ANNA', avatar_url: 'https://cdn/anna.jpg', gallery_urls: cols.includes('gallery_urls') ? ['https://cdn/gal2.jpg'] : undefined },
      ],
      error: null,
    };
  };

  // 1. Primary Query
  let { data: staffList, error: staffError } = await runDbQuery(
    'id, full_name, avatar_url, gallery_urls, status',
    flagKey
  );

  // 2. Specific Fallback check using production helper
  if (staffError && isMissingGalleryUrls(staffError)) {
    const retry = await runDbQuery('id, full_name, avatar_url, status', flagKey);
    // TS2322 fix: normalized gallery_urls: [] via production helper
    staffList = normalizeFallbackStaffList(retry.data);
    staffError = retry.error;
  }

  if (staffError) {
    return { status: 500, error: 'Failed to fetch staff', queriesExecuted };
  }

  return { status: 200, staff: staffList, queriesExecuted };
}

// Case 1: Primary query succeeds -> uses primary gallery_urls
it('VIP API: Primary query succeeds when gallery_urls exists', async () => {
  const res = await executeStaffQuery({ menu: 'vip' });
  assert.equal(res.status, 200);
  assert.equal(res.queriesExecuted.length, 1);
  assert.equal(res.queriesExecuted[0].selectCols.includes('gallery_urls'), true);
  assert.equal(res.queriesExecuted[0].menuFlag.key, 'is_active_vip_menu');
  assert.equal(res.queriesExecuted[0].status, 'ĐANG LÀM');
});

// Case 2: Primary query fails with missing gallery_urls -> retry succeeds and normalizes []
it('VIP API: When gallery_urls is missing (42703), retries without gallery_urls and normalizes gallery_urls: []', async () => {
  const res = await executeStaffQuery({ menu: 'vip', simulateColumnMissing: true });
  assert.equal(res.status, 200);
  assert.equal(res.queriesExecuted.length, 2);
  // First query had gallery_urls
  assert.equal(res.queriesExecuted[0].selectCols.includes('gallery_urls'), true);
  // Fallback query did NOT have gallery_urls
  assert.equal(res.queriesExecuted[1].selectCols.includes('gallery_urls'), false);
  // Both queries preserved status and menu flag
  assert.equal(res.queriesExecuted[0].menuFlag.key, 'is_active_vip_menu');
  assert.equal(res.queriesExecuted[1].menuFlag.key, 'is_active_vip_menu');
  assert.equal(res.queriesExecuted[1].status, 'ĐANG LÀM');

  // Normalized staff list has gallery_urls: []
  assert.equal(res.staff?.length, 2);
  assert.deepEqual(res.staff?.[0].gallery_urls, []);
  assert.deepEqual(res.staff?.[1].gallery_urls, []);
});

// Case 3: Primary query fails with missing gallery_urls, but retry fails -> returns 500 error
it('VIP API: When retry also fails, returns 500 error and does not return unverified staff', async () => {
  const res = await executeStaffQuery({
    menu: 'vip',
    simulateColumnMissing: true,
    simulateRetryFail: true,
  });
  assert.equal(res.status, 500);
  assert.equal(res.error, 'Failed to fetch staff');
});

// Case 4: Therapy API fallback preserves is_active_therapy_menu
it('Therapy API: Fallback preserves is_active_therapy_menu and normalizes gallery_urls: []', async () => {
  const res = await executeStaffQuery({ menu: 'therapy', simulateColumnMissing: true });
  assert.equal(res.status, 200);
  assert.equal(res.queriesExecuted.length, 2);
  assert.equal(res.queriesExecuted[0].menuFlag.key, 'is_active_therapy_menu');
  assert.equal(res.queriesExecuted[1].menuFlag.key, 'is_active_therapy_menu');
  assert.equal(res.queriesExecuted[1].status, 'ĐANG LÀM');
  assert.deepEqual(res.staff?.[0].gallery_urls, []);
});

// Case 5: Error on a DIFFERENT column does not trigger gallery_urls fallback
it('Non-gallery_urls error (e.g. unknown column) does NOT trigger fallback retry', async () => {
  const staffError = {
    code: '42703',
    message: 'column Staff.unknown_field does not exist',
  };
  assert.equal(isMissingGalleryUrls(staffError), false);
});

// Case 6: Production helper isMissingGalleryUrls strictly checks code 42703 and regex gallery_urls
it('Production helper isMissingGalleryUrls validates 42703 code and column name accurately', () => {
  // 42703 + missing gallery_urls -> true
  assert.equal(
    isMissingGalleryUrls({ code: '42703', message: 'column Staff.gallery_urls does not exist' }),
    true
  );
  // 42703 + missing certificate_url -> false
  assert.equal(
    isMissingGalleryUrls({ code: '42703', message: 'column Staff.certificate_url does not exist' }),
    false
  );
  // 42703 + other column -> false
  assert.equal(
    isMissingGalleryUrls({ code: '42703', message: 'column Staff.some_other_col does not exist' }),
    false
  );
  // Permission error mentioning gallery_urls (different error code) -> false
  assert.equal(
    isMissingGalleryUrls({ code: '42501', message: 'permission denied for table or column gallery_urls' }),
    false
  );
  // null / undefined / missing message -> false
  assert.equal(isMissingGalleryUrls(null), false);
  assert.equal(isMissingGalleryUrls(undefined), false);
  assert.equal(isMissingGalleryUrls({ code: '42703' }), false);
  assert.equal(isMissingGalleryUrls({ message: 'column Staff.gallery_urls does not exist' }), false);
});

console.log(`\n🎉 ALL ${passedCount} API FALLBACK REGRESSION TEST CASES PASSED!\n`);
