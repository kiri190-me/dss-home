CREATE TABLE "customer_repair_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_link_id" uuid NOT NULL,
	"source_kind" text NOT NULL,
	"source_id" uuid NOT NULL,
	"intake_number" text,
	"model_name" text,
	"lot_number" text,
	"serial_number" text,
	"received_at" date,
	"status_label" text,
	"status_note" text,
	"quote_number" text,
	"quote_issued_date" date,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_repair_items_source_kind_check" CHECK ("customer_repair_items"."source_kind" IN ('CASE', 'REQUEST'))
);
--> statement-breakpoint
ALTER TABLE "customer_repair_items" ADD CONSTRAINT "customer_repair_items_customer_link_id_customer_links_id_fk" FOREIGN KEY ("customer_link_id") REFERENCES "public"."customer_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "customer_repair_items_source_unique" ON "customer_repair_items" USING btree ("source_kind","source_id");--> statement-breakpoint
CREATE INDEX "customer_repair_items_link_received_idx" ON "customer_repair_items" USING btree ("customer_link_id","received_at");--> statement-breakpoint
CREATE INDEX "customer_repair_items_model_lower_idx" ON "customer_repair_items" USING btree (lower(model_name));--> statement-breakpoint
CREATE INDEX "customer_repair_items_lot_lower_idx" ON "customer_repair_items" USING btree (lower(lot_number));--> statement-breakpoint
CREATE INDEX "customer_repair_items_serial_lower_idx" ON "customer_repair_items" USING btree (lower(serial_number));