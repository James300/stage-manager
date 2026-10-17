CREATE TABLE "rehearsal_availability" (
	"rehearsal_id" uuid NOT NULL,
	"performer_id" uuid NOT NULL,
	"production_id" uuid NOT NULL,
	"response" varchar(16) NOT NULL,
	"note" text,
	"responded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rehearsal_availability_rehearsal_id_performer_id_pk" PRIMARY KEY("rehearsal_id","performer_id"),
	CONSTRAINT "rehearsal_availability_response_check" CHECK ("rehearsal_availability"."response" in ('yes', 'no', 'maybe', 'partial'))
);
--> statement-breakpoint
ALTER TABLE "rehearsal_availability" ADD CONSTRAINT "rehearsal_availability_production_id_productions_id_fk" FOREIGN KEY ("production_id") REFERENCES "public"."productions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rehearsal_availability" ADD CONSTRAINT "rehearsal_availability_rehearsal_production_fk" FOREIGN KEY ("rehearsal_id","production_id") REFERENCES "public"."rehearsals"("id","production_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rehearsal_availability" ADD CONSTRAINT "rehearsal_availability_performer_production_fk" FOREIGN KEY ("performer_id","production_id") REFERENCES "public"."performers"("id","production_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rehearsal_availability_performer_id_idx" ON "rehearsal_availability" USING btree ("performer_id");