import { useEffect, useRef } from 'react';

export default function GameCanvas({ state }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (!window.LD || !window.LD.Game || typeof window.LD.Game.mount !== 'function') return;
    window.LD.Game.mount(canvasRef.current);
  }, []);

  const showCanvas =
    state.phase === 'playing' ||
    state.phase === 'victory' ||
    state.phase === 'gameover';

  return (
    <section className="game-canvas-shell" aria-label="Game canvas mount area">
      <div className="game-canvas-shell__badge">{showCanvas ? 'Live canvas' : 'Shell-owned phase'}</div>
      <div className="game-canvas-shell__mount">
        <canvas
          id="game"
          ref={canvasRef}
          className={`game-canvas-shell__canvas${showCanvas ? '' : ' game-canvas-shell__canvas--hidden'}`}
          aria-hidden={!showCanvas}
        />
        {!showCanvas ? (
          <div className="game-canvas-shell__placeholder">
            <h2>Shell-owned setup phase</h2>
            <p>
              Title and settings now live in the React shell. The canvas game stays mounted
              behind the scenes and takes over once a round starts.
            </p>
            <p className="is-muted" style={{ marginTop: '0.85rem' }}>
              Phase: {state.phase} · Mode: {state.gameMode} · Score: {state.run.score}
            </p>
          </div>
        ) : null}
        {showCanvas ? (
          <div className="game-canvas-shell__overlay">
            <span>{state.gameMode}</span>
            <span>score {state.run.score}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
