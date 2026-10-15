"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function LoginForm() {
  const router = useRouter();
  const [createAccount, setCreateAccount] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resending, setResending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setUnverifiedEmail("");
    setPending(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    try {
      if (createAccount) {
        const name = String(form.get("name") ?? "");
        const result = await authClient.signUp.email({
          email,
          password,
          name,
          callbackURL: "/cast",
        });

        if (result.error) {
          setError(result.error.message ?? "Unable to create the account.");
        } else {
          setNotice("Check your email for a verification link. You can sign in after verifying your address.");
          setCreateAccount(false);
        }
      } else {
        const result = await authClient.signIn.email({
          email,
          password,
          callbackURL: "/cast",
        });

        if (result.error) {
          setError(result.error.message ?? "Unable to sign in.");
          if (result.error.code === "EMAIL_NOT_VERIFIED") setUnverifiedEmail(email);
        } else {
          router.replace("/cast");
          router.refresh();
        }
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The authentication request failed.");
    } finally {
      setPending(false);
    }
  }

  async function resendVerificationEmail() {
    setError("");
    setNotice("");
    setResending(true);

    try {
      const result = await authClient.sendVerificationEmail({
        email: unverifiedEmail,
        callbackURL: "/cast",
      });

      if (result.error) {
        setError(result.error.message ?? "Unable to resend the verification email.");
      } else {
        setNotice("If the account needs verification, a new verification email has been sent.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The verification email could not be sent.");
    } finally {
      setResending(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-black/10 bg-white/80 p-6 shadow-sm">
      <h1 className="mb-2 text-2xl font-semibold">
        {createAccount ? "Create administrator account" : "Administrator sign in"}
      </h1>
      <p className="mb-6 text-sm leading-6 text-[var(--muted)]">
        {createAccount
          ? "Only email addresses approved for this production can register."
          : "Sign in to manage performers and characters."}
      </p>
      {createAccount && (
        <label className="mb-4 grid gap-1 text-sm font-medium">
          Name
          <input className="field" name="name" autoComplete="name" required maxLength={160} />
        </label>
      )}
      <label className="mb-4 grid gap-1 text-sm font-medium">
        Email
        <input
          className="field"
          type="email"
          name="email"
          autoComplete="email"
          required
          maxLength={320}
        />
      </label>
      <label className="mb-5 grid gap-1 text-sm font-medium">
        Password
        <input
          className="field"
          type="password"
          name="password"
          autoComplete={createAccount ? "new-password" : "current-password"}
          required
          minLength={8}
          maxLength={128}
        />
      </label>
      {error && (
        <p className="mb-4 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="mb-4 text-sm text-[var(--accent)]" role="status">
          {notice}
        </p>
      )}
      {unverifiedEmail && !createAccount && (
        <button
          className="button-secondary mb-4 w-full justify-center"
          type="button"
          onClick={resendVerificationEmail}
          disabled={pending || resending}
        >
          {resending ? "Sending..." : "Resend verification email"}
        </button>
      )}
      <button className="button-primary w-full justify-center" type="submit" disabled={pending}>
        {pending ? "Please wait..." : createAccount ? "Create account" : "Sign in"}
      </button>
      <button
        className="mt-4 w-full text-sm font-medium text-[var(--accent)] underline underline-offset-4"
        type="button"
        onClick={() => {
          setCreateAccount((value) => !value);
          setError("");
          setNotice("");
          setUnverifiedEmail("");
        }}
      >
        {createAccount ? "Already have an account? Sign in" : "Need an account? Create one"}
      </button>
    </form>
  );
}
