"use client";

import { Aurora } from "./aurora";
import { Footer } from "./footer";
import { Hero } from "./hero";
import { HowItWorks } from "./how-it-works";
import { Nav } from "./nav";
import { NextUp } from "./next-up";
import { Ticker } from "./ticker";
import { Wallet } from "./wallet";

export function Landing() {
  return (
    <>
      <Aurora />
      <Nav />
      <main className="relative z-10 flex min-h-[100dvh] flex-col overflow-x-clip">
        <Hero />
        <Ticker />
        <HowItWorks />
        <Wallet />
        <NextUp />
        <Footer />
      </main>
    </>
  );
}
