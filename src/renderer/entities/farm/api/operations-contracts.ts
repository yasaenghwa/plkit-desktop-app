import { z } from 'zod';

const systemStatusPayloadSchema = z.object({
  gateway: z.string(),
  localDb: z.string(),
  wifiAp: z.string(),
  bleBeacon: z.string(),
  mqttBroker: z.string(),
  cloudSync: z.enum(['ONLINE', 'OFFLINE', 'SYNCING']),
  lastSyncAt: z.string(),
  alertCount: z.number().int().nonnegative(),
});

export const systemStatusSchema = systemStatusPayloadSchema.readonly();

export const gatewayStatusSchema = z
  .object({
    gatewayId: z.string(),
    hostname: z.string(),
    version: z.string(),
    os: z.string(),
    uptimeSec: z.number().nonnegative(),
    tempC: z.number(),
    localDb: z.object({ state: z.string(), sizeGb: z.number().nonnegative() }).readonly(),
    resources: z
      .object({
        cpuPct: z.number().nonnegative(),
        memUsedGb: z.number().nonnegative(),
        memTotalGb: z.number().positive(),
        diskUsedGb: z.number().nonnegative(),
        diskTotalGb: z.number().positive(),
      })
      .readonly(),
  })
  .readonly();

export const networkStatusSchema = z
  .object({
    ap: z
      .object({
        ssid: z.string(),
        gatewayIp: z.string(),
        status: z.string(),
        clients: z.number().int().nonnegative(),
        dhcpRange: z.string(),
      })
      .readonly(),
    ble: z
      .object({
        beacon: z.string(),
        gatewayId: z.string(),
        advertising: z.string(),
        bootstrapVersion: z.number().int().nonnegative(),
      })
      .readonly(),
  })
  .readonly();

export const mqttStatusSchema = z
  .object({
    status: z.string(),
    host: z.string(),
    port: z.number().int().positive(),
    connectedDevices: z.number().int().nonnegative(),
    msgReceived: z.number().int().nonnegative(),
    msgPublished: z.number().int().nonnegative(),
    lastMessageAt: z.string(),
  })
  .readonly();

export const syncStatusSchema = z
  .object({
    state: z.enum(['ONLINE', 'OFFLINE', 'SYNCING']),
    lastSuccessAt: z.string(),
    pending: z
      .object({
        sensorRecords: z.number().int().nonnegative(),
        actuatorEvents: z.number().int().nonnegative(),
        cameraImages: z.number().int().nonnegative(),
      })
      .readonly(),
  })
  .readonly();

export const syncRunSchema = z
  .object({ state: z.literal('SYNCING'), queued: z.number().int().nonnegative() })
  .readonly();

export const systemLogsSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            at: z.string(),
            level: z.enum(['ERROR', 'INFO', 'WARN']),
            category: z.string(),
            message: z.string(),
          })
          .readonly(),
      )
      .readonly(),
    nextCursor: z.string().nullable().optional(),
    hasMore: z.boolean().optional(),
  })
  .readonly();

export const sensorHistorySchema = z
  .object({
    deviceId: z.string(),
    unit: z.string(),
    points: z.array(z.object({ t: z.string(), v: z.number() }).readonly()).readonly(),
    stats: z.object({ min: z.number(), max: z.number(), avg: z.number() }).readonly(),
    pumpMarks: z.array(z.string()).readonly(),
  })
  .readonly();

export const actuatorHistorySchema = z
  .object({
    items: z
      .array(
        z
          .object({
            at: z.string(),
            deviceId: z.string(),
            command: z.string(),
            result: z.string(),
            stateBefore: z.string(),
            stateAfter: z.string(),
            latencyMs: z.number().nonnegative(),
            origin: z.string(),
          })
          .readonly(),
      )
      .readonly(),
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  })
  .readonly();

export const cameraHistorySchema = z
  .object({
    items: z
      .array(
        z
          .object({
            capturedAt: z.string(),
            cameraId: z.string(),
            imageId: z.string(),
            fileUrl: z.string(),
            storage: z.literal('SAVED'),
            sync: z.enum(['PENDING', 'SYNCED']),
          })
          .readonly(),
      )
      .readonly(),
    nextCursor: z.string().nullable().optional(),
    hasMore: z.boolean().optional(),
  })
  .readonly();

export const eventHistorySchema = z
  .object({
    items: z
      .array(z.object({ at: z.string(), type: z.string(), message: z.string() }).readonly())
      .readonly(),
    nextCursor: z.string().nullable().optional(),
    hasMore: z.boolean().optional(),
  })
  .readonly();

export const assistantContextSchema = z
  .object({
    temperature: z.number(),
    humidity: z.number(),
    soil: z.number(),
    systemStatus: z.string(),
  })
  .readonly();

export const assistantMessageSchema = z
  .object({
    messageId: z.string(),
    reply: z.string(),
    usedContext: z
      .object({ soil: z.number(), airTemp: z.number(), humidity: z.number() })
      .readonly(),
    createdAt: z.string(),
  })
  .readonly();

export const assistantSessionsSchema = z
  .object({
    items: z
      .array(
        z
          .object({ sessionId: z.string(), title: z.string(), lastMessageAt: z.string() })
          .readonly(),
      )
      .readonly(),
    nextCursor: z.string().nullable().optional(),
    hasMore: z.boolean().optional(),
  })
  .readonly();

export const gatewaySocketEventSchema = z.union([
  systemStatusPayloadSchema.extend({ channel: z.literal('system.status') }).readonly(),
  z
    .object({
      channel: z.literal('telemetry'),
      deviceId: z.string(),
      moduleType: z.string(),
      value: z.number(),
      unit: z.string(),
      measuredAt: z.string(),
    })
    .readonly(),
  z
    .object({
      channel: z.literal('actuator'),
      commandId: z.string(),
      deviceId: z.string(),
      result: z.enum(['FAILED', 'SUCCESS', 'TIMEOUT']),
      state: z.string(),
      latencyMs: z.number().nonnegative(),
    })
    .readonly(),
  z
    .object({
      channel: z.literal('event'),
      type: z.literal('DEVICE_DISCOVERED'),
      descriptor: z
        .object({
          deviceId: z.string(),
          moduleClass: z.string(),
          moduleType: z.string(),
          moduleModel: z.string(),
          hwRevision: z.number().int(),
        })
        .readonly(),
    })
    .readonly(),
  z
    .object({
      channel: z.literal('event'),
      type: z.literal('CAMERA_CAPTURED'),
      imageId: z.string(),
      capturedAt: z.string(),
      url: z.string(),
    })
    .readonly(),
]);

export const gatewaySocketSubscriptionAcknowledgementSchema = z
  .object({
    channel: z.literal('control'),
    type: z.literal('SUBSCRIBED'),
    channels: z.array(z.string()).readonly(),
    at: z.string(),
  })
  .readonly();

export const gatewaySocketMessageSchema = z.union([
  gatewaySocketEventSchema,
  gatewaySocketSubscriptionAcknowledgementSchema,
]);

export type SystemStatus = z.infer<typeof systemStatusSchema>;
export type GatewayStatus = z.infer<typeof gatewayStatusSchema>;
export type NetworkStatus = z.infer<typeof networkStatusSchema>;
export type MqttStatus = z.infer<typeof mqttStatusSchema>;
export type SyncStatus = z.infer<typeof syncStatusSchema>;
export type SystemLogs = z.infer<typeof systemLogsSchema>;
export type SensorHistory = z.infer<typeof sensorHistorySchema>;
export type ActuatorHistory = z.infer<typeof actuatorHistorySchema>;
export type CameraHistory = z.infer<typeof cameraHistorySchema>;
export type EventHistory = z.infer<typeof eventHistorySchema>;
export type AssistantContext = z.infer<typeof assistantContextSchema>;
export type GatewaySocketEvent = z.infer<typeof gatewaySocketEventSchema>;
export type GatewaySocketMessage = z.infer<typeof gatewaySocketMessageSchema>;
