"use client";

import { useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api";

export function useUsdPrices(ids: string[]): Record<string, number> {
  const key = useMemo(
    () =>
      [...new Set(ids.map((id) => id.trim().toLowerCase()).filter(Boolean))]
        .sort()
        .join(","),
    [ids],
  );
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    api
      .prices(key.split(","))
      .then((next) => {
        if (!cancelled) setPrices(next);
      })
      .catch(() => {
        // Keep whatever we already have so a later token fetch doesn't blank ETH.
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return prices;
}
