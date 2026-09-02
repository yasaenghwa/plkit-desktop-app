import { CHART_POINTS, SENSORS } from '@entities/farm';
import { DataRows, Icon, LineChart, PageTitle, Panel, StatusBadge } from '@shared/ui';

const SENSOR_ICON = 'M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z';

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
