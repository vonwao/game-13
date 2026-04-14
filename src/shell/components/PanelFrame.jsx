export default function PanelFrame({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  className = '',
  bodyClassName = '',
}) {
  const frameClassName = className ? `panel-frame ${className}` : 'panel-frame';
  const bodyClass = bodyClassName ? `panel-frame__body ${bodyClassName}` : 'panel-frame__body';

  return (
    <section className={frameClassName}>
      {eyebrow ? <p className="panel-frame__eyebrow">{eyebrow}</p> : null}
      <h2 className="panel-frame__title">{title}</h2>
      {subtitle ? <p className="panel-frame__subcopy">{subtitle}</p> : null}
      <div className={bodyClass}>{children}</div>
      {footer ? <div className="panel-note">{footer}</div> : null}
    </section>
  );
}
