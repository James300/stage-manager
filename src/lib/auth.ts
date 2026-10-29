import { APIError, betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { accounts, performers, productions, sessions, users, verifications } from "@/db/schema";
import { magicLink } from "better-auth/plugins";
import {
  sendResetPasswordEmail,
  sendSignInLinkEmail,
  sendVerificationEmail,
} from "@/lib/email";
import { CURRENT_PRODUCTION_SLUG } from "@/lib/production-config";

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
    .innerJoin(productions, eq(performers.productionId, productions.id))
    .where(
      and(
        eq(productions.slug, CURRENT_PRODUCTION_SLUG),
        sql`lower(${performers.email}) = ${normalizedEmail}`,
      ),
    )
    .limit(1);

  return Boolean(performer);
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
    trustedOrigins:
      process.env.NODE_ENV === "production"
        ? [baseURL]
        : [baseURL, "http://localhost:3000", "http://127.0.0.1:3000"],
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
        await sendResetPasswordEmail(user.email, url);
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail: async ({ user, url }) => {
        if (!(await isSupportedEmail(user.email))) {
          throw new APIError("FORBIDDEN", {
            message: "This email address is not authorized to access this production.",
          });
        }
        await sendVerificationEmail(user.email, url);
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
              .innerJoin(productions, eq(performers.productionId, productions.id))
              .where(
                and(
                  eq(productions.slug, CURRENT_PRODUCTION_SLUG),
                  sql`lower(${performers.email}) = ${user.email.trim().toLowerCase()}`,
                ),
              )
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
          await sendSignInLinkEmail(email, url);
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
