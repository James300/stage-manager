"use client";

import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";

type LoginMode = "password" | "magic-link" | "sign-up" | "forgot-password";

export function LoginForm() {
  const [mode, setMode] = useState<LoginMode>("password");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resending, setResending] = useState(false);

  function changeMode(nextMode: LoginMode) {
    setMode(nextMode);
    setError("");
    setNotice("");
    setUnverifiedEmail("");
  }

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
      if (mode === "password") {
        const result = await authClient.signIn.email({
          email,
          password,
          callbackURL: "/rehearsals",
        });

        if (result.error) {
          setError(result.error.message ?? "Unable to sign in.");
          if (result.error.code === "EMAIL_NOT_VERIFIED") setUnverifiedEmail(email);
        } else {
          window.location.replace("/rehearsals");
        }
      } else if (mode === "forgot-password") {
        const result = await authClient.requestPasswordReset({
          email,
          redirectTo: "/reset-password",
        });

        if (result.error) {
          setError(result.error.message ?? "Unable to request a password reset.");
        } else {
          setNotice("If this email has an account, a password reset link has been sent.");
        }
      } else {
        const name = String(form.get("name") ?? "").trim();
        const result = await authClient.signIn.magicLink({
          email,
          ...(mode === "sign-up" ? { name } : {}),
          callbackURL: "/rehearsals",
          newUserCallbackURL: "/account/setup-password",
        });

        if (result.error) {
          setError(result.error.message ?? "Unable to send a sign-in link.");
        } else {
          setNotice(
            "If this email is approved for this production, a sign-in link has been sent. New accounts can set a password after opening the link.",
          );
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
        callbackURL: "/rehearsals",
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

  const isPasswordMode = mode === "password";
  const isSignUpMode = mode === "sign-up";

  return (
    <form onSubmit={submit} className="rounded-2xl border border-black/10 bg-white/80 p-6 shadow-sm">
      <h1 className="mb-2 text-2xl font-semibold">
        {mode === "password"
          ? "Sign in"
          : mode === "sign-up"
            ? "Create your account"
            : mode === "forgot-password"
              ? "Reset your password"
              : "Email sign-in link"}
      </h1>
      <p className="mb-6 text-sm leading-6 text-[var(--muted)]">
        {mode === "sign-up"
          ? "Only email addresses approved for this production can create an account."
          : mode === "forgot-password"
            ? "We'll email a password reset link if an account exists for that address."
            : "Sign in with your password or request a secure link sent to your approved email."}
      </p>
      {isSignUpMode && (
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
      {isPasswordMode && (
        <label className="mb-5 grid gap-1 text-sm font-medium">
          Password
          <input
            className="field"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            minLength={8}
            maxLength={128}
          />
        </label>
      )}
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
      {unverifiedEmail && isPasswordMode && (
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
        {pending
          ? "Please wait..."
          : isPasswordMode
            ? "Sign in"
            : mode === "forgot-password"
              ? "Send reset link"
              : "Send sign-in link"}
      </button>
      <div className="mt-4 grid gap-3 text-center text-sm font-medium text-[var(--accent)]">
        {isPasswordMode ? (
          <>
            <button type="button" onClick={() => changeMode("magic-link")}>
              Email me a sign-in link
            </button>
            <button type="button" onClick={() => changeMode("sign-up")}>
              Need an account? Create one
            </button>
            <button type="button" onClick={() => changeMode("forgot-password")}>
              Forgot password?
            </button>
          </>
        ) : mode === "sign-up" ? (
          <button type="button" onClick={() => changeMode("password")}>
            Already have an account? Sign in
          </button>
        ) : (
          <button type="button" onClick={() => changeMode("password")}>
            Back to sign in
          </button>
        )}
      </div>
    </form>
  );
}
