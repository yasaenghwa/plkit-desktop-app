import { useEffect, useState, type FormEvent } from 'react';
import { z } from 'zod';

import { gatewayApi, getGatewayErrorMessage, type AssistantContext } from '@entities/farm';
import { Icon, PageTitle, Panel, StatusBadge } from '@shared/ui';

const SPARKLE = 'M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z';
const SEND = 'M22 2 11 13 M22 2 15 22l-4-9-9-4Z';

type Message = {
  readonly id: string;
  readonly role: 'assistant' | 'user';
  readonly text: string;
  readonly time: string;
};

const INITIAL_MESSAGES: readonly Message[] = [
  { id: 'demo-user', role: 'user', text: '상추가 시들었는데 끝부분이 갈색이야', time: '11:23 AM' },
  {
    id: 'demo-assistant',
    role: 'assistant',
    text: '잎 끝 갈변(Tip Burn)은 칼슘 이동 저해가 원인인 경우가 많습니다.\n현재 토양 수분 42.3%·습도 61%는 적정 범위이지만, 급격한 광량 증가 시 증산이 따라가지 못할 수 있어요.\n\n권장: 1) 환기 팬으로 공기 순환 확보 2) 정오 광량 피크 시 차광 3) 급수 주기 유지',
    time: '11:23 AM',
  },
];

const CONTEXT = [
  ['Temperature', '23.8°C', 62],
  ['Humidity', '61%', 61],
  ['Soil Moisture', '42.37%', 55],
] as const;

type AssistantSectionProps = { readonly notify: (message: string) => void };

const assistantMessageInputSchema = z.string().trim().min(1);

export const AssistantSection = ({ notify }: AssistantSectionProps): JSX.Element => {
  const [messages, setMessages] = useState<readonly Message[]>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState('');
  const [context, setContext] = useState<AssistantContext | null>(null);
  const [sessionId, setSessionId] = useState('dashboard');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      gatewayApi.assistant.context(controller.signal),
      gatewayApi.assistant.sessions(controller.signal),
    ])
      .then(([farmContext, sessions]) => {
        setContext(farmContext);
        const latestSession = sessions.items[0];
        if (latestSession) setSessionId(latestSession.sessionId);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        notify(`Assistant context 조회 실패 · ${getGatewayErrorMessage(error)}`);
      });
    return () => controller.abort();
  }, [notify]);

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const result = assistantMessageInputSchema.safeParse(draft);
    if (!result.success || sending) return;
    const text = result.data;
    const now = new Date();
    const time = `${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
    const id = `local-${Date.now()}`;
    setMessages((current) => [...current, { id, role: 'user', text, time }]);
    setDraft('');
    setSending(true);
    try {
      const response = await gatewayApi.assistant.send(sessionId, text);
      setMessages((current) => [
        ...current,
        {
          id: response.messageId,
          role: 'assistant',
          text: response.reply,
          time: new Date(response.createdAt).toLocaleTimeString(),
        },
      ]);
    } catch (error) {
      notify(`Assistant 메시지 전송 실패 · ${getGatewayErrorMessage(error)}`);
    } finally {
      setSending(false);
    }
  };

  const contextRows = context
    ? ([
        [
          'Temperature',
          `${context.temperature}°C`,
          Math.min(100, Math.max(0, context.temperature)),
        ],
        ['Humidity', `${context.humidity}%`, Math.min(100, Math.max(0, context.humidity))],
        ['Soil Moisture', `${context.soil}%`, Math.min(100, Math.max(0, context.soil))],
      ] as const)
    : CONTEXT;

  return (
    <div className="screen-stack assistant-screen">
      <PageTitle
        iconPath={SPARKLE}
        subtitle="Consult with PLKIT AI for data-driven farming insights."
      >
        AI Farm Assistant
      </PageTitle>
      <div className="assistant-grid">
        <section className="chat-panel">
          <header className="chat-header">
            <span className="chat-avatar">
              <Icon path={SPARKLE} size={15} />
            </span>
            <div>
              <strong>PLKIT AI</strong>
              <StatusBadge label="Online & Monitoring" tone="success" />
            </div>
          </header>
          <div aria-live="polite" className="chat-messages">
            <div className="chat-date">
              <span>Today</span>
            </div>
            {messages.map((message) => (
              <article className={`chat-message chat-message--${message.role}`} key={message.id}>
                {message.role === 'assistant' ? (
                  <span className="chat-avatar chat-avatar--small">
                    <Icon path={SPARKLE} size={13} />
                  </span>
                ) : null}
                <div>
                  <p>{message.text}</p>
                  <time>{message.time}</time>
                </div>
              </article>
            ))}
          </div>
          <form className="chat-form" onSubmit={(event) => void submit(event)}>
            <div>
              <label className="sr-only" htmlFor="assistant-message">
                Farm status question
              </label>
              <input
                id="assistant-message"
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask something about farm status..."
                value={draft}
              />
              <button aria-label="Send message" disabled={sending} type="submit">
                <Icon path={SEND} size={16} />
              </button>
            </div>
            <small>AI can make mistakes. Verify critical farm data.</small>
          </form>
        </section>
        <aside className="assistant-context">
          <Panel title="Current Farm Context">
            <div className="context-metrics">
              {contextRows.map(([label, value, progress]) => (
                <div key={label}>
                  <span>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </span>
                  <span className="progress-track">
                    <span style={{ inlineSize: `${progress}%` }} />
                  </span>
                </div>
              ))}
            </div>
            <div className="system-status">
              <span className="state-dot state-dot--online" />
              System Status: {context?.systemStatus ?? 'Checking'}
            </div>
          </Panel>
          <Panel className="alerts-panel" title="Recent Alerts">
            <div className="context-alerts">
              <article>
                <time>14:47 PM</time>
                <p>fan-001 Command Timeout</p>
              </article>
              <article className="context-alert--muted">
                <time>13:12 PM</time>
                <p>Aux Light Sensor Offline</p>
              </article>
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
};
