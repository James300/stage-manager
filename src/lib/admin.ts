import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth, isAdminEmail } from "@/lib/auth";

export async function requireAdmin() {
  const session = await getAuth().api.getSession({ headers: await headers() });

  if (!session?.user || !isAdminEmail(session.user.email)) redirect("/login");

  return session.user;
}
