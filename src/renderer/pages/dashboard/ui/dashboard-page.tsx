import { useEffect, useRef, useState } from 'react';

import type { RouteId } from '../model/dashboard-data';
import { NAVIGATION_ITEMS } from '../model/dashboard-navigation';
import { AssistantSection } from './assistant-section';
import { CameraSection } from './camera-assistant-section';
import { ControlSection } from './control-section';
import { DevicesSection } from './devices-section';
import { HistorySection, type HistoryTab } from './history-section';
import { MonitoringSection, OverviewSection } from './overview-section';
import { SystemSection } from './system-section';
import { Icon } from './dashboard-primitives';
import './dashboard-page.css';

const BELL = 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9 M10.3 21a1.94 1.94 0 0 0 3.4 0';

const formatClock = (date: Date): string => date.toTimeString().slice(0, 5);

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
      return <OverviewSection onNavigate={onNavigate} onSelectSensor={(id) => onSelectSensor(id)} />;
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
  const [clock, setClock] = useState(() => formatClock(new Date()));
  const [toast, setToast] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const tick = (): void => setClock(formatClock(new Date()));
    const fit = (): void => setScale(Math.min((window.innerWidth - 32) / 1440, (window.innerHeight - 32) / 920, 1));
    const timer = window.setInterval(tick, 30_000);
    window.addEventListener('resize', fit);
    fit();
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('resize', fit);
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

  return (
    <div className="dashboard-stage">
      <div className="dashboard-shell" style={{ transform: `scale(${scale})` }}>
        <header className="topbar">
          <div className="window-lights" aria-hidden="true"><span /><span /><span /></div>
          <span className="window-title">PLKIT Gateway — Electron</span>
          <div className="topbar__status">
            <button
              aria-label="Open event history"
              className="notification-button"
              onClick={() => {
                setHistoryTab('Event');
                navigate('history');
              }}
              type="button"
            ><Icon path={BELL} size={16} /><span>1</span></button>
            <span className="gateway-online"><span />Gateway Online</span>
            <time>{clock}</time>
          </div>
        </header>
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
