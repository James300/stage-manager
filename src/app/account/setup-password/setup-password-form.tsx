"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { setInitialPassword } from "./actions";

export function SetupPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");
    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    try {
      const result = await setInitialPassword(password);
      if (result.error) {
        setError(result.error);
      } else {
        router.replace("/rehearsals");
        router.refresh();
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to set your password.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <label className="grid gap-1 text-sm font-medium">
        Password
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
        Confirm password
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
        {pending ? "Saving..." : "Set password"}
      </button>
    </form>
  );
}
