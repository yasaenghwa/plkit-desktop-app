import { useState } from 'react';

import { PageTitle, Panel } from '@shared/ui';

const ACTUATORS = [
  { id: 'pump', name: 'Water Pump', deviceId: 'pump-001', note: '무제한 ON 방지를 위해 실제 state 수신 후 상태를 확정합니다.', last: 'OFF / SUCCESS / 15:29' },
  { id: 'led', name: 'Grow Light', deviceId: 'led-001', note: '자연광 부족 시 보조 조명으로 사용합니다.', last: 'ON / SUCCESS / 14:02' },
  { id: 'fan', name: 'Ventilation Fan', deviceId: 'fan-001', note: '응답 지연 시 TIMEOUT으로 처리됩니다 (데모: 항상 타임아웃).', last: 'OFF / SUCCESS / 어제 21:00' },
] as const;

type ActuatorId = (typeof ACTUATORS)[number]['id'];
type ActualState = 'OFF' | 'ON';

type ControlSectionProps = {
  readonly notify: (message: string) => void;
};

export const ControlSection = ({ notify }: ControlSectionProps): JSX.Element => {
  const [actual, setActual] = useState<Record<ActuatorId, ActualState>>({ fan: 'OFF', led: 'ON', pump: 'OFF' });
  const [pending, setPending] = useState<ActuatorId | null>(null);
  const [fanTimedOut, setFanTimedOut] = useState(false);

  const toggle = (id: ActuatorId): void => {
    if (pending) return;
    const target: ActualState = actual[id] === 'ON' ? 'OFF' : 'ON';
    setPending(id);
    if (id === 'fan') {
      setFanTimedOut(false);
      notify('Command requested — fan-001 (PENDING)');
      window.setTimeout(() => {
        setPending(null);
        setFanTimedOut(true);
        notify('COMMAND TIMEOUT — Device did not respond');
      }, 2200);
      return;
    }
    notify('Command requested — PENDING');
    window.setTimeout(() => {
      setPending(null);
      setActual((current) => ({ ...current, [id]: target }));
      notify(`Actual state received — ${target} · SUCCESS`);
    }, 1600);
  };

  return (
    <div className="screen-stack">
      <PageTitle action={<span className="page-meta">명령 결과는 실제 Actuator state 응답으로만 확정합니다</span>}>Actuator Control</PageTitle>
      <div className="control-grid">
        {ACTUATORS.map((actuator) => {
          const isPending = pending === actuator.id;
          const isTimeout = actuator.id === 'fan' && fanTimedOut;
          const stateLabel = isPending
            ? `TURNING ${actual[actuator.id] === 'ON' ? 'OFF' : 'ON'}...`
            : isTimeout ? 'TIMEOUT' : actual[actuator.id];
          return (
            <Panel className={isTimeout ? 'control-panel control-panel--timeout' : 'control-panel'} key={actuator.id}>
              <header><div><h2>{actuator.name}</h2><small>{actuator.deviceId}</small></div><span className={`actuator-state ${isPending ? 'actuator-state--pending pulse' : isTimeout ? 'actuator-state--danger' : actual[actuator.id] === 'ON' ? 'actuator-state--success' : ''}`}>{stateLabel}</span></header>
              <p>{isTimeout ? 'COMMAND TIMEOUT — Device did not respond.' : actuator.note}</p>
              <button className="primary-button full-button" disabled={isPending} onClick={() => toggle(actuator.id)} type="button">
                {isPending ? 'PENDING …' : isTimeout ? 'RETRY' : actual[actuator.id] === 'ON' ? 'TURN OFF' : 'TURN ON'}
              </button>
              <small className="last-command">Last Command: {actuator.last}</small>
            </Panel>
          );
        })}
      </div>
      <Panel title="Command Flow">
        <div className="command-flow">
          <span>User Click</span><b>→</b><span>Command Requested</span><b>→</b><span className="command-flow__pending">PENDING</span><b>→</b><span>Device Execute</span><b>→</b><span className="command-flow__success">Actual State → SUCCESS</span><b>/</b><span className="command-flow__danger">FAILED · TIMEOUT</span>
        </div>
      </Panel>
    </div>
  );
};
