import { useEffect, useState } from 'react';

import { Icon } from './dashboard-primitives';

const BELL_ICON_PATH = 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9 M10.3 21a1.94 1.94 0 0 0 3.4 0';

const formatLocalTime = (date: Date): string => date.toTimeString().slice(0, 5);

type GatewayTitleBarProps = {
  readonly onOpenEvents: () => void;
};

export const GatewayTitleBar = ({ onOpenEvents }: GatewayTitleBarProps): JSX.Element => {
  const [localTime, setLocalTime] = useState(() => formatLocalTime(new Date()));
  const [isFullScreen, setIsFullScreen] = useState(true);

  useEffect(() => {
    const updateTime = (): void => setLocalTime(formatLocalTime(new Date()));
    const interval = window.setInterval(updateTime, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribe = window.windowControls.onFullScreenChange(setIsFullScreen);
    void window.windowControls.isFullScreen().then(setIsFullScreen);
    return unsubscribe;
  }, []);

  return (
    <header className="gateway-titlebar">
      <div className="gateway-titlebar__window-controls">
        <button
          aria-label="창 닫기"
          className="gateway-titlebar__window-control gateway-titlebar__window-control--close"
          onClick={window.windowControls.close}
          title="창 닫기"
          type="button"
        />
        <button
          aria-label="창 최소화"
          className="gateway-titlebar__window-control gateway-titlebar__window-control--minimize"
          onClick={window.windowControls.minimize}
          title="창 최소화"
          type="button"
        />
        <button
          aria-label={isFullScreen ? '전체 화면 종료' : '전체 화면 시작'}
          className="gateway-titlebar__window-control gateway-titlebar__window-control--maximize"
          onClick={window.windowControls.toggleFullScreen}
          title={isFullScreen ? '전체 화면 종료' : '전체 화면 시작'}
          type="button"
        />
      </div>
      <span className="gateway-titlebar__app-name">PLKIT Gateway — Electron</span>
      <div className="gateway-titlebar__status">
        <button
          aria-label="알림 1개, 이벤트 이력 열기"
          className="gateway-titlebar__notifications"
          onClick={onOpenEvents}
          type="button"
        >
          <Icon path={BELL_ICON_PATH} size={16} />
          <span aria-hidden="true">1</span>
        </button>
        <span className="gateway-titlebar__connection">
          <span aria-hidden="true" />
          Gateway Online
        </span>
        <time dateTime={localTime}>{localTime}</time>
      </div>
    </header>
  );
};
