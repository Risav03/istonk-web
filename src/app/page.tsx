import { getAppSession } from "@/lib/app-session";

import { AppClient } from "./app-client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getAppSession();
  return <AppClient initialHasSession={Boolean(session)} />;
}
