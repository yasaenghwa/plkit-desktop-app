import { useEffect, useMemo, useState } from 'react';

import {
  CHART_POINTS,
  gatewayApi,
  getGatewayErrorMessage,
  SENSORS,
  toChartPoints,
  type TelemetryLatest,
  type TelemetrySeries,
} from '@entities/farm';
import { DataRows, Icon, LineChart, PageTitle, Panel, StatusBadge } from '@shared/ui';

const SENSOR_ICON =
  'M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z';

type MonitoringSectionProps = {
  readonly onHistory: () => void;
  readonly notify: (message: string) => void;
  readonly onSelectSensor: (sensorId: string | null) => void;
  readonly selectedSensorId: string | null;
};

export const MonitoringSection = ({
  notify,
  onHistory,
  onSelectSensor,
  selectedSensorId,
}: MonitoringSectionProps): JSX.Element => {
  const [latest, setLatest] = useState<TelemetryLatest['items'] | null>(null);
  const [series, setSeries] = useState<TelemetrySeries | null>(null);
  const [socketLive, setSocketLive] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    gatewayApi.telemetry
      .latest(controller.signal)
      .then((response) => setLatest(response.items))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        notify(`최신 센서 조회 실패 · ${getGatewayErrorMessage(error)}`);
      });
    const disconnect = gatewayApi.socket.connect({
      channels: ['telemetry'],
      onError: (error) => notify(`WebSocket 연결 실패 · ${error.message}`),
      onEvent: (event) => {
        switch (event.channel) {
          case 'telemetry':
            setLatest((current) => {
              const remaining = (current ?? []).filter((item) => item.deviceId !== event.deviceId);
              return [...remaining, { ...event, health: 'NORMAL', trend: 'FLAT' }];
            });
            break;
          case 'actuator':
          case 'event':
            break;
        }
      },
      onStateChange: (state) => setSocketLive(state === 'open'),
    });
    return () => {
      controller.abort();
      disconnect();
    };
  }, [notify]);

  useEffect(() => {
    if (selectedSensorId === null) {
      setSeries(null);
      return undefined;
    }
    const controller = new AbortController();
    gatewayApi.telemetry
      .series(selectedSensorId, controller.signal)
      .then(setSeries)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        notify(`센서 시계열 조회 실패 · ${getGatewayErrorMessage(error)}`);
      });
    return () => controller.abort();
  }, [notify, selectedSensorId]);

  const sensors = useMemo(
    () =>
      (latest ?? SENSORS).map((reading) => {
        if ('id' in reading) return reading;
        const metadata = SENSORS.find((sensor) => sensor.deviceId === reading.deviceId);
        return {
          id: reading.deviceId,
          name: metadata?.name ?? reading.moduleType,
          module: reading.moduleType,
          value: String(reading.value),
          unit: reading.unit,
          health: reading.health === 'UNKNOWN' ? 'WARNING' : reading.health,
          trend: reading.trend,
          lastSeen: new Date(reading.measuredAt).toLocaleTimeString(),
          deviceId: reading.deviceId,
          model: metadata?.model ?? reading.moduleType,
          battery: metadata?.battery ?? '—',
          rssi: metadata?.rssi ?? '—',
          progress: Math.min(100, Math.max(0, reading.value)),
        } as const;
      }),
    [latest],
  );
  const selected = selectedSensorId
    ? sensors.find(
        (sensor) => sensor.id === selectedSensorId || sensor.deviceId === selectedSensorId,
      )
    : undefined;
  const chartPoints = series ? toChartPoints(series.points.map((point) => point.v)) : CHART_POINTS;

  if (selected) {
    return (
      <div className="screen-stack">
        <PageTitle action={null} subtitle={`${selected.module} Sensor`}>
          <button className="back-button" onClick={() => onSelectSensor(null)} type="button">
            ← Monitoring
          </button>
          {selected.name}
        </PageTitle>
        <div className="sensor-detail-grid">
          <Panel>
            <div className="sensor-detail-value">
              <strong>
                {selected.value} {selected.unit}
              </strong>
              <span>Last measured 15:31:04</span>
            </div>
            <LineChart label={`${selected.name} 최근 60분 변화`} points={chartPoints} />
            <div className="chart-axis">
              <span>-60 min</span>
              <span>-45</span>
              <span>-30</span>
              <span>-15</span>
              <span>now</span>
            </div>
          </Panel>
          <Panel title="Device">
            <DataRows
              rows={[
                ['Device ID', selected.deviceId],
                ['Module', selected.model],
                ['RSSI', selected.rssi],
                ['Battery', selected.battery],
                ['Health', selected.health],
              ]}
            />
            <button className="outline-button full-button" onClick={onHistory} type="button">
              Sensor History →
            </button>
          </Panel>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-stack">
      <PageTitle
        action={
          <StatusBadge
            label={socketLive ? 'WebSocket Live' : 'HTTP API'}
            pulse={socketLive}
            tone={socketLive ? 'success' : 'muted'}
          />
        }
      >
        Realtime Monitoring
      </PageTitle>
      <section aria-label="Sensor readings" className="monitoring-grid">
        {sensors.map((sensor) => (
          <button
            className="monitoring-card"
            key={sensor.id}
            onClick={() => onSelectSensor(sensor.id)}
            type="button"
          >
            <span className="monitoring-card__heading">
              <span>
                <Icon path={SENSOR_ICON} size={14} />
                {sensor.name}
              </span>
              <small>{sensor.module}</small>
            </span>
            <span className="monitoring-card__value">
              <strong>{sensor.value}</strong>
              <span>{sensor.unit}</span>
              <b>{sensor.trend}</b>
            </span>
            <span className="monitoring-card__footer">
              <b>{sensor.health}</b>
              <small>Last: {sensor.lastSeen}</small>
            </span>
          </button>
        ))}
      </section>
      <p className="screen-note">
        카드를 클릭하면 Sensor Detail로 이동합니다 · Sensor Board 교체 시 Registry를 통해 자동 갱신
      </p>
    </div>
  );
};
