import { describe, expect, it } from 'vitest';

import { actuatorHistorySchema, cameraHistorySchema } from './operations-contracts';

describe('Gateway History response contracts', () => {
  it('parses actuator state fields returned by Gateway Core', () => {
    const history = actuatorHistorySchema.parse({
      items: [
        {
          at: '2026-09-12T11:00:00Z',
          deviceId: 'pump-001',
          command: 'RUN',
          result: 'SUCCESS',
          stateBefore: 'OFF',
          stateAfter: 'OFF',
          durationSec: 10,
          latencyMs: 410,
          origin: 'USER',
        },
      ],
      nextCursor: 'evt-1180',
      hasMore: true,
    });

    expect(history.items[0]?.stateBefore).toBe('OFF');
    expect(history.items[0]?.stateAfter).toBe('OFF');
  });

  it('parses camera image fields returned by Gateway Core', () => {
    const history = cameraHistorySchema.parse({
      items: [
        {
          capturedAt: '2026-09-12T11:00:00Z',
          cameraId: 'growth-cam-001',
          imageId: 'img-0142',
          fileUrl: '/api/v1/cameras/images/img-0142/file',
          storage: 'SAVED',
          sync: 'SYNCED',
        },
      ],
      nextCursor: null,
      hasMore: false,
    });

    expect(history.items[0]?.imageId).toBe('img-0142');
    expect(history.items[0]?.fileUrl).toContain('/img-0142/file');
  });
});
