import Link from "next/link";
import { connection } from "next/server";
import { requireUser } from "@/lib/admin";
import { SetupPasswordForm } from "./setup-password-form";

export default async function SetupPasswordPage() {
  await connection();
  const user = await requireUser();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <Link className="mb-6 text-center text-sm font-semibold tracking-wide text-[var(--accent)]" href="/">
        INTO THE WOODS
      </Link>
      <section className="rounded-2xl border border-black/10 bg-white/80 p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold">Create a password</h1>
        <p className="mb-6 text-sm leading-6 text-[var(--muted)]">
          Welcome, {user.name}. Set a password to sign in without a magic link next time.
        </p>
        <SetupPasswordForm />
      </section>
    </main>
  );
}
