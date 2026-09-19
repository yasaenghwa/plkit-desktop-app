import { useEffect, useRef, useState, type FormEvent } from 'react';

import { gatewaySettingsSchema, type GatewaySettings } from '../../../../gateway-settings';

type ConnectionSettingsDialogProps = {
  readonly onClose: () => void;
  readonly settings: GatewaySettings;
};

export const ConnectionSettingsDialog = ({
  onClose,
  settings,
}: ConnectionSettingsDialogProps): JSX.Element => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState(settings.mode);
  const [localApiBaseUrl, setLocalApiBaseUrl] = useState(settings.localApiBaseUrl);
  const [localWsUrl, setLocalWsUrl] = useState(settings.localWsUrl);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  const save = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const parsed = gatewaySettingsSchema.safeParse({
      mode,
      localApiBaseUrl: mode === 'mock' ? settings.localApiBaseUrl : localApiBaseUrl,
      localWsUrl: mode === 'mock' ? settings.localWsUrl : localWsUrl,
    });
    if (!parsed.success) {
      const field = parsed.error.issues[0]?.path[0];
      setError(
        field === 'localApiBaseUrl'
          ? 'REST URL은 http(s)://호스트[:포트]/api/v1 형식이어야 합니다.'
          : 'WebSocket URL은 ws(s)://호스트[:포트]/ws 형식이어야 합니다.',
      );
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await window.gatewaySettings.save(parsed.data);
      window.location.reload();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '설정을 저장하지 못했습니다.');
      setSaving(false);
    }
  };

  return (
    <dialog
      aria-labelledby="connection-settings-title"
      className="connection-settings"
      onClose={onClose}
      ref={dialogRef}
    >
      <form onSubmit={(event) => void save(event)}>
        <div className="connection-settings__header">
          <div>
            <h2 id="connection-settings-title">Gateway 연결 설정</h2>
            <p>같은 앱에서 시연용 Mock과 실제 Gateway Core를 전환합니다.</p>
          </div>
          <button
            aria-label="설정 닫기"
            className="connection-settings__close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <fieldset className="connection-settings__modes">
          <legend>연결 대상</legend>
          <label>
            <input
              checked={mode === 'mock'}
              onChange={() => setMode('mock')}
              type="radio"
              value="mock"
            />
            <span>
              <strong>Mock</strong>
              <small>시연 서버 · 기본값</small>
            </span>
          </label>
          <label>
            <input
              checked={mode === 'local'}
              onChange={() => setMode('local')}
              type="radio"
              value="local"
            />
            <span>
              <strong>Local</strong>
              <small>내 PC의 Gateway Core</small>
            </span>
          </label>
        </fieldset>
        {mode === 'local' ? (
          <div className="connection-settings__urls">
            <label htmlFor="local-rest-url">REST API Base URL</label>
            <input
              id="local-rest-url"
              onChange={(event) => setLocalApiBaseUrl(event.target.value)}
              spellCheck={false}
              type="text"
              value={localApiBaseUrl}
            />
            <label htmlFor="local-ws-url">WebSocket URL</label>
            <input
              id="local-ws-url"
              onChange={(event) => setLocalWsUrl(event.target.value)}
              spellCheck={false}
              type="text"
              value={localWsUrl}
            />
            <p>Gateway가 다른 포트에서 실행 중이면 주소에 포트를 입력하세요.</p>
          </div>
        ) : null}
        {error ? (
          <p className="connection-settings__error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="connection-settings__actions">
          <button className="connection-settings__cancel" onClick={onClose} type="button">
            취소
          </button>
          <button className="primary-button" disabled={saving} type="submit">
            {saving ? '저장 중…' : '저장 후 다시 연결'}
          </button>
        </div>
      </form>
    </dialog>
  );
};
