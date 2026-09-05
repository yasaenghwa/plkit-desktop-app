import { useState, type FormEvent } from 'react';

import { Icon, PageTitle, Panel, StatusBadge } from '@shared/ui';

const SPARKLE = 'M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z';
const SEND = 'M22 2 11 13 M22 2 15 22l-4-9-9-4Z';

type Message = {
  readonly id: number;
  readonly role: 'assistant' | 'user';
  readonly text: string;
  readonly time: string;
};

const INITIAL_MESSAGES: readonly Message[] = [
  { id: 1, role: 'user', text: '상추가 시들었는데 끝부분이 갈색이야', time: '11:23 AM' },
  {
    id: 2,
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

export const AssistantSection = (): JSX.Element => {
  const [messages, setMessages] = useState<readonly Message[]>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState('');
  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const now = new Date();
    const time = `${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
    const id = Date.now();
    setMessages((current) => [...current, { id, role: 'user', text, time }]);
    setDraft('');
    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          id: id + 1,
          role: 'assistant',
          text: '현재 Gateway 데이터 기준으로 확인했습니다. 토양 수분 · 온습도 · 조도는 모두 적정 범위이며, 마지막 급수는 08:31 (Pump 10초)입니다. 더 구체적인 항목을 물어보시면 해당 센서 이력을 함께 분석해 드릴게요.',
          time,
        },
      ]);
    }, 900);
  };

  return (
    <div className="screen-stack assistant-screen">
      <PageTitle iconPath={SPARKLE} subtitle="Consult with PLKIT AI for data-driven farming insights.">AI Farm Assistant</PageTitle>
      <div className="assistant-grid">
        <section className="chat-panel">
          <header className="chat-header">
            <span className="chat-avatar"><Icon path={SPARKLE} size={15} /></span>
            <div><strong>PLKIT AI</strong><StatusBadge label="Online & Monitoring" tone="success" /></div>
          </header>
          <div aria-live="polite" className="chat-messages">
            <div className="chat-date"><span>Today</span></div>
            {messages.map((message) => (
              <article className={`chat-message chat-message--${message.role}`} key={message.id}>
                {message.role === 'assistant' ? <span className="chat-avatar chat-avatar--small"><Icon path={SPARKLE} size={13} /></span> : null}
                <div><p>{message.text}</p><time>{message.time}</time></div>
              </article>
            ))}
          </div>
          <form className="chat-form" onSubmit={submit}>
            <div>
              <label className="sr-only" htmlFor="assistant-message">Farm status question</label>
              <input id="assistant-message" onChange={(event) => setDraft(event.target.value)} placeholder="Ask something about farm status..." value={draft} />
              <button aria-label="Send message" type="submit"><Icon path={SEND} size={16} /></button>
            </div>
            <small>AI can make mistakes. Verify critical farm data.</small>
          </form>
        </section>
        <aside className="assistant-context">
          <Panel title="Current Farm Context">
            <div className="context-metrics">
              {CONTEXT.map(([label, value, progress]) => (
                <div key={label}>
                  <span><span>{label}</span><strong>{value}</strong></span>
                  <span className="progress-track"><span style={{ inlineSize: `${progress}%` }} /></span>
                </div>
              ))}
            </div>
            <div className="system-status"><span className="state-dot state-dot--online" />System Status: Nominal</div>
          </Panel>
          <Panel className="alerts-panel" title="Recent Alerts">
            <div className="context-alerts">
              <article><time>14:47 PM</time><p>fan-001 Command Timeout</p></article>
              <article className="context-alert--muted"><time>13:12 PM</time><p>Aux Light Sensor Offline</p></article>
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
};
