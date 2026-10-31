-- Favourites and Order again (ORD-11).
ALTER TABLE "order_lines" ADD COLUMN "option_ids" TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE TABLE "favourites" (
    "id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "menu_item_id" TEXT NOT NULL,
    "option_ids" TEXT[],
    "choice_key" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favourites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "favourites_member_id_choice_key_key" ON "favourites"("member_id", "choice_key");

ALTER TABLE "favourites" ADD CONSTRAINT "favourites_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "favourites" ADD CONSTRAINT "favourites_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
