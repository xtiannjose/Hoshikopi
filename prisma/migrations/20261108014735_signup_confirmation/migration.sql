-- AlterTable
ALTER TABLE "event_signups" ADD COLUMN     "confirmed_at" TIMESTAMPTZ(3);

-- Sign-ups taken before confirmation existed keep their Seats.
UPDATE "event_signups" SET "confirmed_at" = "created_at";
