/*
 * Layout primitives for the /app cards, built on the design system in ./ds.
 * Everything visual lives there; this file only holds the card + field
 * scaffolding the account surfaces share. Import Button, Chip, Badge, Figure
 * and friends straight from ./ds.
 */
import type { HTMLAttributes, ReactNode } from "react";

import { Panel, PanelHead } from "./ds";

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** White card, 1px hairline, short warm shadow. `accent` adds the iris edge. */
export function Card({
  className,
  accent = false,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { accent?: boolean }) {
  return (
    <Panel
      className={cx("flex flex-col", accent && "istonk-iris-edge", className)}
      {...rest}
    />
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return <PanelHead title={title} sub={subtitle} action={action} />;
}

/** A row inside a card. Hairline above, never a box of its own. */
export function Row({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        "flex items-center justify-between gap-4 border-t border-rule px-5 py-3.5",
        className,
      )}
      {...rest}
    />
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="type-label" style={{ color: "var(--text-secondary)" }}>
        {label}
      </span>
      {children}
      {hint ? (
        <span style={{ font: "var(--type-legal)", color: "var(--text-tertiary)" }}>{hint}</span>
      ) : null}
    </label>
  );
}

/** Fields are data, not conversation: 8px radius, hairline, no glow. */
export const inputClass = "istonk-field";
