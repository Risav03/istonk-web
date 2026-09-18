import { Button, Eyebrow, MsgGlyph } from "@/components/ds";
import { site } from "@/lib/site";

const STEPS = [
  {
    n: "01",
    you: "launch fruit vs Apple stock",
    title: "Say it in one text",
    body: "Name, ticker, pair. Say it all at once and iStonk skips straight to confirm.",
  },
  {
    n: "02",
    you: "fruit.png",
    title: "Send a photo, or skip",
    body: "Up to 5 MB. Skip it and the Stonks logo fills in.",
  },
  {
    n: "03",
    you: "confirm",
    title: "Your account signs",
    body: "Creator fees route to you on-chain from block one. Locked at create.",
  },
];

/** Editorial columns on paper. No three-up icon grid. */
export function HowItWorks() {
  return (
    <section
      id="how"
      className="relative scroll-mt-[68px] border-t border-rule"
      style={{ background: "var(--surface)" }}
    >
      <div className="mx-auto grid max-w-[var(--container)] grid-cols-1 gap-12 px-[var(--gutter-mobile)] py-16 md:px-[var(--gutter-desktop)] lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-16 lg:py-22">
        <div>
          <Eyebrow>How it works</Eyebrow>
          <h2 className="type-d2 mt-3.5">
            Three texts.
            <br />
            One live coin.
          </h2>
          <p
            className="mt-4.5 max-w-[380px]"
            style={{ font: "var(--type-body)", color: "var(--text-secondary)" }}
          >
            The whole wizard runs in plain text. Change your mind halfway? Say
            cancel. Nothing to install, nothing to write down.
          </p>
          <div className="mt-6.5">
            <a href={site.bot.launchSmsHref} className="no-underline">
              <Button variant="accent" size="md" icon={<MsgGlyph />}>
                Text iStonk
              </Button>
            </a>
          </div>
        </div>

        <ol className="flex list-none flex-col">
          {STEPS.map((s) => (
            <li
              key={s.n}
              className="grid grid-cols-[40px_minmax(0,1fr)] items-start gap-x-4 gap-y-3 border-t border-rule py-6.5 sm:grid-cols-[56px_minmax(0,1fr)_auto] sm:gap-x-5"
            >
              <span
                className="pt-1"
                style={{ font: "var(--type-mono)", color: "var(--text-tertiary)" }}
              >
                {s.n}
              </span>
              <div>
                <h3 className="type-h2 font-text-face">{s.title}</h3>
                <p
                  className="mt-1.75 max-w-[380px]"
                  style={{
                    font: "var(--type-body-sm)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {s.body}
                </p>
              </div>
              {/* What the user typed, in their own blue bubble. */}
              <span
                className="col-start-2 justify-self-start sm:col-start-3"
                style={{
                  display: "inline-flex",
                  padding: "8px 13px",
                  borderRadius: "var(--r-bubble)",
                  borderBottomRightRadius: "var(--r-bubble-tail)",
                  background: "var(--msg-out)",
                  color: "#fff",
                  font: "400 14px/1.3 var(--font-text)",
                }}
              >
                {s.you}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
