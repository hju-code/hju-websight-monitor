import type { ReactNode } from "react";

/** Shared page title block: section label, title, short description and optional actions. */
export function PageHeader({ eyebrow, title, children, actions }: { eyebrow?: string; title: string; children?: ReactNode; actions?: ReactNode }) {
  return <header className="page-header">
    <div className="page-header-text">
      {eyebrow && <p className="page-eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {children && <div className="page-description">{children}</div>}
    </div>
    {actions && <div className="page-header-actions">{actions}</div>}
  </header>;
}
