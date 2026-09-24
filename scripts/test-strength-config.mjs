import assert from 'node:assert/strict';
import { allowedStrengths, isStrengthAvailable } from '../src/lib/strengthConfig.ts';

const config = { light: true, medium: true, strong: false };
assert.deepEqual(allowedStrengths(config), ['light', 'medium']);
assert.equal(isStrengthAvailable(true, config, 'strong'), false);
assert.equal(isStrengthAvailable(true, config, 'Mạnh'), false);
assert.equal(isStrengthAvailable(true, config, 'medium'), true);
assert.equal(isStrengthAvailable(false, null, 'medium'), false);
assert.deepEqual(allowedStrengths(null), ['light', 'medium', 'strong']);
console.log('strength config: PASS');
