-- Event Sign-ups with a cap (EVT-02).
ALTER TABLE "events" ADD COLUMN "seats" SMALLINT;
ALTER TABLE "events" ADD CONSTRAINT "events_seats_check"
  CHECK ("seats" IS NULL OR "seats" BETWEEN 1 AND 500);

CREATE TABLE "event_signups" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "seats" SMALLINT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_signups_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "event_signups_seats_check" CHECK ("seats" BETWEEN 1 AND 4)
);

CREATE UNIQUE INDEX "event_signups_event_id_email_key" ON "event_signups"("event_id", "email");

ALTER TABLE "event_signups" ADD CONSTRAINT "event_signups_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data: the seeded Latte art night takes Sign-ups on databases seeded earlier.
UPDATE "events" SET "seats" = 12
WHERE "slug" = 'latte-art-night' AND "seats" IS NULL AND "signup_url" IS NULL;
