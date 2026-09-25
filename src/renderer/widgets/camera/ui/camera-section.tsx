import { useEffect, useState } from 'react';

import { gatewayApi, getGatewayErrorMessage, type CameraImages } from '@entities/farm';
import { getGatewayRuntimeConfig } from '@shared/config';
import { DataRows, ImageSlot, PageTitle, Panel } from '@shared/ui';

const TIMELINE_DAYS = [
  { day: 1, date: '2026-08-06' },
  { day: 5, date: '2026-08-10' },
  { day: 10, date: '2026-08-15' },
  { day: 15, date: '2026-08-20' },
] as const;

type CameraSectionProps = {
  readonly notify: (message: string) => void;
};

export const CameraSection = ({ notify }: CameraSectionProps): JSX.Element => {
  const [lastCapture, setLastCapture] = useState('15:00');
  const [pending, setPending] = useState(false);
  const [images, setImages] = useState<CameraImages['items']>([]);

  useEffect(() => {
    const controller = new AbortController();
    gatewayApi.camera
      .images('growth-cam-001', { limit: 20 }, controller.signal)
      .then((response) => {
        setImages(response.items);
        const latest = response.items[0];
        if (latest) setLastCapture(new Date(latest.capturedAt).toLocaleTimeString());
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        notify(`카메라 이미지 조회 실패 · ${getGatewayErrorMessage(error)}`);
      });
    const disconnect = gatewayApi.socket.connect({
      channels: ['event'],
      onError: (error) => notify(`Camera WebSocket 실패 · ${error.message}`),
      onEvent: (event) => {
        switch (event.channel) {
          case 'event':
            switch (event.type) {
              case 'CAMERA_CAPTURED':
                setPending(false);
                setLastCapture(new Date(event.capturedAt).toLocaleTimeString());
                notify('Capture completed — image saved to Local DB');
                break;
              case 'DEVICE_DISCOVERED':
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
    return () => {
      controller.abort();
      disconnect();
    };
  }, [notify]);

  const capture = async (): Promise<void> => {
    if (pending) return;
    setPending(true);
    notify('Capture request sent — growth-cam-001');
    try {
      await gatewayApi.camera.capture('growth-cam-001');
    } catch (error) {
      setPending(false);
      notify(`Capture 요청 실패 · ${getGatewayErrorMessage(error)}`);
    }
  };

  const latest = images[0];
  const imageUrl = latest
    ? new URL(latest.url, `${getGatewayRuntimeConfig().apiBaseUrl}/`).toString()
    : undefined;
  const snapshot = latest?.snapshot;

  return (
    <div className="screen-stack">
      <PageTitle
        action={<span className="page-meta">Growth Observation Module · 3h interval</span>}
      >
        Growth Camera
      </PageTitle>
      <div className="camera-grid">
        <Panel className="camera-main-panel">
          <ImageSlot className="image-slot--camera" label="Latest Growth Image" source={imageUrl} />
          <div className="camera-actions">
            <p>Camera growth-cam-001 · Captured {lastCapture} · 1920 × 1080</p>
            <button
              className="primary-button"
              disabled={pending}
              onClick={() => void capture()}
              type="button"
            >
              {pending ? 'CAPTURING …' : 'Capture Now'}
            </button>
          </div>
          <section className="growth-timeline">
            <h2>Growth Timeline</h2>
            <div>
              {(images.length > 0 ? images.slice(0, 4) : TIMELINE_DAYS).map((entry) => (
                <article key={entry.day}>
                  <ImageSlot
                    className="image-slot--timeline"
                    label={`Day ${entry.day}`}
                    source={
                      'url' in entry
                        ? new URL(entry.url, `${getGatewayRuntimeConfig().apiBaseUrl}/`).toString()
                        : undefined
                    }
                  />
                  <strong>Day {entry.day}</strong>
                  <small>
                    {'capturedAt' in entry
                      ? new Date(entry.capturedAt).toLocaleDateString()
                      : entry.date}
                  </small>
                </article>
              ))}
            </div>
          </section>
        </Panel>
        <Panel title="Capture Snapshot Context">
          <DataRows
            rows={[
              ['Soil Moisture', snapshot ? `${snapshot.soil} %` : '—'],
              ['Air Temp', snapshot ? `${snapshot.airTemp} ℃` : '—'],
              ['Humidity', snapshot ? `${snapshot.humidity} %` : '—'],
              ['Light', snapshot ? `${snapshot.lightLx.toLocaleString()} lx` : '—'],
              [
                'Last Control',
                snapshot?.lastControl
                  ? `${snapshot.lastControl.command} ${snapshot.lastControl.deviceId}${snapshot.lastControl.durationSec === null ? '' : ` · ${snapshot.lastControl.durationSec}s`}`
                  : '—',
              ],
            ]}
          />
          <p className="panel-note camera-context-note">
            촬영 시점의 환경 Snapshot을 이미지 Metadata와 함께 Local DB에 저장합니다. PoC 이후 Leaf
            Area · Growth Rate 분석으로 확장.
          </p>
        </Panel>
      </div>
    </div>
  );
};
