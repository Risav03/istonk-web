/**
 * Static pastel wash behind the page. Painted once and never touched again —
 * the previous version animated six 500–700px blurred blobs on every frame,
 * which is what was crashing low-end phones.
 */
const blobs = [
  { color: "rgba(255, 120, 215, 0.45)", size: 640, x: "0%", y: "0%" },
  { color: "rgba(110, 160, 255, 0.45)", size: 720, x: "58%", y: "-6%" },
  { color: "rgba(255, 180, 90, 0.45)", size: 560, x: "66%", y: "40%" },
  { color: "rgba(160, 140, 255, 0.45)", size: 680, x: "-4%", y: "48%" },
  { color: "rgba(100, 220, 255, 0.45)", size: 520, x: "34%", y: "62%" },
  { color: "rgba(255, 230, 120, 0.4)", size: 480, x: "72%", y: "72%" },
];

export function Aurora() {
  return (
    <div className="aurora-wash pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-[-10%]">
        {blobs.map((b, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              width: b.size,
              height: b.size,
              left: b.x,
              top: b.y,
              background: `radial-gradient(circle at 40% 40%, ${b.color}, transparent 68%)`,
            }}
          />
        ))}
      </div>
      {/* white centre so copy stays legible, like the brand render */}
      <div className="absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_45%,rgba(255,255,255,0.55),rgba(255,255,255,0)_75%)]" />
    </div>
  );
}
