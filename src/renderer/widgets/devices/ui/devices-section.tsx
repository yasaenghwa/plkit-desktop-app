import { useMemo, useState } from 'react';

import { DEVICES } from '@entities/farm';
import { DataRows, PageTitle, Panel, SegmentedControl, StatusBadge } from '@shared/ui';

const DEVICE_FILTERS = ['All', 'Sensor', 'Actuator', 'Camera'] as const;
type DeviceFilter = (typeof DEVICE_FILTERS)[number];

type DevicesSectionProps = {
  readonly notify: (message: string) => void;
};

export const DevicesSection = ({ notify }: DevicesSectionProps): JSX.Element => {
  const [filter, setFilter] = useState<DeviceFilter>('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const visibleDevices = useMemo(
    () => DEVICES.filter((device) => filter === 'All' || device.category === filter),
    [filter],
  );
  const selected = selectedId ? DEVICES.find((device) => device.id === selectedId) : undefined;

  if (selected) {
    const hardwareRows = [
      ['device_id', selected.id],
      ['module_class', selected.category.toUpperCase()],
      ['module_type', selected.module.toUpperCase()],
      ['module_model', `PLKIT_${selected.module.toUpperCase().replace('/', '_')}_V1`],
      ['hw_revision', '1'],
      ['driver_id', `${selected.module.toUpperCase().replace('/', '_')}_V1`],
      ['firmware', '1.0.0'],
      ['wi-fi rssi', selected.online ? '-54 dBm' : '—'],
      ['last_seen', selected.lastSeen],
    ] as const;
    return (
      <div className="screen-stack">
        <header className="detail-title">
          <button className="back-button" onClick={() => setSelectedId(null)} type="button">← Devices</button>
          <h1>{selected.name}</h1>
          <span className="class-badge">{selected.category}</span>
          <StatusBadge
            label={selected.online ? `ONLINE · ${selected.health}` : 'OFFLINE'}
            tone={selected.online && selected.health === 'NORMAL' ? 'success' : 'danger'}
          />
        </header>
        <div className="device-detail-grid">
          <Panel title="Hardware Metadata · 자동 획득">
            <DataRows rows={hardwareRows} />
            <p className="panel-note">Module Descriptor에서 자동 획득 — 사용자가 수정하지 않습니다.</p>
          </Panel>
          <Panel title="User Metadata · 수정 가능">
            <form
              className="metadata-form"
              onSubmit={(event) => {
                event.preventDefault();
                notify('User metadata saved — Registry updated');
              }}
            >
              <label><span>Display Name</span><input defaultValue={selected.name} /></label>
              <label><span>Zone</span><input defaultValue={selected.zone} /></label>
              <label><span>Plant</span><input defaultValue={selected.plant} /></label>
              <label><span>Description</span><input defaultValue={selected.description} /></label>
              <button className="primary-button" type="submit">Save Metadata</button>
            </form>
            <p className="panel-note">Hardware Identity는 수정할 수 없습니다.</p>
          </Panel>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-stack">
      <PageTitle
        action={
          <div className="page-actions">
            <SegmentedControl active={filter} label="Device category" onChange={setFilter} options={DEVICE_FILTERS} />
            <button className="outline-button" onClick={() => setModuleModalOpen(true)} type="button">+ Simulate New Module</button>
          </div>
        }
      >Devices</PageTitle>
      <div className="table-panel device-table">
        <div className="device-table__header"><span>Status</span><span>Name</span><span>Type</span><span>Module</span><span>Health</span><span>Last Seen</span></div>
        {visibleDevices.map((device) => (
          <button className="device-table__row" key={device.id} onClick={() => setSelectedId(device.id)} type="button">
            <span><span className={`state-dot ${device.online ? 'state-dot--online' : 'state-dot--offline pulse'}`} /></span>
            <span><strong>{device.name}</strong><small>{device.id}</small></span>
            <span>{device.category}</span>
            <span className="text-info">{device.module}</span>
            <strong className={device.health === 'NORMAL' ? 'text-success' : device.health === 'WARNING' ? 'text-danger' : 'text-muted'}>{device.health}</strong>
            <span>{device.lastSeen}</span>
          </button>
        ))}
        <p className="table-note">Online 판정은 Gateway Core의 last_seen 정책 계산 결과만 표시합니다 (Frontend 판단 없음).</p>
      </div>
      {moduleModalOpen ? (
        <div className="modal-backdrop">
          <section aria-labelledby="module-title" aria-modal="true" className="module-modal" role="dialog">
            <header><span className="state-dot state-dot--accent pulse" /><h2 id="module-title">New PLKIT Module Detected</h2></header>
            <p>Plug &amp; Play — Gateway가 새 Module Descriptor를 발견했습니다.</p>
            <DataRows rows={[
              ['Device ID', 'core-A81F'],
              ['Class', 'SENSOR'],
              ['Module', 'SOIL_MOISTURE'],
              ['Model', 'PLKIT_SOIL_V1'],
            ]} />
            <small>Hardware Identity는 수정할 수 없습니다 — Display Name · Zone · Plant만 설정합니다.</small>
            <footer>
              <button className="ghost-button" onClick={() => setModuleModalOpen(false)} type="button">Later</button>
              <button
                className="primary-button"
                onClick={() => {
                  setModuleModalOpen(false);
                  setSelectedId('core-001');
                  notify('core-A81F registered — set display name & zone');
                }}
                type="button"
              >Configure Device</button>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  );
};
