export const ROUTE_IDS = [
  'overview',
  'devices',
  'monitoring',
  'control',
  'camera',
  'history',
  'system',
  'assistant',
] as const;

export type RouteId = (typeof ROUTE_IDS)[number];

export type StatusTone = 'accent' | 'danger' | 'info' | 'muted' | 'success';

export type Sensor = {
  readonly id: string;
  readonly name: string;
  readonly module: string;
  readonly value: string;
  readonly unit: string;
  readonly health: 'NORMAL' | 'WARNING';
  readonly trend: string;
  readonly lastSeen: string;
  readonly deviceId: string;
  readonly model: string;
  readonly battery: string;
  readonly rssi: string;
  readonly progress: number;
};

export type Device = {
  readonly id: string;
  readonly name: string;
  readonly category: 'Actuator' | 'Camera' | 'Sensor';
  readonly module: string;
  readonly online: boolean;
  readonly health: 'NORMAL' | 'UNKNOWN' | 'WARNING';
  readonly lastSeen: string;
  readonly zone: string;
  readonly plant: string;
  readonly description: string;
};

export const SENSORS: readonly Sensor[] = [
  {
    id: 'soil',
    name: '로메인 A 토양수분',
    module: 'SOIL_MOISTURE',
    value: '42.37',
    unit: '%',
    health: 'NORMAL',
    trend: '→',
    lastSeen: '2 sec ago',
    deviceId: 'core-001',
    model: 'PLKIT_SOIL_V1',
    battery: '82%',
    rssi: '-51 dBm',
    progress: 55,
  },
  {
    id: 'temp',
    name: '환경 온도',
    module: 'AIR_TEMP',
    value: '23.8',
    unit: '℃',
    health: 'NORMAL',
    trend: '↗',
    lastSeen: '4 sec ago',
    deviceId: 'core-002',
    model: 'SHT40',
    battery: '74%',
    rssi: '-58 dBm',
    progress: 62,
  },
  {
    id: 'humidity',
    name: '환경 습도',
    module: 'AIR_HUMIDITY',
    value: '61',
    unit: '%',
    health: 'NORMAL',
    trend: '→',
    lastSeen: '4 sec ago',
    deviceId: 'core-002',
    model: 'SHT40',
    battery: '74%',
    rssi: '-58 dBm',
    progress: 61,
  },
  {
    id: 'light',
    name: '조도',
    module: 'LIGHT',
    value: '9,200',
    unit: 'lx',
    health: 'NORMAL',
    trend: '↘',
    lastSeen: '6 sec ago',
    deviceId: 'core-003',
    model: 'BH1750',
    battery: '58%',
    rssi: '-63 dBm',
    progress: 46,
  },
];

export const DEVICES: readonly Device[] = [
  {
    id: 'core-001',
    name: '로메인 A 토양수분',
    category: 'Sensor',
    module: 'Soil',
    online: true,
    health: 'NORMAL',
    lastSeen: '2s ago',
    zone: 'Balcony · Bed A',
    plant: 'Romaine #01',
    description: '토양 수분 관측용 메인 센서',
  },
  {
    id: 'core-002',
    name: '환경 온습도',
    category: 'Sensor',
    module: 'Temp/Humi',
    online: true,
    health: 'NORMAL',
    lastSeen: '4s ago',
    zone: 'Balcony · Center',
    plant: 'Romaine #01',
    description: '대기 온습도 관측',
  },
  {
    id: 'core-003',
    name: '보조 조도센서',
    category: 'Sensor',
    module: 'Light',
    online: false,
    health: 'UNKNOWN',
    lastSeen: '13m ago',
    zone: 'Balcony · Window',
    plant: 'Romaine #01',
    description: '창측 조도 보조 관측',
  },
  {
    id: 'pump-001',
    name: '급수 펌프',
    category: 'Actuator',
    module: 'Pump',
    online: true,
    health: 'NORMAL',
    lastSeen: '1s ago',
    zone: 'Balcony · Bed A',
    plant: 'Romaine #01',
    description: '자동·수동 급수',
  },
  {
    id: 'fan-001',
    name: '환기 팬',
    category: 'Actuator',
    module: 'Fan',
    online: true,
    health: 'WARNING',
    lastSeen: '8s ago',
    zone: 'Balcony · Ceiling',
    plant: '—',
    description: '공기 순환',
  },
  {
    id: 'led-001',
    name: 'Grow Light',
    category: 'Actuator',
    module: 'LED',
    online: true,
    health: 'NORMAL',
    lastSeen: '3s ago',
    zone: 'Balcony · Top',
    plant: 'Romaine #01',
    description: '보조 조명',
  },
  {
    id: 'growth-cam-001',
    name: '생장 카메라',
    category: 'Camera',
    module: 'Camera',
    online: true,
    health: 'NORMAL',
    lastSeen: '20s ago',
    zone: 'Balcony · Front',
    plant: 'Romaine #01',
    description: '3시간 간격 생장 촬영',
  },
];

export const RECENT_EVENTS = [
  { time: '15:31', message: 'Soil sensor telemetry received (core-001)', tone: 'success' },
  { time: '15:29', message: 'Pump command completed — SUCCESS', tone: 'accent' },
  { time: '15:00', message: 'Growth image captured (growth-cam-001)', tone: 'info' },
  { time: '14:47', message: 'fan-001 health WARNING — slow response', tone: 'danger' },
] as const satisfies readonly {
  readonly time: string;
  readonly message: string;
  readonly tone: StatusTone;
}[];

export const CHART_POINTS =
  '0,124 30,118 60,121 90,110 120,112 150,102 180,108 210,98 240,105 270,94 300,101 330,88 360,96 390,83 420,90 450,78 480,86 510,74 540,82 570,68 600,75 630,62 660,70 690,58 720,64';

export const ACTUATOR_HISTORY = [
  ['15:29:01', 'pump-001', 'ON', 'SUCCESS', '410 ms'],
  ['15:15:22', 'pump-001', 'OFF', 'SUCCESS', '380 ms'],
  ['14:47:10', 'fan-001', 'ON', 'TIMEOUT', '5,000 ms'],
  ['14:02:33', 'led-001', 'ON', 'SUCCESS', '350 ms'],
] as const;

export const SYSTEM_ROWS = [
  ['Gateway ID', 'A82F'],
  ['Hostname', 'plkit-gateway'],
  ['Version', '0.2.0'],
  ['OS', 'Raspberry Pi OS 12'],
  ['Uptime', '3d 14h 22m'],
  ['Temperature', '52.3 ℃'],
  ['Local DB', 'NORMAL · 1.2 GB'],
] as const;

export const LOG_ROWS = [
  ['15:31:04', 'INFO', 'Device', 'telemetry core-001 soil=42.37%'],
  ['15:31:02', 'INFO', 'Sync', 'batch upload ok (238 records)'],
  ['15:29:01', 'INFO', 'MQTT', 'cmd pump-001 ON → state ack 410ms'],
  ['14:47:15', 'ERROR', 'Device', 'fan-001 command timeout (5000ms)'],
  ['14:47:10', 'WARN', 'MQTT', 'fan-001 slow response, retry 1/3'],
] as const;
