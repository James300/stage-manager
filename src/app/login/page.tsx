import { LoginForm } from "@/app/login/login-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <Link className="mb-6 text-center text-sm font-semibold tracking-wide text-[var(--accent)]" href="/">
        INTO THE WOODS
      </Link>
      <LoginForm />
    </main>
  );
}
