CREATE TABLE "scripts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"production_id" uuid NOT NULL,
	"scene_id" uuid NOT NULL,
	"blocks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scripts_scene_id_unique" UNIQUE("scene_id")
);
--> statement-breakpoint
ALTER TABLE "scripts" ADD CONSTRAINT "scripts_production_id_productions_id_fk" FOREIGN KEY ("production_id") REFERENCES "public"."productions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scripts" ADD CONSTRAINT "scripts_scene_production_fk" FOREIGN KEY ("scene_id","production_id") REFERENCES "public"."scenes"("id","production_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "scripts_production_id_idx" ON "scripts" USING btree ("production_id");