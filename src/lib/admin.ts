import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth, isAdminEmail, isSupportedEmail } from "@/lib/auth";

export async function requireUser() {
  const session = await getAuth().api.getSession({ headers: await headers() });

  if (!session?.user || !(await isSupportedEmail(session.user.email))) redirect("/login");

  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!isAdminEmail(user.email)) redirect("/rehearsals");
  return user;
}
