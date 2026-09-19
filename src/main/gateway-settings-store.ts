import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

import {
  DEFAULT_GATEWAY_SETTINGS,
  gatewaySettingsSchema,
  type GatewaySettings,
} from '../gateway-settings';

export const loadGatewaySettings = async (path: string): Promise<GatewaySettings> => {
  try {
    const saved: unknown = JSON.parse(await readFile(path, 'utf8'));
    return gatewaySettingsSchema.parse(saved);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
      console.warn('Gateway settings could not be loaded; using Mock mode.', error);
    }
    return DEFAULT_GATEWAY_SETTINGS;
  }
};

export const saveGatewaySettings = async (
  path: string,
  value: unknown,
): Promise<GatewaySettings> => {
  const settings = gatewaySettingsSchema.parse(value);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(settings, null, 2), 'utf8');
  return settings;
};
