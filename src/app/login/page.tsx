import { LoginForm } from "@/app/login/login-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-5 py-10 sm:px-8">
      <div className="mx-auto w-full max-w-md">
        <Link className="mb-6 block text-center text-sm font-semibold tracking-wide text-[var(--accent)]" href="/">
          INTO THE WOODS
        </Link>
        <LoginForm />
      </div>
    </main>
  );
}
