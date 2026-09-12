import { Landing } from "@/components/landing/landing";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

export const metadata = pageMetadata({
  path: "/",
  description: site.description,
});

export default function HomePage() {
  return <Landing />;
}
