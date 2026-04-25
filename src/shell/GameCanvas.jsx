import { useEffect, useRef } from 'react';
import { setShellLayout, startGame } from './gameBridge.js';

export default function GameCanvas({ state }) {
  const canvasRef = useRef(null);
  const mountRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (!window.LD || !window.LD.Game || typeof window.LD.Game.mount !== 'function') return;
    window.LD.Game.mount(canvasRef.current);
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    const node = mountRef.current;
    let frame = 0;

    function emitLayout() {
      frame = 0;
      const rect = node.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      setShellLayout({
        width,
        height,
        aspect: width / Math.max(1, height),
        orientation: width < height ? 'portrait' : 'landscape',
      });
    }

    function scheduleLayout() {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(emitLayout);
    }

    scheduleLayout();

    let observer = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(scheduleLayout);
      observer.observe(node);
    } else {
      window.addEventListener('resize', scheduleLayout);
    }

    return () => {
      if (frame) cancelAnimationFrame(frame);
      if (observer) observer.disconnect();
      else window.removeEventListener('resize', scheduleLayout);
    };
  }, []);

  const showCanvas =
    state.phase === 'playing' ||
    state.phase === 'victory' ||
    state.phase === 'gameover';

  return (
    <section className="game-canvas-shell" aria-label="Game canvas mount area">
      <div ref={mountRef} className="game-canvas-shell__mount">
        <canvas
          id="game"
          ref={canvasRef}
          className={`game-canvas-shell__canvas${showCanvas ? '' : ' game-canvas-shell__canvas--hidden'}`}
          aria-hidden={!showCanvas}
        />
        {!showCanvas ? (
          <div className="game-canvas-shell__placeholder">
            <h2>Ready when you are</h2>
            <p>
              Mode: <strong>{state.gameMode}</strong>. Tweak setup on the left, then start.
            </p>
            <button
              type="button"
              className="shell-button shell-button--accent"
              style={{ marginTop: '1rem' }}
              onClick={startGame}
            >
              Start Game
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
