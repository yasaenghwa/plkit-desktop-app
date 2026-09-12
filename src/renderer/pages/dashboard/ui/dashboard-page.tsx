import { useEffect, useRef, useState } from 'react';

import { gatewayApi, getGatewayErrorMessage, type SystemStatus } from '@entities/farm';
import { GatewayTitleBar, Icon } from '@shared/ui';
import { AssistantSection } from '@widgets/assistant';
import { CameraSection } from '@widgets/camera';
import { ControlSection } from '@widgets/control';
import { DevicesSection } from '@widgets/devices';
import { HistorySection } from '@widgets/history';
import type { HistoryTab } from '@widgets/history';
import { MonitoringSection } from '@widgets/monitoring';
import { OverviewSection } from '@widgets/overview';
import { SystemSection } from '@widgets/system';

import { NAVIGATION_ITEMS, type RouteId } from '../model/dashboard-navigation';
import './dashboard-page.css';

type DashboardContentProps = {
  readonly historyTab: HistoryTab;
  readonly notify: (message: string) => void;
  readonly onHistoryTabChange: (tab: HistoryTab) => void;
  readonly onNavigate: (route: RouteId) => void;
  readonly onSelectSensor: (sensorId: string | null) => void;
  readonly route: RouteId;
  readonly selectedSensorId: string | null;
};

const DashboardContent = ({
  historyTab,
  notify,
  onHistoryTabChange,
  onNavigate,
  onSelectSensor,
  route,
  selectedSensorId,
}: DashboardContentProps): JSX.Element => {
  switch (route) {
    case 'overview':
      return (
        <OverviewSection
          notify={notify}
          onOpenCamera={() => onNavigate('camera')}
          onOpenControl={() => onNavigate('control')}
          onOpenHistory={() => onNavigate('history')}
          onOpenMonitoring={() => onNavigate('monitoring')}
          onSelectSensor={(id) => onSelectSensor(id)}
        />
      );
    case 'devices':
      return <DevicesSection notify={notify} />;
    case 'monitoring':
      return (
        <MonitoringSection
          notify={notify}
          onHistory={() => {
            onHistoryTabChange('Sensor');
            onNavigate('history');
          }}
          onSelectSensor={onSelectSensor}
          selectedSensorId={selectedSensorId}
        />
      );
    case 'control':
      return <ControlSection notify={notify} />;
    case 'camera':
      return <CameraSection notify={notify} />;
    case 'history':
      return <HistorySection notify={notify} onTabChange={onHistoryTabChange} tab={historyTab} />;
    case 'system':
      return <SystemSection notify={notify} />;
    case 'assistant':
      return <AssistantSection notify={notify} />;
  }
};

export const DashboardPage = (): JSX.Element => {
  const [route, setRoute] = useState<RouteId>('overview');
  const [historyTab, setHistoryTab] = useState<HistoryTab>('Sensor');
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const connectionErrorShownRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    const loadStatus = async (): Promise<void> => {
      try {
        const status = await gatewayApi.system.getStatus(controller.signal);
        setSystemStatus(status);
        connectionErrorShownRef.current = false;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        if (!connectionErrorShownRef.current) {
          setToast(`Gateway 연결 실패 · ${getGatewayErrorMessage(error)}`);
          connectionErrorShownRef.current = true;
        }
      }
    };

    void loadStatus();
    const interval = window.setInterval(() => void loadStatus(), 5_000);
    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const navigate = (nextRoute: RouteId): void => {
    setRoute(nextRoute);
    if (nextRoute !== 'monitoring') setSelectedSensorId(null);
    mainRef.current?.scrollTo({ top: 0 });
  };

  const openEvents = (): void => {
    setHistoryTab('Event');
    navigate('history');
  };

  return (
    <div className="dashboard-stage">
      <div className="dashboard-shell">
        <GatewayTitleBar onOpenEvents={openEvents} />
        <div className="dashboard-body">
          <aside className="sidebar">
            <button className="brand" onClick={() => navigate('overview')} type="button">
              <strong>PLKIT</strong>
              <small>GATEWAY · RASPBERRY PI</small>
            </button>
            <nav aria-label="Dashboard navigation">
              {NAVIGATION_ITEMS.map((item) => (
                <button
                  aria-current={route === item.id ? 'page' : undefined}
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  type="button"
                >
                  <Icon path={item.iconPath} />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
            <p className="sidebar__footer">
              Gateway v0.2.0
              <br />
              Local First · Offline OK
            </p>
          </aside>
          <div className="content-column">
            <main aria-label={`${route} dashboard`} className="dashboard-content" ref={mainRef}>
              <DashboardContent
                historyTab={historyTab}
                notify={setToast}
                onHistoryTabChange={setHistoryTab}
                onNavigate={navigate}
                onSelectSensor={setSelectedSensorId}
                route={route}
                selectedSensorId={selectedSensorId}
              />
            </main>
            <footer className="statusbar">
              {[
                ['Local DB', systemStatus?.localDb ?? 'CHECKING'],
                ['Wi-Fi AP', systemStatus?.wifiAp ?? 'CHECKING'],
                ['BLE Beacon', systemStatus?.bleBeacon ?? 'CHECKING'],
                ['MQTT Broker', systemStatus?.mqttBroker ?? 'CHECKING'],
              ].map(([label, state]) => (
                <span key={label}>
                  <i />
                  {label} · {state}
                </span>
              ))}
              <span>
                <i />
                Cloud Sync · {systemStatus?.cloudSync ?? 'CHECKING'}
              </span>
              <time>
                Last Sync{' '}
                {systemStatus ? new Date(systemStatus.lastSyncAt).toLocaleTimeString() : '—'}
              </time>
            </footer>
          </div>
        </div>
      </div>
      {toast ? (
        <div className="toast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  );
};
