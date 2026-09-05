import { useEffect, useRef, useState } from 'react';

import { Icon } from '@shared/ui';
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
      return <HistorySection onTabChange={onHistoryTabChange} tab={historyTab} />;
    case 'system':
      return <SystemSection notify={notify} />;
    case 'assistant':
      return <AssistantSection />;
  }
};

export const DashboardPage = (): JSX.Element => {
  const [route, setRoute] = useState<RouteId>('overview');
  const [historyTab, setHistoryTab] = useState<HistoryTab>('Sensor');
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const mainRef = useRef<HTMLElement>(null);

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

  return (
    <div className="dashboard-stage">
      <div className="dashboard-shell">
        <div className="dashboard-body">
          <aside className="sidebar">
            <button className="brand" onClick={() => navigate('overview')} type="button"><strong>PLKIT</strong><small>GATEWAY · RASPBERRY PI</small></button>
            <nav aria-label="Dashboard navigation">
              {NAVIGATION_ITEMS.map((item) => (
                <button aria-current={route === item.id ? 'page' : undefined} key={item.id} onClick={() => navigate(item.id)} type="button">
                  <Icon path={item.iconPath} /><span>{item.label}</span>
                </button>
              ))}
            </nav>
            <p className="sidebar__footer">Gateway v0.2.0<br />Local First · Offline OK</p>
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
              {['Local DB', 'Wi-Fi AP', 'BLE Beacon', 'MQTT Broker'].map((label) => <span key={label}><i />{label}</span>)}
              <span><i />Cloud Sync · ONLINE</span><time>Last Sync 15:31:02</time>
            </footer>
          </div>
        </div>
      </div>
      {toast ? <div className="toast" role="status">{toast}</div> : null}
    </div>
  );
};
