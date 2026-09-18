import type { CSSProperties, InputHTMLAttributes, ReactNode } from "react";

/** Field on paper. Square radius: forms are data, not conversation. */
export function Input({
  label,
  hint,
  error,
  mono = false,
  prefix,
  suffix,
  style,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> & {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  mono?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label ? (
        <span style={{ font: "var(--type-label)", color: "var(--text-secondary)" }}>
          {label}
        </span>
      ) : null}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          height: 48,
          padding: "0 14px",
          background: "var(--bg-card)",
          border: `1px solid ${error ? "var(--down)" : "var(--border-strong)"}`,
          borderRadius: "var(--r-field)",
          boxShadow: "var(--shadow-flat)",
        }}
      >
        {prefix ? (
          <span style={{ font: "var(--type-mono)", color: "var(--text-tertiary)" }}>
            {prefix}
          </span>
        ) : null}
        <input
          style={{
            flex: 1,
            minWidth: 0,
            border: 0,
            outline: "none",
            background: "transparent",
            font: mono ? "var(--type-mono)" : "400 15px/1.2 var(--font-text)",
            ...style,
          }}
          {...rest}
        />
        {suffix}
      </span>
      {error ? (
        <span style={{ font: "var(--type-body-sm)", color: "var(--down)" }}>
          {error}
        </span>
      ) : hint ? (
        <span style={{ font: "var(--type-body-sm)", color: "var(--text-tertiary)" }}>
          {hint}
        </span>
      ) : null}
    </label>
  );
}

/** Six tape cells. The only place mono gets big. */
export function OtpField({
  value = "",
  length = 6,
  onChange,
  autoFocus,
  disabled,
  style,
}: {
  value?: string;
  length?: number;
  onChange?: (next: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
  style?: CSSProperties;
}) {
  const cells = Array.from({ length }, (_, i) => value[i] ?? "");
  const active = Math.min(value.length, length - 1);
  return (
    <label style={{ position: "relative", display: "block", ...style }}>
      <span
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
        }}
      >
        {length}-digit code
      </span>
      <input
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus={autoFocus}
        disabled={disabled}
        value={value}
        onChange={(e) =>
          onChange?.(e.target.value.replace(/\D/g, "").slice(0, length))
        }
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0,
          zIndex: 2,
          border: 0,
        }}
      />
      <span
        aria-hidden
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${length}, 1fr)`,
          gap: 8,
        }}
      >
        {cells.map((d, i) => (
          <span
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 58,
              background: "var(--bg-card)",
              border: `1px solid ${
                d || i === active ? "var(--ink)" : "var(--border-strong)"
              }`,
              borderRadius: "var(--r-xs)",
              font: "500 24px/1 var(--font-mono)",
              color: d ? "var(--text-primary)" : "var(--text-tertiary)",
              fontVariantNumeric: "var(--numeric-tabular)",
            }}
          >
            {d || "·"}
          </span>
        ))}
      </span>
    </label>
  );
}
