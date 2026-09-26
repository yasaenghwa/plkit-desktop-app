import { z } from 'zod';

export const healthSchema = z.enum(['NORMAL', 'UNKNOWN', 'WARNING']);
export const trendSchema = z.enum(['DOWN', 'FLAT', 'UP']);
export const moduleClassSchema = z.enum(['ACTUATOR', 'CAMERA', 'SENSOR']);

const overviewDeviceSummarySchema = z
  .object({
    online: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
    sensor: z.number().int().nonnegative(),
    actuatorCamera: z.number().int().nonnegative(),
  })
  .readonly();

const overviewEnvironmentSchema = z
  .object({
    deviceId: z.string(),
    name: z.string(),
    moduleType: z.string(),
    value: z.number(),
    unit: z.string(),
    health: healthSchema,
    trend: trendSchema,
    measuredAt: z.string(),
  })
  .readonly();

const overviewActuatorSchema = z
  .object({
    deviceId: z.string(),
    name: z.string(),
    state: z.string(),
    // null: the last command was OFF, or nothing ever switched it on (SSOT v2)
    lastRunAt: z.string().nullable(),
    lastRunDurationSec: z.number().int().nonnegative().nullable(),
  })
  .readonly();

export const overviewSchema = z
  .object({
    summary: z
      .object({
        gateway: z.string(),
        devices: overviewDeviceSummarySchema,
        cloudSync: z
          .object({ state: z.enum(['ONLINE', 'OFFLINE', 'SYNCING']), lastSyncAt: z.string() })
          .readonly(),
        alerts: z.number().int().nonnegative(),
      })
      .readonly(),
    environment: z.array(overviewEnvironmentSchema).readonly(),
    actuators: z.array(overviewActuatorSchema).readonly(),
    recentEvents: z
      .array(z.object({ at: z.string(), type: z.string(), message: z.string() }).readonly())
      .readonly(),
    latestImage: z
      .object({ imageId: z.string(), capturedAt: z.string(), url: z.string() })
      .readonly()
      .nullable(),
  })
  .readonly();

const deviceListItemSchema = z
  .object({
    deviceId: z.string(),
    displayName: z.string(),
    moduleClass: moduleClassSchema,
    moduleType: z.string(),
    online: z.boolean(),
    health: healthSchema,
    lastSeen: z.string(),
  })
  .readonly();

export const deviceListSchema = z
  .object({
    items: z.array(deviceListItemSchema).readonly(),
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  })
  .readonly();

const deviceUserMetaSchema = z
  .object({
    displayName: z.string(),
    zone: z.string(),
    plant: z.string(),
    description: z.string(),
  })
  .readonly();

export const deviceDetailSchema = z
  .object({
    hardware: z
      .object({
        deviceId: z.string(),
        moduleClass: moduleClassSchema,
        moduleType: z.string(),
        moduleModel: z.string(),
        hardwareRevision: z.number().int(),
        driverId: z.string(),
        firmware: z.string(),
        rssiDbm: z.number(),
        lastSeen: z.string(),
      })
      .readonly(),
    userMeta: deviceUserMetaSchema,
  })
  .readonly();

export const deviceMetaSchema = z
  .object({
    displayName: z.string(),
    zone: z.string(),
    plant: z.string(),
    description: z.string(),
  })
  .extend({ updatedAt: z.string() })
  .readonly();

export const deviceRegistrationSchema = z
  .object({
    deviceId: z.string(),
    displayName: z.string(),
    zone: z.string(),
    plant: z.string(),
    registeredAt: z.string(),
  })
  .readonly();

const telemetryItemSchema = z
  .object({
    deviceId: z.string(),
    moduleType: z.string(),
    value: z.number(),
    unit: z.string(),
    health: healthSchema,
    trend: trendSchema,
    measuredAt: z.string(),
  })
  .readonly();

export const telemetryLatestSchema = z
  .object({ items: z.array(telemetryItemSchema).readonly() })
  .readonly();

export const telemetrySeriesSchema = z
  .object({
    deviceId: z.string(),
    unit: z.string(),
    points: z.array(z.object({ t: z.string(), v: z.number() }).readonly()).readonly(),
    stats: z.object({ min: z.number(), max: z.number(), avg: z.number() }).readonly(),
  })
  .readonly();

export const actuatorListSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            deviceId: z.string(),
            state: z.string(),
            lastCommand: z
              .object({ command: z.string(), result: z.string(), at: z.string() })
              .readonly()
              .nullable(),
          })
          .readonly(),
      )
      .readonly(),
  })
  .readonly();

export const actuatorCommandSchema = z
  .object({
    commandId: z.string(),
    state: z.literal('PENDING'),
    requestedAt: z.string(),
    timeoutMs: z.number().int().positive(),
  })
  .readonly();

export const cameraCaptureSchema = z
  .object({ captureId: z.string(), state: z.literal('CAPTURING') })
  .readonly();

export const cameraImagesSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            imageId: z.string(),
            day: z.number().int().positive(),
            capturedAt: z.string(),
            url: z.string(),
            snapshot: z
              .object({
                soil: z.number(),
                airTemp: z.number(),
                humidity: z.number(),
                lightLx: z.number(),
                lastControl: z
                  .object({
                    deviceId: z.string(),
                    command: z.string(),
                    durationSec: z.number().int().nonnegative().nullable(),
                    at: z.string(),
                  })
                  .readonly()
                  .nullable(),
              })
              .readonly(),
          })
          .readonly(),
      )
      .readonly(),
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  })
  .readonly();

export type Overview = z.infer<typeof overviewSchema>;
export type DeviceList = z.infer<typeof deviceListSchema>;
export type DeviceDetail = z.infer<typeof deviceDetailSchema>;
export type TelemetryLatest = z.infer<typeof telemetryLatestSchema>;
export type TelemetrySeries = z.infer<typeof telemetrySeriesSchema>;
export type ActuatorList = z.infer<typeof actuatorListSchema>;
export type CameraImages = z.infer<typeof cameraImagesSchema>;
