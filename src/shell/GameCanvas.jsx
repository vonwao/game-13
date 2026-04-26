import { useEffect, useRef } from 'react';
import { setShellLayout } from './gameBridge.js';

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
    <div
      ref={mountRef}
      data-testid="canvas-mount"
      style={{
        position: 'relative',
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        display: 'block',
      }}
    >
      <canvas
        id="game"
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          background: 'transparent',
          opacity: showCanvas ? 1 : 0,
          pointerEvents: showCanvas ? 'auto' : 'none',
          imageRendering: 'pixelated',
        }}
        aria-hidden={!showCanvas}
      />
    </div>
  );
}
