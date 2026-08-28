CREATE TABLE "customer_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nas_link_id" uuid NOT NULL,
	"customer_display_name" text NOT NULL,
	"token_hash" text NOT NULL,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_links_nas_link_id_unique" UNIQUE("nas_link_id"),
	CONSTRAINT "customer_links_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "repair_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_link_id" uuid NOT NULL,
	"form_kind" text DEFAULT 'RF' NOT NULL,
	"company_name" text NOT NULL,
	"contact_name" text NOT NULL,
	"contact_phone" text NOT NULL,
	"contact_email" text,
	"product_model_name" text NOT NULL,
	"lot_number" text,
	"serial_number" text,
	"end_user" text,
	"return_address" text,
	"chamber_info" text,
	"pc1_generator_lot_number" text,
	"pc1_generator_model" text,
	"pc1_matcher_lot_number" text,
	"pc1_matcher_model" text,
	"pc2_generator_lot_number" text,
	"pc2_generator_model" text,
	"pc2_matcher_lot_number" text,
	"pc2_matcher_model" text,
	"pc3_generator_lot_number" text,
	"pc3_generator_model" text,
	"pc3_matcher_lot_number" text,
	"pc3_matcher_model" text,
	"alarm_name" text,
	"symptom_description" text NOT NULL,
	"process_source_power" text,
	"process_bias_power" text,
	"issue_power" text,
	"normal_position" text,
	"issue_position" text,
	"customer_actions" text,
	"issue_process_scope" text,
	"issue_intermittency" text,
	"issue_timing" text,
	"issue_process_condition" text,
	"chamber_counts" text,
	"customer_inspection_detail" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitter_ip_hash" text,
	"pulled_at" timestamp with time zone,
	CONSTRAINT "repair_requests_form_kind_check" CHECK ("repair_requests"."form_kind" IN ('RF'))
);
--> statement-breakpoint
ALTER TABLE "repair_requests" ADD CONSTRAINT "repair_requests_customer_link_id_customer_links_id_fk" FOREIGN KEY ("customer_link_id") REFERENCES "public"."customer_links"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "customer_links_nas_link_id_idx" ON "customer_links" USING btree ("nas_link_id");--> statement-breakpoint
CREATE INDEX "repair_requests_unpulled_idx" ON "repair_requests" USING btree ("submitted_at") WHERE pulled_at IS NULL;--> statement-breakpoint
CREATE INDEX "repair_requests_customer_link_id_idx" ON "repair_requests" USING btree ("customer_link_id");