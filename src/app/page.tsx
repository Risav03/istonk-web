import type { Metadata } from "next";

import { Landing } from "@/components/landing/landing";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `${site.name} · ${site.tagline}`,
  description: site.description,
  openGraph: {
    title: `${site.name} · ${site.tagline}`,
    description: site.description,
    url: "/",
    siteName: site.name,
  },
};

export default function HomePage() {
  return <Landing />;
}
