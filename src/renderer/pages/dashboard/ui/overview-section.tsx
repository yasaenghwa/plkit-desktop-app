import { CHART_POINTS, RECENT_EVENTS, SENSORS, type RouteId } from '../model/dashboard-data';
import { DataRows, Icon, ImageSlot, LineChart, PageTitle, Panel, StatusBadge } from './dashboard-primitives';

const SENSOR_ICON = 'M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z';

type OverviewSectionProps = {
  readonly onNavigate: (route: RouteId) => void;
  readonly onSelectSensor: (sensorId: string) => void;
};

const SUMMARY = [
  ['Gateway', 'NORMAL', 'AP · MQTT · DB active', 'success'],
  ['Devices', '6 / 7 Online', '4 Sensor · 3 Actuator+Cam', 'default'],
  ['Cloud Sync', 'ONLINE', 'Last 15:31:02', 'success'],
  ['Alerts', '1', 'Fan warning', 'default'],
] as const;

const ACTUATORS = [
  ['Water Pump', 'OFF', 'Last run 08:31 · 10 sec', 'muted'],
  ['Grow Light', 'ON', 'Auto mode · natural light sufficient', 'success'],
  ['Fan', 'OFF', 'Idle', 'muted'],
] as const;

export const OverviewSection = ({ onNavigate, onSelectSensor }: OverviewSectionProps): JSX.Element => (
  <div className="screen-stack overview-screen">
    <PageTitle action={<span className="page-meta">베란다 로메인 PoC · Day 18</span>}>Overview</PageTitle>

    <section aria-label="Gateway summary" className="summary-grid">
      {SUMMARY.map(([label, value, detail, tone]) => (
        <article className="summary-card" key={label}>
          <span>{label}</span>
          <strong className={tone === 'success' ? 'text-success' : ''}>{value}</strong>
          <small>{detail}</small>
        </article>
      ))}
    </section>

    <Panel className="environment-panel" title="Environmental Summary">
      <div className="environment-grid">
        {SENSORS.map((sensor) => (
          <button
            className="environment-metric"
            key={sensor.id}
            onClick={() => {
              onSelectSensor(sensor.id);
              onNavigate('monitoring');
            }}
            type="button"
          >
            <span className="environment-metric__top">
              <span><Icon path={SENSOR_ICON} size={12} />{sensor.name}</span>
              <strong>{sensor.value} {sensor.unit}</strong>
            </span>
            <span className="progress-track"><span style={{ inlineSize: `${sensor.progress}%` }} /></span>
            <span className="environment-metric__bottom"><span>{sensor.health} · {sensor.trend}</span><span>{sensor.lastSeen}</span></span>
          </button>
        ))}
      </div>
    </Panel>

    <div className="overview-lower-grid">
      <div className="overview-lower-stack">
        <Panel
          action={<button className="text-button" onClick={() => onNavigate('control')} type="button">Control →</button>}
          title="Actuator State"
        >
          <div className="actuator-summary-list">
            {ACTUATORS.map(([name, state, note, tone]) => (
              <div className="actuator-summary-row" key={name}>
                <span>{name}</span>
                <strong className={`text-${tone}`}>{state}</strong>
                <small>{note}</small>
              </div>
            ))}
          </div>
        </Panel>
        <Panel
          action={<button className="text-button" onClick={() => onNavigate('history')} type="button">History →</button>}
          title="Recent Events"
        >
          <div className="recent-events">
            {RECENT_EVENTS.map((event) => (
              <div key={`${event.time}-${event.message}`}>
                <time>{event.time}</time>
                <span className={`event-dot event-dot--${event.tone}`} />
                <p>{event.message}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <Panel
        action={<button className="text-button" onClick={() => onNavigate('camera')} type="button">Camera →</button>}
        className="latest-image-panel"
        title="Latest Growth Image"
      >
        <ImageSlot className="image-slot--latest" label="로메인 최신 촬영 이미지" />
        <p>Captured 15:00 · growth-cam-001</p>
      </Panel>
    </div>
  </div>
);

type MonitoringSectionProps = {
  readonly onHistory: () => void;
  readonly onSelectSensor: (sensorId: string | null) => void;
  readonly selectedSensorId: string | null;
};

export const MonitoringSection = ({ onHistory, onSelectSensor, selectedSensorId }: MonitoringSectionProps): JSX.Element => {
  const selected = selectedSensorId ? SENSORS.find((sensor) => sensor.id === selectedSensorId) : undefined;

  if (selected) {
    return (
      <div className="screen-stack">
        <PageTitle
          action={null}
          subtitle={`${selected.module} Sensor`}
        >
          <button className="back-button" onClick={() => onSelectSensor(null)} type="button">← Monitoring</button>
          {selected.name}
        </PageTitle>
        <div className="sensor-detail-grid">
          <Panel>
            <div className="sensor-detail-value"><strong>{selected.value} {selected.unit}</strong><span>Last measured 15:31:04</span></div>
            <LineChart label={`${selected.name} 최근 60분 변화`} points={CHART_POINTS} />
            <div className="chart-axis"><span>-60 min</span><span>-45</span><span>-30</span><span>-15</span><span>now</span></div>
          </Panel>
          <Panel title="Device">
            <DataRows rows={[
              ['Device ID', selected.deviceId],
              ['Module', selected.model],
              ['RSSI', selected.rssi],
              ['Battery', selected.battery],
              ['Health', selected.health],
            ]} />
            <button className="outline-button full-button" onClick={onHistory} type="button">Sensor History →</button>
          </Panel>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-stack">
      <PageTitle action={<StatusBadge label="WebSocket Live" pulse tone="success" />}>Realtime Monitoring</PageTitle>
      <section aria-label="Sensor readings" className="monitoring-grid">
        {SENSORS.map((sensor) => (
          <button className="monitoring-card" key={sensor.id} onClick={() => onSelectSensor(sensor.id)} type="button">
            <span className="monitoring-card__heading"><span><Icon path={SENSOR_ICON} size={14} />{sensor.name}</span><small>{sensor.module}</small></span>
            <span className="monitoring-card__value"><strong>{sensor.value}</strong><span>{sensor.unit}</span><b>{sensor.trend}</b></span>
            <span className="monitoring-card__footer"><b>{sensor.health}</b><small>Last: {sensor.lastSeen}</small></span>
          </button>
        ))}
      </section>
      <p className="screen-note">카드를 클릭하면 Sensor Detail로 이동합니다 · Sensor Board 교체 시 Registry를 통해 자동 갱신</p>
    </div>
  );
};
