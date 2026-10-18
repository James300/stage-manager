ALTER TABLE "performer_characters" DROP CONSTRAINT "performer_characters_performer_id_performers_id_fk";
--> statement-breakpoint
ALTER TABLE "performer_characters" DROP CONSTRAINT "performer_characters_character_id_characters_id_fk";
--> statement-breakpoint
ALTER TABLE "performer_characters" ADD COLUMN "production_id" uuid;--> statement-breakpoint
UPDATE "performer_characters" AS "performer_characters"
SET "production_id" = "performers"."production_id"
FROM "performers"
WHERE "performer_characters"."performer_id" = "performers"."id";--> statement-breakpoint
ALTER TABLE "performer_characters" ALTER COLUMN "production_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "performer_characters" ADD CONSTRAINT "performer_characters_production_id_productions_id_fk" FOREIGN KEY ("production_id") REFERENCES "public"."productions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_id_production_unique" UNIQUE("id","production_id");--> statement-breakpoint
ALTER TABLE "performers" ADD CONSTRAINT "performers_id_production_unique" UNIQUE("id","production_id");--> statement-breakpoint
ALTER TABLE "performer_characters" ADD CONSTRAINT "performer_characters_performer_production_fk" FOREIGN KEY ("performer_id","production_id") REFERENCES "public"."performers"("id","production_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performer_characters" ADD CONSTRAINT "performer_characters_character_production_fk" FOREIGN KEY ("character_id","production_id") REFERENCES "public"."characters"("id","production_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
