import { MasterPageClient } from "./MasterPageClient";

import { getServerSessionUser } from "@/lib/auth/server-session";

export default async function MasterPage(): Promise<React.JSX.Element> {
  const user = await getServerSessionUser();
  const canManage = user?.role === "admin";

  return <MasterPageClient canManage={canManage} />;
}
