import { AccountTeaser } from "./account-teaser";
import { Footer } from "./footer";
import { Hero } from "./hero";
import { HowItWorks } from "./how-it-works";
import { Nav } from "./nav";

export function Landing({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <>
      <Nav signedIn={signedIn} />
      <main className="flex min-h-[100dvh] flex-col overflow-x-clip">
        <Hero signedIn={signedIn} />
        <HowItWorks />
        <AccountTeaser signedIn={signedIn} />
        <Footer />
      </main>
    </>
  );
}
