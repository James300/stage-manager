"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { getAuth } from "@/lib/auth";
import { requireUser } from "@/lib/admin";

export async function setInitialPassword(password: string) {
  const parsedPassword = z.string().min(8).max(128).safeParse(password);
  if (!parsedPassword.success) return { error: "Password must be between 8 and 128 characters." };

  await requireUser();
  await getAuth().api.setPassword({
    body: { newPassword: parsedPassword.data },
    headers: await headers(),
  });
  return { success: true };
}
