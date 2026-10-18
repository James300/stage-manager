import { Resend } from "resend";
import { APIError, betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { accounts, performers, sessions, users, verifications } from "@/db/schema";
import { magicLink } from "better-auth/plugins";

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

export async function isSupportedEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return false;
  if (isAdminEmail(normalizedEmail)) return true;

  const [performer] = await getDb()
    .select({ id: performers.id })
    .from(performers)
    .where(sql`lower(${performers.email}) = ${normalizedEmail}`)
    .limit(1);

  return Boolean(performer);
}

async function sendEmail(to: string, subject: string, text: string) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM;
  if (!resendApiKey || !emailFrom) {
    throw new Error("RESEND_API_KEY and EMAIL_FROM are required to send authentication emails.");
  }

  const resend = new Resend(resendApiKey);
  const result = await resend.emails.send({ from: emailFrom, to, subject, text });
  if (result.error) throw new Error(`Unable to send authentication email: ${result.error.message}`);
}

function createAuth() {
  const secret = process.env.BETTER_AUTH_SECRET;
  const baseURL = process.env.BETTER_AUTH_URL;
  if (!secret) throw new Error("BETTER_AUTH_SECRET is required to configure authentication.");
  if (!baseURL) throw new Error("BETTER_AUTH_URL is required to configure authentication.");

  return betterAuth({
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: authSchema,
    }),
    secret,
    baseURL,
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }) => {
        if (!(await isSupportedEmail(user.email))) {
          throw new APIError("FORBIDDEN", {
            message: "This email address is not authorized to access this production.",
          });
        }
        await sendEmail(
          user.email,
          "Reset your Stage Manager password",
          `Reset your password by opening this link: ${url}`,
        );
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail: async ({ user, url }) => {
        await sendEmail(
          user.email,
          "Verify your Stage Manager account",
          `Verify your account by opening this link: ${url}`,
        );
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            if (!(await isSupportedEmail(user.email))) {
              throw new APIError("FORBIDDEN", {
                message: "This email address is not authorized to access this production.",
              });
            }
            const [performer] = await getDb()
              .select({ name: performers.name })
              .from(performers)
              .where(sql`lower(${performers.email}) = ${user.email.trim().toLowerCase()}`)
              .limit(1);
            const name = user.name.trim() || performer?.name || user.email.split("@")[0];
            return { data: { ...user, name } };
          },
        },
      },
    },
    plugins: [
      magicLink({
        expiresIn: 900,
        storeToken: "hashed",
        sendMagicLink: async ({ email, url }) => {
          if (!(await isSupportedEmail(email))) {
            throw new APIError("FORBIDDEN", {
              message: "This email address is not authorized to access this production.",
            });
          }
          await sendEmail(
            email,
            "Your Stage Manager sign-in link",
            `Sign in or create your account by opening this link: ${url}`,
          );
        },
      }),
      nextCookies(),
    ],
  });
}

let authInstance: ReturnType<typeof createAuth> | undefined;

export function getAuth() {
  if (!authInstance) authInstance = createAuth();
  return authInstance;
}
