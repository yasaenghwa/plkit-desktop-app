import { useEffect, useState } from 'react';

import {
  gatewayApi,
  getGatewayErrorMessage,
  type GatewayStatus,
  type MqttStatus,
  type NetworkStatus,
  type SyncStatus,
  type SystemLogs,
} from '@entities/farm';
import { DataRows, PageTitle, Panel, SegmentedControl } from '@shared/ui';

const SYSTEM_TABS = ['Gateway', 'Network', 'MQTT', 'Central Sync', 'Logs'] as const;
type SystemTab = (typeof SYSTEM_TABS)[number];
const LOG_FILTERS = ['ALL', 'INFO', 'WARN', 'ERROR'] as const;
type LogFilter = (typeof LOG_FILTERS)[number];

const LOGS = [
  ['15:31:04', 'INFO', 'Device', 'telemetry core-001 soil=42.37%'],
  ['15:31:02', 'INFO', 'Sync', 'batch upload ok (238 records)'],
  ['15:29:01', 'INFO', 'MQTT', 'cmd pump-001 ON → state ack 410ms'],
  ['14:47:15', 'ERROR', 'Device', 'fan-001 command timeout (5000ms)'],
  ['14:47:10', 'WARN', 'MQTT', 'fan-001 slow response, retry 1/3'],
  ['13:12:44', 'WARN', 'Network', 'core-003 last_seen exceeded threshold → OFFLINE'],
  ['09:02:11', 'INFO', 'BLE', 'bootstrap credential advertised (v1)'],
  ['08:31:15', 'INFO', 'Device', 'pump-001 RUN 10 sec (automation)'],
] as const;

type SystemSectionProps = { readonly notify: (message: string) => void };

const GatewayPanel = ({ data }: { readonly data: GatewayStatus | null }): JSX.Element => (
  <div className="two-column-grid">
    <Panel title="Gateway Status">
      <DataRows
        rows={[
          ['Gateway ID', data?.gatewayId ?? '—'],
          ['Hostname', data?.hostname ?? '—'],
          ['Version', data?.version ?? '—'],
          ['OS', data?.os ?? '—'],
          ['Uptime', data ? `${Math.floor(data.uptimeSec / 3_600)}h` : '—'],
          ['Temperature', data ? `${data.tempC} ℃` : '—'],
          ['Local DB', data ? `${data.localDb.state} · ${data.localDb.sizeGb} GB` : '—'],
          ['Current Time', new Date().toTimeString().slice(0, 5)],
        ]}
      />
    </Panel>
    <Panel title="Resources">
      <div className="resource-list">
        {[
          ['CPU', data ? `${data.resources.cpuPct} %` : '—', data?.resources.cpuPct ?? 0],
          [
            'Memory',
            data ? `${data.resources.memUsedGb} / ${data.resources.memTotalGb} GB` : '—',
            data ? (data.resources.memUsedGb / data.resources.memTotalGb) * 100 : 0,
          ],
          [
            'Storage',
            data ? `${data.resources.diskUsedGb} / ${data.resources.diskTotalGb} GB` : '—',
            data ? (data.resources.diskUsedGb / data.resources.diskTotalGb) * 100 : 0,
          ],
        ].map(([label, value, progress]) => (
          <div key={label}>
            <span>
              <b>{label}</b>
              <strong>{value}</strong>
            </span>
            <span className="progress-track">
              <span style={{ inlineSize: `${progress}%` }} />
            </span>
          </div>
        ))}
      </div>
      <p className="panel-note">장시간 데모·실험 중 Gateway 이상을 찾기 위한 운영 정보입니다.</p>
    </Panel>
  </div>
);

const NetworkPanel = ({ data }: { readonly data: NetworkStatus | null }): JSX.Element => (
  <div className="two-column-grid">
    <Panel title="Wi-Fi AP">
      <DataRows
        rows={[
          ['SSID', data?.ap.ssid ?? '—'],
          ['Gateway IP', data?.ap.gatewayIp ?? '—'],
          ['Status', data?.ap.status ?? '—'],
          ['Clients', data ? String(data.ap.clients) : '—'],
          ['DHCP Range', data?.ap.dhcpRange ?? '—'],
        ]}
      />
    </Panel>
    <Panel title="BLE Advertising">
      <DataRows
        rows={[
          ['BLE Beacon', data?.ble.beacon ?? '—'],
          ['Gateway ID', data?.ble.gatewayId ?? '—'],
          ['Advertising', data?.ble.advertising ?? '—'],
          ['Bootstrap Version', data ? String(data.ble.bootstrapVersion) : '—'],
        ]}
      />
      <p className="network-warning">PoC: Credential이 평문 Advertising으로 공유되는 구조입니다.</p>
    </Panel>
  </div>
);

const MqttPanel = ({ data }: { readonly data: MqttStatus | null }): JSX.Element => (
  <Panel className="mqtt-panel" title="MQTT Broker">
    <DataRows
      rows={[
        ['Broker Status', data?.status ?? '—'],
        ['Host', data?.host ?? '—'],
        ['Port', data ? String(data.port) : '—'],
        ['Connected Devices', data ? String(data.connectedDevices) : '—'],
        ['Messages Received', data?.msgReceived.toLocaleString() ?? '—'],
        ['Messages Published', data?.msgPublished.toLocaleString() ?? '—'],
        ['Last Message', data ? new Date(data.lastMessageAt).toLocaleString() : '—'],
      ]}
    />
  </Panel>
);

type SyncPanelProps = SystemSectionProps & {
  readonly data: SyncStatus | null;
  readonly onSync: () => void;
};

const SyncPanel = ({ data, notify, onSync }: SyncPanelProps): JSX.Element => (
  <div className="two-column-grid">
    <Panel className="sync-overview">
      <span>Central Platform</span>
      <strong>{data?.state ?? 'CHECKING'}</strong>
      <p>Last Successful Sync · {data ? new Date(data.lastSuccessAt).toLocaleString() : '—'}</p>
      <button
        className="primary-button"
        onClick={() => {
          notify('Sync requested');
          onSync();
        }}
        type="button"
      >
        Sync Now
      </button>
    </Panel>
    <Panel title="Pending Sync Queue">
      <DataRows
        rows={[
          ['Sensor Records', data ? String(data.pending.sensorRecords) : '—'],
          ['Actuator Events', data ? String(data.pending.actuatorEvents) : '—'],
          ['Camera Images', data ? String(data.pending.cameraImages) : '—'],
        ]}
      />
      <p className="panel-note">Local DB에 적재 후 Background Sync로 중앙 플랫폼에 전송합니다.</p>
    </Panel>
  </div>
);

const LogsPanel = ({ data }: { readonly data: SystemLogs | null }): JSX.Element => {
  const [filter, setFilter] = useState<LogFilter>('ALL');
  const visible =
    data?.items ?? LOGS.map(([at, level, category, message]) => ({ at, level, category, message }));
  const filtered = visible.filter((item) => filter === 'ALL' || item.level === filter);
  return (
    <div>
      <div className="log-filters">
        {LOG_FILTERS.map((level) => (
          <button
            aria-pressed={filter === level}
            key={level}
            onClick={() => setFilter(level)}
            type="button"
          >
            {level}
          </button>
        ))}
      </div>
      <div className="log-panel">
        {filtered.map((item) => (
          <div key={`${item.at}-${item.message}`}>
            <time>{data ? new Date(item.at).toLocaleTimeString() : item.at}</time>
            <b className={`log-level log-level--${item.level.toLowerCase()}`}>{item.level}</b>
            <span>{item.category}</span>
            <p>{item.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SystemSection = ({ notify }: SystemSectionProps): JSX.Element => {
  const [tab, setTab] = useState<SystemTab>('Gateway');
  const [gateway, setGateway] = useState<GatewayStatus | null>(null);
  const [network, setNetwork] = useState<NetworkStatus | null>(null);
  const [mqtt, setMqtt] = useState<MqttStatus | null>(null);
  const [sync, setSync] = useState<SyncStatus | null>(null);
  const [logs, setLogs] = useState<SystemLogs | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const load = async (): Promise<void> => {
      try {
        switch (tab) {
          case 'Gateway':
            setGateway(await gatewayApi.system.gateway(controller.signal));
            break;
          case 'Network':
            setNetwork(await gatewayApi.system.network(controller.signal));
            break;
          case 'MQTT':
            setMqtt(await gatewayApi.system.mqtt(controller.signal));
            break;
          case 'Central Sync':
            setSync(await gatewayApi.system.sync(controller.signal));
            break;
          case 'Logs':
            setLogs(await gatewayApi.system.logs(undefined, controller.signal));
            break;
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        notify(`System 조회 실패 · ${getGatewayErrorMessage(error)}`);
      }
    };
    void load();
    return () => controller.abort();
  }, [notify, tab]);

  const runSync = async (): Promise<void> => {
    try {
      const result = await gatewayApi.system.runSync();
      setSync((current) => (current ? { ...current, state: result.state } : current));
      notify(`Sync queued · ${result.queued} items`);
    } catch (error) {
      notify(`Sync 요청 실패 · ${getGatewayErrorMessage(error)}`);
    }
  };
  return (
    <div className="screen-stack">
      <PageTitle
        action={
          <SegmentedControl
            active={tab}
            label="System section"
            onChange={setTab}
            options={SYSTEM_TABS}
          />
        }
      >
        System
      </PageTitle>
      {tab === 'Gateway' ? <GatewayPanel data={gateway} /> : null}
      {tab === 'Network' ? <NetworkPanel data={network} /> : null}
      {tab === 'MQTT' ? <MqttPanel data={mqtt} /> : null}
      {tab === 'Central Sync' ? (
        <SyncPanel data={sync} notify={notify} onSync={() => void runSync()} />
      ) : null}
      {tab === 'Logs' ? <LogsPanel data={logs} /> : null}
    </div>
  );
};
