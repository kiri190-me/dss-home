ALTER TABLE "repair_requests" ALTER COLUMN "lot_number" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "repair_requests" ALTER COLUMN "serial_number" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "repair_requests" ALTER COLUMN "end_user" SET NOT NULL;