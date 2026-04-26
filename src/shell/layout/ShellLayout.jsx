// Canonical layout container. Renders the active skin's Background,
// fills the viewport, owns no chrome of its own.
import { useSkin } from '../skins/SkinContext.jsx';

export default function ShellLayout({ children }) {
  const { skin } = useSkin();
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--bg)',
        color: 'var(--ink)',
        fontFamily: 'var(--font-body)',
        overflow: 'hidden',
      }}
    >
      <skin.Background />
      <div
        style={{
          position: 'absolute',
          inset: skin.id === 'page' ? 20 : 0,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}
