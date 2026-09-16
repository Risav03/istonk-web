import { Landing } from "@/components/landing/landing";
import { getAppSession } from "@/lib/app-session";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

export const metadata = pageMetadata({
  path: "/",
  description: site.description,
});

export default async function HomePage() {
  const session = await getAppSession();
  return <Landing signedIn={Boolean(session)} />;
}
