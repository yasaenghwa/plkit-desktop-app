import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { DEFAULT_GATEWAY_SETTINGS } from '../gateway-settings';
import { loadGatewaySettings, saveGatewaySettings } from './gateway-settings-store';

const directories: string[] = [];

const settingsFile = async (): Promise<string> => {
  const directory = await mkdtemp(join(tmpdir(), 'plkit-gateway-settings-'));
  directories.push(directory);
  return join(directory, 'settings', 'gateway-settings.json');
};

afterEach(async () => {
  for (const directory of directories.splice(0)) {
    await rm(directory, { recursive: true, force: true });
  }
});

describe('Gateway settings storage', () => {
  it('defaults to Mock and persists a Local selection across loads', async () => {
    const path = await settingsFile();
    expect(await loadGatewaySettings(path)).toEqual(DEFAULT_GATEWAY_SETTINGS);
    const local = {
      ...DEFAULT_GATEWAY_SETTINGS,
      mode: 'local' as const,
      localApiBaseUrl: 'http://localhost:8080/api/v1',
      localWsUrl: 'ws://localhost:8080/ws',
    };
    await saveGatewaySettings(path, local);
    expect(await loadGatewaySettings(path)).toEqual(local);
  });

  it('does not overwrite a saved selection with invalid IPC input', async () => {
    const path = await settingsFile();
    await saveGatewaySettings(path, DEFAULT_GATEWAY_SETTINGS);
    const before = await readFile(path, 'utf8');
    await expect(
      saveGatewaySettings(path, {
        ...DEFAULT_GATEWAY_SETTINGS,
        localApiBaseUrl: 'javascript:alert(1)',
      }),
    ).rejects.toThrow();
    expect(await readFile(path, 'utf8')).toBe(before);
  });
});
