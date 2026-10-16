import {
  boolean,
  foreignKey,
  integer,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const accounts = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verifications = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const productions = pgTable("productions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const performers = pgTable(
  "performers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productionId: uuid("production_id")
      .notNull()
      .references(() => productions.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    email: varchar("email", { length: 320 }),
    phone: varchar("phone", { length: 40 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("performers_production_id_idx").on(table.productionId),
    unique("performers_id_production_unique").on(table.id, table.productionId),
  ],
);

export const characters = pgTable(
  "characters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productionId: uuid("production_id")
      .notNull()
      .references(() => productions.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("characters_production_id_idx").on(table.productionId),
    unique("characters_production_name_unique").on(table.productionId, table.name),
    unique("characters_id_production_unique").on(table.id, table.productionId),
  ],
);

export const scenes = pgTable(
  "scenes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productionId: uuid("production_id")
      .notNull()
      .references(() => productions.id, { onDelete: "cascade" }),
    sceneNumber: integer("scene_number").notNull(),
    title: varchar("title", { length: 160 }).notNull(),
    description: text("description").notNull().default(""),
    readiness: varchar("readiness", { length: 32 }).notNull().default("not_started"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("scenes_production_id_idx").on(table.productionId),
    unique("scenes_production_number_unique").on(table.productionId, table.sceneNumber),
    unique("scenes_id_production_unique").on(table.id, table.productionId),
  ],
);

export type RehearsalStatus = "tentative" | "confirmed" | "completed" | "cancelled";

export const rehearsals = pgTable(
  "rehearsals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productionId: uuid("production_id")
      .notNull()
      .references(() => productions.id, { onDelete: "cascade" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    timeZone: varchar("time_zone", { length: 64 }).notNull(),
    status: varchar("status", { length: 32 }).$type<RehearsalStatus>().notNull().default("tentative"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("rehearsals_production_id_idx").on(table.productionId),
    unique("rehearsals_id_production_unique").on(table.id, table.productionId),
  ],
);

export const rehearsalScenes = pgTable(
  "rehearsal_scenes",
  {
    rehearsalId: uuid("rehearsal_id").notNull(),
    sceneId: uuid("scene_id").notNull(),
    productionId: uuid("production_id")
      .notNull()
      .references(() => productions.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.rehearsalId, table.sceneId] }),
    index("rehearsal_scenes_scene_id_idx").on(table.sceneId),
    foreignKey({
      columns: [table.rehearsalId, table.productionId],
      foreignColumns: [rehearsals.id, rehearsals.productionId],
      name: "rehearsal_scenes_rehearsal_production_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.sceneId, table.productionId],
      foreignColumns: [scenes.id, scenes.productionId],
      name: "rehearsal_scenes_scene_production_fk",
    }).onDelete("cascade"),
  ],
);

export const performerCharacters = pgTable(
  "performer_characters",
  {
    performerId: uuid("performer_id")
      .notNull(),
    characterId: uuid("character_id")
      .notNull(),
    productionId: uuid("production_id")
      .notNull()
      .references(() => productions.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.performerId, table.characterId] }),
    index("performer_characters_character_id_idx").on(table.characterId),
    foreignKey({
      columns: [table.performerId, table.productionId],
      foreignColumns: [performers.id, performers.productionId],
      name: "performer_characters_performer_production_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.characterId, table.productionId],
      foreignColumns: [characters.id, characters.productionId],
      name: "performer_characters_character_production_fk",
    }).onDelete("cascade"),
  ],
);
