-- Recurring Events (EVT-03) and Inquiries (INFO-11).
CREATE TYPE "InquiryKind" AS ENUM ('private_event', 'large_order');

CREATE TYPE "InquiryStatus" AS ENUM ('new', 'answered', 'closed');

CREATE TABLE "recurring_events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "weekday" SMALLINT NOT NULL,
    "starts_at" TEXT NOT NULL,
    "ends_at" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "recurring_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "recurring_events_weekday_check" CHECK ("weekday" BETWEEN 0 AND 6),
    CONSTRAINT "recurring_events_times_check" CHECK (
      "starts_at" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      AND "ends_at" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      AND "ends_at" > "starts_at"
    )
);

CREATE TABLE "inquiries" (
    "id" TEXT NOT NULL,
    "kind" "InquiryKind" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "wanted_on" DATE,
    "guests" SMALLINT,
    "message" TEXT NOT NULL,
    "status" "InquiryStatus" NOT NULL DEFAULT 'new',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "inquiries_message_check" CHECK (char_length("message") BETWEEN 1 AND 1000),
    CONSTRAINT "inquiries_guests_check" CHECK ("guests" IS NULL OR "guests" BETWEEN 1 AND 500)
);

CREATE INDEX "inquiries_status_created_at_idx" ON "inquiries"("status", "created_at");

-- Data: the seeded weekly list on databases seeded earlier (the live demo).
-- A fresh database has no cafe settings yet; the seed adds the same rows.
INSERT INTO "recurring_events" ("id", "title", "weekday", "starts_at", "ends_at", "note", "updated_at")
SELECT v.id, v.title, v.weekday, v.starts_at, v.ends_at, v.note, now()
FROM (VALUES
  ('seed-weekly-latte-art', 'Latte art practice', 3, '16:00', '17:00', 'Bring a friend; milk and cups on us.'),
  ('seed-weekly-open-mic', 'Open mic', 4, '19:00', '21:00', 'Sign up at the counter from 6 PM.'),
  ('seed-weekly-cupping', 'Saturday cupping', 6, '10:00', '11:00', 'Three beans from Benguet, side by side.')
) AS v(id, title, weekday, starts_at, ends_at, note)
WHERE EXISTS (SELECT 1 FROM "cafe_settings");
