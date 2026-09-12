import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { z } from 'zod';

import {
  gatewayApi,
  getGatewayErrorMessage,
  type DeviceDetail,
  type DeviceList,
  type GatewaySocketEvent,
} from '@entities/farm';
import { DataRows, PageTitle, Panel, SegmentedControl, StatusBadge } from '@shared/ui';

const DEVICE_FILTERS = ['All', 'Sensor', 'Actuator', 'Camera'] as const;
type DeviceFilter = (typeof DEVICE_FILTERS)[number];

type DevicesSectionProps = {
  readonly notify: (message: string) => void;
};

const deviceMetadataFormSchema = z
  .object({
    displayName: z.string().min(1),
    zone: z.string(),
    plant: z.string(),
    description: z.string(),
  })
  .readonly();

type DiscoveredDevice = Extract<
  GatewaySocketEvent,
  { readonly channel: 'event'; readonly type: 'DEVICE_DISCOVERED' }
>['descriptor'];

const DEMO_DISCOVERED_DEVICE: DiscoveredDevice = {
  deviceId: 'core-A81F',
  moduleClass: 'SENSOR',
  moduleType: 'SOIL_MOISTURE',
  moduleModel: 'PLKIT_SOIL_V1',
  hwRevision: 1,
};

const displayCategory = (category: 'ACTUATOR' | 'CAMERA' | 'SENSOR'): DeviceFilter => {
  switch (category) {
    case 'ACTUATOR':
      return 'Actuator';
    case 'CAMERA':
      return 'Camera';
    case 'SENSOR':
      return 'Sensor';
  }
};

export const DevicesSection = ({ notify }: DevicesSectionProps): JSX.Element => {
  const [filter, setFilter] = useState<DeviceFilter>('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [discoveredDevice, setDiscoveredDevice] =
    useState<DiscoveredDevice>(DEMO_DISCOVERED_DEVICE);
  const [devices, setDevices] = useState<DeviceList['items']>([]);
  const [selectedDetail, setSelectedDetail] = useState<DeviceDetail | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    gatewayApi.devices
      .list({ limit: 50 }, controller.signal)
      .then((response) => {
        setDevices(response.items);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        notify(`장치 목록 조회 실패 · ${getGatewayErrorMessage(error)}`);
      });
    return () => controller.abort();
  }, [notify]);

  useEffect(() => {
    const disconnect = gatewayApi.socket.connect({
      channels: ['event'],
      onError: (error) => notify(`Device WebSocket 실패 · ${error.message}`),
      onEvent: (event) => {
        switch (event.channel) {
          case 'event':
            switch (event.type) {
              case 'DEVICE_DISCOVERED':
                setDiscoveredDevice(event.descriptor);
                setModuleModalOpen(true);
                break;
              case 'CAMERA_CAPTURED':
                break;
            }
            break;
          case 'actuator':
          case 'telemetry':
            break;
        }
      },
      onStateChange: () => undefined,
    });
    return disconnect;
  }, [notify]);

  useEffect(() => {
    if (selectedId === null) {
      setSelectedDetail(null);
      return undefined;
    }
    const controller = new AbortController();
    gatewayApi.devices
      .get(selectedId, controller.signal)
      .then(setSelectedDetail)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        notify(`장치 상세 조회 실패 · ${getGatewayErrorMessage(error)}`);
      });
    return () => controller.abort();
  }, [notify, selectedId]);

  const visibleDevices = useMemo(
    () =>
      devices.filter(
        (device) => filter === 'All' || displayCategory(device.moduleClass) === filter,
      ),
    [devices, filter],
  );
  const selected = selectedId
    ? devices.find((device) => device.deviceId === selectedId)
    : undefined;

  const registerDevice = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const input = deviceMetadataFormSchema.parse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
    try {
      await gatewayApi.devices.register(discoveredDevice.deviceId, input);
      const response = await gatewayApi.devices.list({ limit: 50 });
      setDevices(response.items);
      setModuleModalOpen(false);
      setSelectedId(discoveredDevice.deviceId);
      notify(`${discoveredDevice.deviceId} registered`);
    } catch (error) {
      notify(`장치 등록 실패 · ${getGatewayErrorMessage(error)}`);
    }
  };

  if (selected) {
    const detail = selectedDetail;
    const hardwareRows = [
      ['device_id', detail?.hardware.deviceId ?? selected.deviceId],
      ['module_class', detail?.hardware.moduleClass ?? selected.moduleClass],
      ['module_type', detail?.hardware.moduleType ?? selected.moduleType],
      ['module_model', detail?.hardware.moduleModel ?? '—'],
      ['hw_revision', detail ? String(detail.hardware.hwRevision) : '—'],
      ['driver_id', detail?.hardware.driverId ?? '—'],
      ['firmware', detail?.hardware.firmware ?? '—'],
      ['wi-fi rssi', detail ? `${detail.hardware.rssiDbm} dBm` : '—'],
      ['last_seen', detail?.hardware.lastSeen ?? selected.lastSeen],
    ] as const;
    const submitMetadata = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault();
      const input = deviceMetadataFormSchema.parse(
        Object.fromEntries(new FormData(event.currentTarget)),
      );
      try {
        const updated = await gatewayApi.devices.updateMeta(selected.deviceId, input);
        setSelectedDetail((current) => (current ? { ...current, userMeta: updated } : current));
        notify('User metadata saved — Registry updated');
      } catch (error) {
        notify(`Metadata 저장 실패 · ${getGatewayErrorMessage(error)}`);
      }
    };
    return (
      <div className="screen-stack">
        <header className="detail-title">
          <button className="back-button" onClick={() => setSelectedId(null)} type="button">
            ← Devices
          </button>
          <h1>{detail?.userMeta.displayName ?? selected.displayName}</h1>
          <span className="class-badge">{displayCategory(selected.moduleClass)}</span>
          <StatusBadge
            label={selected.online ? `ONLINE · ${selected.health}` : 'OFFLINE'}
            tone={selected.online && selected.health === 'NORMAL' ? 'success' : 'danger'}
          />
        </header>
        <div className="device-detail-grid">
          <Panel title="Hardware Metadata · 자동 획득">
            <DataRows rows={hardwareRows} />
            <p className="panel-note">
              Module Descriptor에서 자동 획득 — 사용자가 수정하지 않습니다.
            </p>
          </Panel>
          <Panel title="User Metadata · 수정 가능">
            <form className="metadata-form" onSubmit={(event) => void submitMetadata(event)}>
              <label>
                <span>Display Name</span>
                <input
                  defaultValue={detail?.userMeta.displayName ?? selected.displayName}
                  name="displayName"
                />
              </label>
              <label>
                <span>Zone</span>
                <input defaultValue={detail?.userMeta.zone ?? ''} name="zone" />
              </label>
              <label>
                <span>Plant</span>
                <input defaultValue={detail?.userMeta.plant ?? ''} name="plant" />
              </label>
              <label>
                <span>Description</span>
                <input defaultValue={detail?.userMeta.description ?? ''} name="description" />
              </label>
              <button className="primary-button" type="submit">
                Save Metadata
              </button>
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
            <SegmentedControl
              active={filter}
              label="Device category"
              onChange={setFilter}
              options={DEVICE_FILTERS}
            />
            <button
              className="outline-button"
              onClick={() => setModuleModalOpen(true)}
              type="button"
            >
              + Simulate New Module
            </button>
          </div>
        }
      >
        Devices
      </PageTitle>
      <div className="table-panel device-table">
        <div className="device-table__header">
          <span>Status</span>
          <span>Name</span>
          <span>Type</span>
          <span>Module</span>
          <span>Health</span>
          <span>Last Seen</span>
        </div>
        {visibleDevices.map((device) => (
          <button
            className="device-table__row"
            key={device.deviceId}
            onClick={() => setSelectedId(device.deviceId)}
            type="button"
          >
            <span>
              <span
                className={`state-dot ${device.online ? 'state-dot--online' : 'state-dot--offline pulse'}`}
              />
            </span>
            <span>
              <strong>{device.displayName}</strong>
              <small>{device.deviceId}</small>
            </span>
            <span>{displayCategory(device.moduleClass)}</span>
            <span className="text-info">{device.moduleType}</span>
            <strong
              className={
                device.health === 'NORMAL'
                  ? 'text-success'
                  : device.health === 'WARNING'
                    ? 'text-danger'
                    : 'text-muted'
              }
            >
              {device.health}
            </strong>
            <span>{new Date(device.lastSeen).toLocaleString()}</span>
          </button>
        ))}
        <p className="table-note">
          Online 판정은 Gateway Core의 last_seen 정책 계산 결과만 표시합니다 (Frontend 판단 없음).
        </p>
      </div>
      {moduleModalOpen ? (
        <div className="modal-backdrop">
          <section
            aria-labelledby="module-title"
            aria-modal="true"
            className="module-modal"
            role="dialog"
          >
            <header>
              <span className="state-dot state-dot--accent pulse" />
              <h2 id="module-title">New PLKIT Module Detected</h2>
            </header>
            <p>Plug &amp; Play — Gateway가 새 Module Descriptor를 발견했습니다.</p>
            <DataRows
              rows={[
                ['Device ID', discoveredDevice.deviceId],
                ['Class', discoveredDevice.moduleClass],
                ['Module', discoveredDevice.moduleType],
                ['Model', discoveredDevice.moduleModel],
              ]}
            />
            <small>
              Hardware Identity는 수정할 수 없습니다 — Display Name · Zone · Plant만 설정합니다.
            </small>
            <form className="metadata-form" onSubmit={(event) => void registerDevice(event)}>
              <label>
                <span>Display Name</span>
                <input name="displayName" required />
              </label>
              <label>
                <span>Zone</span>
                <input name="zone" />
              </label>
              <label>
                <span>Plant</span>
                <input name="plant" />
              </label>
              <input name="description" type="hidden" value="" />
              <footer>
                <button
                  className="ghost-button"
                  onClick={() => setModuleModalOpen(false)}
                  type="button"
                >
                  Later
                </button>
                <button className="primary-button" type="submit">
                  Configure Device
                </button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
};
