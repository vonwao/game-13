import { useRef } from 'react';

export default function GameCanvas({ state }) {
  const mountRef = useRef(null);

  return (
    <section className="game-canvas-shell" aria-label="Game canvas mount area">
      <div className="game-canvas-shell__badge">Canvas mount</div>
      <div className="game-canvas-shell__mount" ref={mountRef}>
        <div className="game-canvas-shell__placeholder">
          <h2>Existing canvas game mounts here later</h2>
          <p>
            This shell scaffold keeps the board core out of React for now. The
            canvas/game bridge will attach to this region in the next migration
            step.
          </p>
          <p className="is-muted" style={{ marginTop: '0.85rem' }}>
            Phase: {state.phase} · Mode: {state.gameMode} · Score: {state.run.score}
          </p>
        </div>
      </div>
    </section>
  );
}
