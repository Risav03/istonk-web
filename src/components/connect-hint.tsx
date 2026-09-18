"use client";

import { useState } from "react";

import { site } from "@/lib/site";

import { Eyebrow } from "./ds";

/**
 * The web can't sign you up — iStonk creates accounts from a text. So say the
 * number out loud instead of "text iStonk": tapping it opens Messages with
 * `connect` already typed, and Copy covers everyone reading this on a desktop.
 */
export function ConnectHint({
  eyebrow = "No account yet?",
  word = "connect",
  tail = "and iStonk will send you straight back here.",
}: {
  eyebrow?: string;
  word?: string;
  tail?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(site.bot.phoneE164);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked; the number is on screen anyway */
    }
  }

  return (
    <div
      className="flex flex-col gap-2 border border-rule p-4"
      style={{ background: "var(--bg-sunk)", borderRadius: "var(--r-md)" }}
    >
      <Eyebrow>{eyebrow}</Eyebrow>
      <p style={{ font: "var(--type-body-sm)", color: "var(--text-secondary)" }}>
        Text <code style={{ font: "var(--type-mono)", color: "var(--text-primary)" }}>{word}</code>{" "}
        {tail}
      </p>
      <div className="mt-0.5 flex flex-wrap items-center justify-between gap-3">
        <a
          href={site.bot.connectSmsHref}
          className="inline-flex items-center gap-1.5 no-underline"
          style={{
            font: "500 17px/1.2 var(--font-mono)",
            fontVariantNumeric: "var(--numeric-tabular)",
            color: "var(--text-accent)",
          }}
        >
          {site.bot.phonePretty}
          <span aria-hidden>›</span>
        </a>
        <button
          type="button"
          onClick={copy}
          className="cursor-pointer border-0 bg-transparent p-0"
          style={{
            font: "var(--type-micro)",
            color: copied ? "var(--up)" : "var(--text-secondary)",
          }}
        >
          {copied ? "Copied" : "Copy number"}
        </button>
      </div>
    </div>
  );
}
