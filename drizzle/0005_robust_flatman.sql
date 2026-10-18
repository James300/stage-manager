CREATE TABLE "rehearsal_attendance" (
	"rehearsal_id" uuid NOT NULL,
	"performer_id" uuid NOT NULL,
	"production_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rehearsal_attendance_rehearsal_id_performer_id_pk" PRIMARY KEY("rehearsal_id","performer_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scene_characters" (
	"scene_id" uuid NOT NULL,
	"character_id" uuid NOT NULL,
	"production_id" uuid NOT NULL,
	CONSTRAINT "scene_characters_scene_id_character_id_pk" PRIMARY KEY("scene_id","character_id")
);
--> statement-breakpoint
ALTER TABLE "scene_characters" ADD COLUMN IF NOT EXISTS "production_id" uuid;
--> statement-breakpoint
UPDATE "scene_characters" AS scene_character
SET "production_id" = scenes."production_id"
FROM "scenes"
WHERE scene_character."scene_id" = scenes."id"
	AND scene_character."production_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "scene_characters" ALTER COLUMN "production_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "scene_characters" DROP CONSTRAINT IF EXISTS "scene_characters_scene_id_fkey";
--> statement-breakpoint
ALTER TABLE "scene_characters" DROP CONSTRAINT IF EXISTS "scene_characters_character_id_fkey";
--> statement-breakpoint
ALTER TABLE "rehearsal_attendance" ADD CONSTRAINT "rehearsal_attendance_production_id_productions_id_fk" FOREIGN KEY ("production_id") REFERENCES "public"."productions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rehearsal_attendance" ADD CONSTRAINT "rehearsal_attendance_rehearsal_production_fk" FOREIGN KEY ("rehearsal_id","production_id") REFERENCES "public"."rehearsals"("id","production_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rehearsal_attendance" ADD CONSTRAINT "rehearsal_attendance_performer_production_fk" FOREIGN KEY ("performer_id","production_id") REFERENCES "public"."performers"("id","production_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scene_characters" ADD CONSTRAINT "scene_characters_production_id_productions_id_fk" FOREIGN KEY ("production_id") REFERENCES "public"."productions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scene_characters" ADD CONSTRAINT "scene_characters_scene_production_fk" FOREIGN KEY ("scene_id","production_id") REFERENCES "public"."scenes"("id","production_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scene_characters" ADD CONSTRAINT "scene_characters_character_production_fk" FOREIGN KEY ("character_id","production_id") REFERENCES "public"."characters"("id","production_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rehearsal_attendance_performer_id_idx" ON "rehearsal_attendance" USING btree ("performer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "scene_characters_character_id_idx" ON "scene_characters" USING btree ("character_id");