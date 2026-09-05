import './dashboard-page.css';

export const DashboardPage = (): JSX.Element => (
  <main className="dashboard-shell">
    <section className="dashboard-panel" aria-labelledby="dashboard-title">
      <p className="dashboard-eyebrow">PLKIT / DESKTOP</p>
      <h1 id="dashboard-title">PLKIT Desktop Dashboard</h1>
      <p className="dashboard-description">
        스마트팜 대시보드 개발 환경이 준비되었습니다. 다음 기능은 FSD 레이어를 통해 추가합니다.
      </p>
      <p className="dashboard-status" role="status">
        <span aria-hidden="true" className="dashboard-status-dot" />
        Application ready
      </p>
    </section>
  </main>
);
