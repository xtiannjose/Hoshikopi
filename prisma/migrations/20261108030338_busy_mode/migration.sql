-- AlterTable
ALTER TABLE "cafe_settings" ADD COLUMN     "busy_minutes" SMALLINT NOT NULL DEFAULT 0,
ADD COLUMN     "busy_until" TIMESTAMPTZ(3);

-- Busy Mode adds 0 to 60 minutes (the Bar Screen offers 10 or 15).
ALTER TABLE "cafe_settings" ADD CONSTRAINT "cafe_settings_busy_minutes_check" CHECK ("busy_minutes" BETWEEN 0 AND 60);
