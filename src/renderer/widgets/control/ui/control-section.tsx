import { useEffect, useState } from 'react';

import { gatewayApi, getGatewayErrorMessage } from '@entities/farm';
import { PageTitle, Panel } from '@shared/ui';

const ACTUATORS = [
  {
    id: 'pump',
    name: 'Water Pump',
    deviceId: 'pump-001',
    note: '무제한 ON 방지를 위해 실제 state 수신 후 상태를 확정합니다.',
    last: 'OFF / SUCCESS / 15:29',
  },
  {
    id: 'led',
    name: 'Grow Light',
    deviceId: 'led-001',
    note: '자연광 부족 시 보조 조명으로 사용합니다.',
    last: 'ON / SUCCESS / 14:02',
  },
  {
    id: 'fan',
    name: 'Ventilation Fan',
    deviceId: 'fan-001',
    note: '응답 지연 시 TIMEOUT으로 처리됩니다 (데모: 항상 타임아웃).',
    last: 'OFF / SUCCESS / 어제 21:00',
  },
] as const;

type ActuatorId = (typeof ACTUATORS)[number]['id'];
type ActualState = 'OFF' | 'ON';
type PendingCommand = { readonly actuatorId: ActuatorId; readonly commandId: string | null };

type ControlSectionProps = {
  readonly notify: (message: string) => void;
};

export const ControlSection = ({ notify }: ControlSectionProps): JSX.Element => {
  const [actual, setActual] = useState<Record<ActuatorId, ActualState>>({
    fan: 'OFF',
    led: 'ON',
    pump: 'OFF',
  });
  const [pending, setPending] = useState<PendingCommand | null>(null);
  const [timedOut, setTimedOut] = useState<ActuatorId | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    gatewayApi.actuators
      .list(controller.signal)
      .then((response) => {
        setActual((current) => {
          const next = { ...current };
          for (const actuator of ACTUATORS) {
            const remote = response.items.find((item) => item.deviceId === actuator.deviceId);
            if (remote?.state === 'ON' || remote?.state === 'OFF') next[actuator.id] = remote.state;
          }
          return next;
        });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        notify(`Actuator 조회 실패 · ${getGatewayErrorMessage(error)}`);
      });
    const disconnect = gatewayApi.socket.connect({
      channels: ['actuator'],
      onError: (error) => notify(`Actuator WebSocket 실패 · ${error.message}`),
      onEvent: (event) => {
        switch (event.channel) {
          case 'actuator': {
            const actuator = ACTUATORS.find((item) => item.deviceId === event.deviceId);
            if (!actuator) return;
            setPending((current) => (current?.commandId === event.commandId ? null : current));
            if (event.result === 'SUCCESS' && (event.state === 'ON' || event.state === 'OFF')) {
              setActual((current) => ({ ...current, [actuator.id]: event.state }));
              setTimedOut(null);
              notify(`Actual state received — ${event.state} · SUCCESS`);
              return;
            }
            if (event.result === 'TIMEOUT') {
              setTimedOut(actuator.id);
              notify('COMMAND TIMEOUT — Device did not respond');
              return;
            }
            notify(`Command failed — ${event.deviceId}`);
            break;
          }
          case 'event':
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

  const toggle = async (id: ActuatorId): Promise<void> => {
    if (pending) return;
    const target: ActualState = actual[id] === 'ON' ? 'OFF' : 'ON';
    const actuator = ACTUATORS.find((item) => item.id === id);
    if (!actuator) return;
    setPending({ actuatorId: id, commandId: null });
    setTimedOut(null);
    notify(`Command requested — ${actuator.deviceId} (PENDING)`);
    try {
      const command = await gatewayApi.actuators.command(actuator.deviceId, {
        command: target,
        origin: 'USER',
      });
      setPending({ actuatorId: id, commandId: command.commandId });
    } catch (error) {
      setPending(null);
      notify(`Command 요청 실패 · ${getGatewayErrorMessage(error)}`);
    }
  };

  return (
    <div className="screen-stack">
      <PageTitle
        action={
          <span className="page-meta">명령 결과는 실제 Actuator state 응답으로만 확정합니다</span>
        }
      >
        Actuator Control
      </PageTitle>
      <div className="control-grid">
        {ACTUATORS.map((actuator) => {
          const isPending = pending?.actuatorId === actuator.id;
          const isTimeout = timedOut === actuator.id;
          const stateLabel = isPending
            ? `TURNING ${actual[actuator.id] === 'ON' ? 'OFF' : 'ON'}...`
            : isTimeout
              ? 'TIMEOUT'
              : actual[actuator.id];
          return (
            <Panel
              className={isTimeout ? 'control-panel control-panel--timeout' : 'control-panel'}
              key={actuator.id}
            >
              <header>
                <div>
                  <h2>{actuator.name}</h2>
                  <small>{actuator.deviceId}</small>
                </div>
                <span
                  className={`actuator-state ${isPending ? 'actuator-state--pending pulse' : isTimeout ? 'actuator-state--danger' : actual[actuator.id] === 'ON' ? 'actuator-state--success' : ''}`}
                >
                  {stateLabel}
                </span>
              </header>
              <p>{isTimeout ? 'COMMAND TIMEOUT — Device did not respond.' : actuator.note}</p>
              <button
                className="primary-button full-button"
                disabled={isPending}
                onClick={() => void toggle(actuator.id)}
                type="button"
              >
                {isPending
                  ? 'PENDING …'
                  : isTimeout
                    ? 'RETRY'
                    : actual[actuator.id] === 'ON'
                      ? 'TURN OFF'
                      : 'TURN ON'}
              </button>
              <small className="last-command">Last Command: {actuator.last}</small>
            </Panel>
          );
        })}
      </div>
      <Panel title="Command Flow">
        <div className="command-flow">
          <span>User Click</span>
          <b>→</b>
          <span>Command Requested</span>
          <b>→</b>
          <span className="command-flow__pending">PENDING</span>
          <b>→</b>
          <span>Device Execute</span>
          <b>→</b>
          <span className="command-flow__success">Actual State → SUCCESS</span>
          <b>/</b>
          <span className="command-flow__danger">FAILED · TIMEOUT</span>
        </div>
      </Panel>
    </div>
  );
};
