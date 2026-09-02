import { useState } from 'react';

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

const GatewayPanel = (): JSX.Element => (
  <div className="two-column-grid">
    <Panel title="Gateway Status"><DataRows rows={[
      ['Gateway ID', 'A82F'], ['Hostname', 'plkit-gateway'], ['Version', '0.2.0'],
      ['OS', 'Raspberry Pi OS 12'], ['Uptime', '3d 14h 22m'], ['Temperature', '52.3 ℃'],
      ['Local DB', 'NORMAL · 1.2 GB'], ['Current Time', new Date().toTimeString().slice(0, 5)],
    ]} /></Panel>
    <Panel title="Resources">
      <div className="resource-list">
        {[['CPU', '23 %', 23], ['Memory', '1.4 / 4.0 GB', 35], ['Storage', '9.8 / 32 GB', 31]].map(([label, value, progress]) => (
          <div key={label}><span><b>{label}</b><strong>{value}</strong></span><span className="progress-track"><span style={{ inlineSize: `${progress}%` }} /></span></div>
        ))}
      </div>
      <p className="panel-note">장시간 데모·실험 중 Gateway 이상을 찾기 위한 운영 정보입니다.</p>
    </Panel>
  </div>
);

const NetworkPanel = (): JSX.Element => (
  <div className="two-column-grid">
    <Panel title="Wi-Fi AP"><DataRows rows={[
      ['SSID', 'PLKIT-A82F'], ['Gateway IP', '192.168.50.1'], ['Status', 'ACTIVE'], ['Clients', '8'], ['DHCP Range', '192.168.50.10 – 99'],
    ]} /></Panel>
    <Panel title="BLE Advertising">
      <DataRows rows={['BLE Beacon|ACTIVE', 'Gateway ID|A82F', 'Advertising|NORMAL', 'Bootstrap Version|1'].map((row) => {
        const [label = '', value = ''] = row.split('|');
        return [label, value];
      })} />
      <p className="network-warning">PoC: Credential이 평문 Advertising으로 공유되는 구조입니다.</p>
    </Panel>
  </div>
);

const MqttPanel = (): JSX.Element => (
  <Panel className="mqtt-panel" title="MQTT Broker"><DataRows rows={[
    ['Broker Status', 'RUNNING'], ['Host', '192.168.50.1'], ['Port', '1883'], ['Connected Devices', '6'],
    ['Messages Received', '148,204'], ['Messages Published', '9,412'], ['Last Message', '15:31:04'],
  ]} /></Panel>
);

const SyncPanel = ({ notify }: SystemSectionProps): JSX.Element => (
  <div className="two-column-grid">
    <Panel className="sync-overview">
      <span>Central Platform</span><strong>ONLINE</strong><p>Last Successful Sync · 15:31:02</p>
      <button className="primary-button" onClick={() => notify('Sync completed — queue flushed')} type="button">Sync Now</button>
    </Panel>
    <Panel title="Pending Sync Queue">
      <DataRows rows={['Sensor Records|0', 'Actuator Events|0', 'Camera Images|2'].map((row) => {
        const [label = '', value = ''] = row.split('|');
        return [label, value];
      })} />
      <p className="panel-note">Local DB에 적재 후 Background Sync로 중앙 플랫폼에 전송합니다.</p>
    </Panel>
  </div>
);

const LogsPanel = (): JSX.Element => {
  const [filter, setFilter] = useState<LogFilter>('ALL');
  const visible = LOGS.filter(([, level]) => filter === 'ALL' || level === filter);
  return (
    <div>
      <div className="log-filters">{LOG_FILTERS.map((level) => <button aria-pressed={filter === level} key={level} onClick={() => setFilter(level)} type="button">{level}</button>)}</div>
      <div className="log-panel">{visible.map(([time, level, category, message]) => <div key={`${time}-${message}`}><time>{time}</time><b className={`log-level log-level--${level.toLowerCase()}`}>{level}</b><span>{category}</span><p>{message}</p></div>)}</div>
    </div>
  );
};

export const SystemSection = ({ notify }: SystemSectionProps): JSX.Element => {
  const [tab, setTab] = useState<SystemTab>('Gateway');
  return (
    <div className="screen-stack">
      <PageTitle action={<SegmentedControl active={tab} label="System section" onChange={setTab} options={SYSTEM_TABS} />}>System</PageTitle>
      {tab === 'Gateway' ? <GatewayPanel /> : null}
      {tab === 'Network' ? <NetworkPanel /> : null}
      {tab === 'MQTT' ? <MqttPanel /> : null}
      {tab === 'Central Sync' ? <SyncPanel notify={notify} /> : null}
      {tab === 'Logs' ? <LogsPanel /> : null}
    </div>
  );
};
