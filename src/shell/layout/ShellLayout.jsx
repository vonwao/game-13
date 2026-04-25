export default function ShellLayout({ state, children }) {
  return (
    <div className="app-shell">
      <div className="shell-layout">
        <header className="shell-layout__header">
          <div className="shell-brand">
            <p className="shell-brand__eyebrow">Lexicon Deep</p>
            <h1 className="shell-brand__title">Lexicon Deep</h1>
          </div>

          <div className="shell-chips" aria-label="Shell summary">
            <span className="shell-chip">Phase: {state.phase}</span>
            <span className="shell-chip">Mode: {state.gameMode}</span>
            <span className="shell-chip">Score: {state.run.score}</span>
            <span className="shell-chip">Round: {state.huntSummary.round}/{state.huntSummary.maxRounds}</span>
          </div>
        </header>

        <main className="shell-layout__main">{children}</main>
      </div>
    </div>
  );
}
