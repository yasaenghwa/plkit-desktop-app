import { SENSORS } from '@entities/farm';
import { Icon, ImageSlot, PageTitle, Panel } from '@shared/ui';
import type { StatusTone } from '@shared/ui';

const SENSOR_ICON = 'M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z';

type OverviewSectionProps = {
  readonly onOpenCamera: () => void;
  readonly onOpenControl: () => void;
  readonly onOpenHistory: () => void;
  readonly onOpenMonitoring: () => void;
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

const RECENT_EVENTS = [
  { time: '15:31', message: 'Soil sensor telemetry received (core-001)', tone: 'success' },
  { time: '15:29', message: 'Pump command completed — SUCCESS', tone: 'accent' },
  { time: '15:00', message: 'Growth image captured (growth-cam-001)', tone: 'info' },
  { time: '14:47', message: 'fan-001 health WARNING — slow response', tone: 'danger' },
] as const satisfies readonly {
  readonly time: string;
  readonly message: string;
  readonly tone: StatusTone;
}[];

export const OverviewSection = ({
  onOpenCamera,
  onOpenControl,
  onOpenHistory,
  onOpenMonitoring,
  onSelectSensor,
}: OverviewSectionProps): JSX.Element => (
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
              onOpenMonitoring();
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
          action={<button className="text-button" onClick={onOpenControl} type="button">Control →</button>}
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
          action={<button className="text-button" onClick={onOpenHistory} type="button">History →</button>}
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
        action={<button className="text-button" onClick={onOpenCamera} type="button">Camera →</button>}
        className="latest-image-panel"
        title="Latest Growth Image"
      >
        <ImageSlot className="image-slot--latest" label="로메인 최신 촬영 이미지" />
        <p>Captured 15:00 · growth-cam-001</p>
      </Panel>
    </div>
  </div>
);
