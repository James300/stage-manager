CREATE TABLE "rehearsal_scenes" (
	"rehearsal_id" uuid NOT NULL,
	"scene_id" uuid NOT NULL,
	"production_id" uuid NOT NULL,
	CONSTRAINT "rehearsal_scenes_rehearsal_id_scene_id_pk" PRIMARY KEY("rehearsal_id","scene_id")
);
--> statement-breakpoint
CREATE TABLE "rehearsals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"production_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"duration_minutes" integer NOT NULL,
	"time_zone" varchar(64) NOT NULL,
	"status" varchar(32) DEFAULT 'tentative' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rehearsals_id_production_unique" UNIQUE("id","production_id")
);
--> statement-breakpoint
ALTER TABLE "rehearsal_scenes" ADD CONSTRAINT "rehearsal_scenes_production_id_productions_id_fk" FOREIGN KEY ("production_id") REFERENCES "public"."productions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rehearsal_scenes" ADD CONSTRAINT "rehearsal_scenes_rehearsal_production_fk" FOREIGN KEY ("rehearsal_id","production_id") REFERENCES "public"."rehearsals"("id","production_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rehearsal_scenes" ADD CONSTRAINT "rehearsal_scenes_scene_production_fk" FOREIGN KEY ("scene_id","production_id") REFERENCES "public"."scenes"("id","production_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rehearsals" ADD CONSTRAINT "rehearsals_production_id_productions_id_fk" FOREIGN KEY ("production_id") REFERENCES "public"."productions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rehearsal_scenes_scene_id_idx" ON "rehearsal_scenes" USING btree ("scene_id");--> statement-breakpoint
CREATE INDEX "rehearsals_production_id_idx" ON "rehearsals" USING btree ("production_id");--> statement-breakpoint
ALTER TABLE "scenes" ADD CONSTRAINT "scenes_id_production_unique" UNIQUE("id","production_id");