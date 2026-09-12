import { describe, expect, it } from 'vitest';

import { formatGatewayTime } from './time-format';

describe('Gateway time formatting', () => {
  it('preserves a time-only fallback value', () => {
    const formatted = formatGatewayTime('15:31');

    expect(formatted).toBe('15:31');
  });
});
