import { Resend } from "resend";
import { APIError, betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "@/db";
import { accounts, sessions, users, verifications } from "@/db/schema";

const authSchema = {
  user: users,
  session: sessions,
  account: accounts,
  verification: verifications,
};

export function isAdminEmail(email: string) {
  const allowedEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return allowedEmails.includes(email.trim().toLowerCase());
}

function createAuth() {
  const secret = process.env.BETTER_AUTH_SECRET;
  const baseURL = process.env.BETTER_AUTH_URL;
  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM;
  if (!secret) throw new Error("BETTER_AUTH_SECRET is required to configure administrator authentication.");
  if (!baseURL) throw new Error("BETTER_AUTH_URL is required to configure administrator authentication.");

  return betterAuth({
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: authSchema,
    }),
    secret,
    baseURL,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
    },
    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail: async ({ user, url }) => {
        if (!resendApiKey || !emailFrom) {
          throw new Error("RESEND_API_KEY and EMAIL_FROM are required to send verification emails.");
        }

        const resend = new Resend(resendApiKey);
        const result = await resend.emails.send({
          from: emailFrom,
          to: user.email,
          subject: "Verify your Stage Manager account",
          text: `Verify your account by opening this link: ${url}`,
        });

        if (result.error) throw new Error(`Unable to send verification email: ${result.error.message}`);
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            if (!isAdminEmail(user.email)) {
              throw new APIError("FORBIDDEN", {
                message: "This email address is not authorized for administrator access.",
              });
            }
          },
        },
      },
    },
    plugins: [nextCookies()],
  });
}

let authInstance: ReturnType<typeof createAuth> | undefined;

export function getAuth() {
  if (!authInstance) authInstance = createAuth();
  return authInstance;
}
