"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";

export function ResetPasswordForm({ token }: { token?: string }) {
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!token) {
      setError("This password reset link is missing or invalid. Request a new one from the sign-in page.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");
    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    try {
      const result = await authClient.resetPassword({ newPassword: password, token });
      if (result.error) {
        setError(result.error.message ?? "Unable to reset your password.");
      } else {
        setComplete(true);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to reset your password.");
    } finally {
      setPending(false);
    }
  }

  if (complete) {
    return (
      <div className="grid gap-4">
        <p className="text-sm text-[var(--accent)]" role="status">
          Your password has been reset.
        </p>
        <Link className="button-primary justify-center" href="/login">
          Return to sign in
        </Link>
      </div>
    );
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <label className="grid gap-1 text-sm font-medium">
        New password
        <input
          autoComplete="new-password"
          className="field"
          maxLength={128}
          minLength={8}
          name="password"
          required
          type="password"
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Confirm new password
        <input
          autoComplete="new-password"
          className="field"
          maxLength={128}
          minLength={8}
          name="confirmation"
          required
          type="password"
        />
      </label>
      {error && (
        <p className="text-sm text-red-800" role="alert">
          {error}
        </p>
      )}
      <button className="button-primary w-full justify-center" disabled={pending} type="submit">
        {pending ? "Saving..." : "Reset password"}
      </button>
    </form>
  );
}
