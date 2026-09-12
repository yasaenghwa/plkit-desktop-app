import { GATEWAY_RUNTIME_CONFIG } from '@shared/config';

import { createGatewayApi } from './gateway-api';

export { GatewayProblemError } from '@shared/api';
export { createGatewayApi, type GatewayApi } from './gateway-api';
export { getGatewayErrorMessage } from './gateway-error';
export type {
  ActuatorList,
  CameraImages,
  DeviceDetail,
  DeviceList,
  Overview,
  TelemetryLatest,
  TelemetrySeries,
} from './monitoring-contracts';
export type {
  ActuatorHistory,
  AssistantContext,
  CameraHistory,
  EventHistory,
  GatewaySocketEvent,
  GatewayStatus,
  MqttStatus,
  NetworkStatus,
  SensorHistory,
  SyncStatus,
  SystemLogs,
  SystemStatus,
} from './operations-contracts';

export const gatewayApi = createGatewayApi(GATEWAY_RUNTIME_CONFIG);
