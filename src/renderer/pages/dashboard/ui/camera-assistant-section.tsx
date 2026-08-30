import { useState } from 'react';

import { DataRows, ImageSlot, PageTitle, Panel } from './dashboard-primitives';

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
  const capture = (): void => {
    if (pending) return;
    setPending(true);
    notify('Capture request sent — growth-cam-001');
    window.setTimeout(() => {
      setPending(false);
      setLastCapture(new Date().toTimeString().slice(0, 5));
      notify('Capture completed — image saved to Local DB');
    }, 1800);
  };

  return (
    <div className="screen-stack">
      <PageTitle action={<span className="page-meta">Growth Observation Module · 3h interval</span>}>Growth Camera</PageTitle>
      <div className="camera-grid">
        <Panel className="camera-main-panel">
          <ImageSlot className="image-slot--camera" label="Latest Growth Image — 로메인 사진을 끌어다 놓으세요" />
          <div className="camera-actions">
            <p>Camera growth-cam-001 · Captured {lastCapture} · 1920 × 1080</p>
            <button className="primary-button" disabled={pending} onClick={capture} type="button">{pending ? 'CAPTURING …' : 'Capture Now'}</button>
          </div>
          <section className="growth-timeline">
            <h2>Growth Timeline</h2>
            <div>
              {TIMELINE_DAYS.map((entry) => (
                <article key={entry.day}>
                  <ImageSlot className="image-slot--timeline" label={`Day ${entry.day}`} />
                  <strong>Day {entry.day}</strong>
                  <small>{entry.date}</small>
                </article>
              ))}
            </div>
          </section>
        </Panel>
        <Panel title="Capture Snapshot Context">
          <DataRows rows={[
            ['Soil Moisture', '42.37 %'],
            ['Air Temp', '23.8 ℃'],
            ['Humidity', '61 %'],
            ['Light', '9,200 lx'],
            ['Last Control', '08:31 Pump 10 sec'],
          ]} />
          <p className="panel-note camera-context-note">촬영 시점의 환경 Snapshot을 이미지 Metadata와 함께 Local DB에 저장합니다. PoC 이후 Leaf Area · Growth Rate 분석으로 확장.</p>
        </Panel>
      </div>
    </div>
  );
};
