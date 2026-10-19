import Link from "next/link";
import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  const resetToken = typeof token === "string" ? token : undefined;

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-5 py-10 sm:px-8">
      <div className="mx-auto w-full max-w-md">
        <Link className="mb-6 block text-center text-sm font-semibold tracking-wide text-[var(--accent)]" href="/">
          INTO THE WOODS
        </Link>
        <section className="rounded-2xl border border-black/10 bg-white/80 p-6 shadow-sm">
          <h1 className="mb-2 text-2xl font-semibold">Reset your password</h1>
          <p className="mb-6 text-sm leading-6 text-[var(--muted)]">
            Choose a new password for your account.
          </p>
          <ResetPasswordForm token={resetToken} />
        </section>
      </div>
    </main>
  );
}
