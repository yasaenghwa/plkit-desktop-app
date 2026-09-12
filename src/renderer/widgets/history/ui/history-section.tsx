import { useEffect, useState } from 'react';

import {
  CHART_POINTS,
  gatewayApi,
  getGatewayErrorMessage,
  toChartPoints,
  type ActuatorHistory as ActuatorHistoryData,
  type CameraHistory as CameraHistoryData,
  type EventHistory as EventHistoryData,
  type SensorHistory as SensorHistoryData,
} from '@entities/farm';
import { LineChart, PageTitle, Panel, SegmentedControl } from '@shared/ui';

const HISTORY_TABS = ['Sensor', 'Actuator', 'Camera', 'Event'] as const;
export type HistoryTab = (typeof HISTORY_TABS)[number];

const ACTUATOR_ROWS = [
  ['15:29:01', 'pump-001', 'ON', 'SUCCESS', 'ON → OFF', '410 ms'],
  ['15:15:22', 'pump-001', 'OFF', 'SUCCESS', 'OFF', '380 ms'],
  ['14:47:10', 'fan-001', 'ON', 'TIMEOUT', '—', '5,000 ms'],
  ['14:02:33', 'led-001', 'ON', 'SUCCESS', 'ON', '350 ms'],
  ['08:31:15', 'pump-001', 'RUN 10 sec', 'SUCCESS', 'RUNNING → OFF', '420 ms'],
] as const;

const CAMERA_ROWS = [
  ['오늘 15:00', 'romaine_d18_1500.jpg', 'SYNCED'],
  ['오늘 12:00', 'romaine_d18_1200.jpg', 'SYNCED'],
  ['오늘 09:00', 'romaine_d18_0900.jpg', 'SYNCED'],
  ['어제 21:00', 'romaine_d17_2100.jpg', 'SYNCED'],
] as const;

const EVENT_ROWS = [
  ['오늘 15:00', 'CAMERA', 'Growth image captured — growth-cam-001'],
  ['오늘 14:47', 'TIMEOUT', 'Actuator command failure — fan-001 did not respond'],
  ['오늘 13:12', 'OFFLINE', 'Device offline — core-003 (보조 조도센서)'],
  ['오늘 11:40', 'MODULE', 'Module changed — core-001 board descriptor re-read'],
  ['오늘 09:02', 'NEW DEVICE', 'New device registered — led-001 (Grow Light)'],
  ['어제 22:10', 'SYNC', 'Cloud sync completed — 1,204 records'],
] as const;

type HistorySectionProps = {
  readonly onTabChange: (tab: HistoryTab) => void;
  readonly notify: (message: string) => void;
  readonly tab: HistoryTab;
};

const SensorHistory = ({ data }: { readonly data: SensorHistoryData | null }): JSX.Element => (
  <Panel className="history-chart-panel">
    <header className="history-chart-header">
      <strong>Soil Moisture · {data?.deviceId ?? 'core-001'} · Last 24h</strong>
      <div>
        <span>
          Min{' '}
          <b>
            {data?.stats.min ?? 35.8} {data?.unit ?? '%'}
          </b>
        </span>
        <span>
          Max{' '}
          <b>
            {data?.stats.max ?? 48.2} {data?.unit ?? '%'}
          </b>
        </span>
        <span>
          Avg{' '}
          <b>
            {data?.stats.avg ?? 42.1} {data?.unit ?? '%'}
          </b>
        </span>
        <a href={gatewayApi.history.sensorExportUrl(data?.deviceId ?? 'core-001')}>CSV Export</a>
      </div>
    </header>
    <LineChart
      label="Soil moisture last 24 hours"
      points={data ? toChartPoints(data.points.map((point) => point.v)) : CHART_POINTS}
      variant="history"
    />
    <div className="chart-axis chart-axis--history">
      <span>00:00</span>
      <span>04:00</span>
      <span>08:00</span>
      <span>12:00</span>
      <span>16:00</span>
      <span>20:00</span>
      <span>now</span>
    </div>
    <p className="screen-note">
      밴드 = 적정 범위 (35~55%) · ┆ = Pump command · 급수 후 상승 여부를 시간축으로 확인
    </p>
  </Panel>
);

const ActuatorHistory = ({ data }: { readonly data: ActuatorHistoryData | null }): JSX.Element => (
  <div className="table-panel history-table history-table--actuator">
    <div className="history-table__header">
      <span>Time</span>
      <span>Device</span>
      <span>Command</span>
      <span>Result</span>
      <span>State</span>
      <span>Latency</span>
    </div>
    {data
      ? data.items.map((item) => (
          <div className="history-table__row" key={`${item.at}-${item.deviceId}`}>
            <time>{new Date(item.at).toLocaleString()}</time>
            <strong>{item.deviceId}</strong>
            <span>{item.command}</span>
            <b className={item.result === 'SUCCESS' ? 'text-success' : 'text-danger'}>
              {item.result}
            </b>
            <span>
              {item.stateBefore} → {item.stateAfter}
            </span>
            <small>{item.latencyMs.toLocaleString()} ms</small>
          </div>
        ))
      : ACTUATOR_ROWS.map(([time, device, command, result, state, latency]) => (
          <div className="history-table__row" key={`${time}-${device}`}>
            <time>{time}</time>
            <strong>{device}</strong>
            <span>{command}</span>
            <b className={result === 'SUCCESS' ? 'text-success' : 'text-danger'}>{result}</b>
            <span>{state}</span>
            <small>{latency}</small>
          </div>
        ))}
  </div>
);

const CameraHistory = ({ data }: { readonly data: CameraHistoryData | null }): JSX.Element => (
  <div className="table-panel history-table history-table--camera">
    <div className="history-table__header">
      <span>Captured At</span>
      <span>Camera</span>
      <span>Image</span>
      <span>Storage</span>
      <span>Sync</span>
    </div>
    {data
      ? data.items.map((item) => (
          <div className="history-table__row" key={`${item.capturedAt}-${item.imageId}`}>
            <time>{new Date(item.capturedAt).toLocaleString()}</time>
            <span>{item.cameraId}</span>
            <span className="camera-file">
              <i />
              {item.imageId}
            </span>
            <b className="text-success">{item.storage}</b>
            <b className={item.sync === 'SYNCED' ? 'text-success' : 'text-info'}>{item.sync}</b>
          </div>
        ))
      : CAMERA_ROWS.map(([time, file, sync]) => (
          <div className="history-table__row" key={file}>
            <time>{time}</time>
            <span>growth-cam-001</span>
            <span className="camera-file">
              <i />
              {file}
            </span>
            <b className="text-success">SAVED</b>
            <b className="text-success">{sync}</b>
          </div>
        ))}
  </div>
);

const EventHistory = ({ data }: { readonly data: EventHistoryData | null }): JSX.Element => (
  <div className="table-panel event-history">
    {data
      ? data.items.map((item) => (
          <div key={`${item.at}-${item.type}`}>
            <time>{new Date(item.at).toLocaleString()}</time>
            <span
              className={
                item.type === 'TIMEOUT' || item.type === 'OFFLINE'
                  ? 'event-tag event-tag--danger'
                  : item.type === 'MODULE' || item.type === 'NEW_DEVICE'
                    ? 'event-tag event-tag--accent'
                    : 'event-tag'
              }
            >
              {item.type}
            </span>
            <p>{item.message}</p>
          </div>
        ))
      : EVENT_ROWS.map(([time, type, message]) => (
          <div key={`${time}-${type}`}>
            <time>{time}</time>
            <span
              className={
                type === 'TIMEOUT' || type === 'OFFLINE'
                  ? 'event-tag event-tag--danger'
                  : type === 'MODULE' || type === 'NEW DEVICE'
                    ? 'event-tag event-tag--accent'
                    : 'event-tag'
              }
            >
              {type}
            </span>
            <p>{message}</p>
          </div>
        ))}
  </div>
);

export const HistorySection = ({ notify, onTabChange, tab }: HistorySectionProps): JSX.Element => {
  const [sensor, setSensor] = useState<SensorHistoryData | null>(null);
  const [actuator, setActuator] = useState<ActuatorHistoryData | null>(null);
  const [camera, setCamera] = useState<CameraHistoryData | null>(null);
  const [events, setEvents] = useState<EventHistoryData | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const load = async (): Promise<void> => {
      try {
        switch (tab) {
          case 'Sensor':
            setSensor(await gatewayApi.history.sensor('core-001', controller.signal));
            break;
          case 'Actuator':
            setActuator(await gatewayApi.history.actuator({ limit: 50 }, controller.signal));
            break;
          case 'Camera':
            setCamera(await gatewayApi.history.camera({ limit: 50 }, controller.signal));
            break;
          case 'Event':
            setEvents(await gatewayApi.history.events({ limit: 100 }, controller.signal));
            break;
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        notify(`History 조회 실패 · ${getGatewayErrorMessage(error)}`);
      }
    };
    void load();
    return () => controller.abort();
  }, [notify, tab]);

  return (
    <div className="screen-stack">
      <PageTitle
        action={
          <SegmentedControl
            active={tab}
            label="History type"
            onChange={onTabChange}
            options={HISTORY_TABS}
          />
        }
      >
        History
      </PageTitle>
      {tab === 'Sensor' ? <SensorHistory data={sensor} /> : null}
      {tab === 'Actuator' ? <ActuatorHistory data={actuator} /> : null}
      {tab === 'Camera' ? <CameraHistory data={camera} /> : null}
      {tab === 'Event' ? <EventHistory data={events} /> : null}
    </div>
  );
};
