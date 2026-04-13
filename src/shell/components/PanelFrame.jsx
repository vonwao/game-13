export default function PanelFrame({ eyebrow, title, subtitle, children, footer }) {
  return (
    <section className="panel-frame">
      {eyebrow ? <p className="panel-frame__eyebrow">{eyebrow}</p> : null}
      <h2 className="panel-frame__title">{title}</h2>
      {subtitle ? <p className="panel-frame__subcopy">{subtitle}</p> : null}
      <div className="panel-frame__body">{children}</div>
      {footer ? <div className="panel-note">{footer}</div> : null}
    </section>
  );
}
