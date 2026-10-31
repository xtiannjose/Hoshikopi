-- Staff Second Factor (ADR 0014).
ALTER TABLE "sessions" ADD COLUMN "second_factor_at" TIMESTAMPTZ(3);

CREATE TABLE "two_factors" (
    "user_id" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "confirmed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "two_factors_pkey" PRIMARY KEY ("user_id")
);

ALTER TABLE "two_factors" ADD CONSTRAINT "two_factors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
