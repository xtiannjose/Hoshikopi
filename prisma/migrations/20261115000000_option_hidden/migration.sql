-- AlterTable: a Hidden Option is left out of the menu (audit staff:9).
ALTER TABLE "options" ADD COLUMN "is_hidden" BOOLEAN NOT NULL DEFAULT false;
