import assert from "node:assert/strict";
import test from "node:test";

import { ISTONKS_TOKEN, dailyAmountSeries, splitBurnsByToken } from "./burn-series";

test("dailyAmountSeries sums burns onto each UTC day", () => {
  const series = dailyAmountSeries(
    [
      { file: "2026-09-15-050017.tokenburn.json", value: 13_294_359.996 },
      { file: "2026-09-15-060019.tokenburn.json", value: 187_047.3286 },
      { file: "2026-09-12-1658.tokenburn.json", value: 3_000_000 },
    ],
    4,
    new Date("2026-09-15T20:00:00Z"),
  );
  assert.equal(series.length, 4);
  const fifteenth = series.find((row) => row.key === "2026-09-15");
  assert.ok(fifteenth);
  assert.equal(fifteenth.value, 13_481_407.3246);
  assert.match(fifteenth.hint, /2 burns/);
});

test("splitBurnsByToken keeps ISTONKS off the BASEMATE chart", () => {
  const split = splitBurnsByToken(
    [
      {
        file: "2026-09-15-140025.buyburn.json",
        tokenAddress: ISTONKS_TOKEN,
        tokenOut: 57_431.1859,
        tokenDecimals: 18,
        swapTxHash: "0xabc",
        burnTxHash: "0x3b0453ed92ec4bf886c10295bfd99588dfbb0db68e395bf6ea9badcc4bf01888",
      },
      {
        file: "2026-09-15-140033.buyburn.json",
        tokenAddress: "0x07e61d8a4e197dfc269e90d7ece1df0d26702ba3",
        tokenOut: 8_743_204.07,
        tokenDecimals: 18,
        swapTxHash: "0xdef",
        burnTxHash: "0xb9fd029f8c04f6bf627eb5783435c629fcceaa797102e73563b3ecbc766a486a",
      },
    ],
    [],
  );
  assert.equal(split.buyburns.length, 1);
  assert.equal(split.buyburns[0]?.tokenOut, 8_743_204.07);
  assert.equal(split.tokenBurns.length, 1);
  assert.equal(split.tokenBurns[0]?.amount, 57_431.1859);
});
