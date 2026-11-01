-- A Birthday Treat adds Stars, like an earn (LOY-04).
ALTER TABLE "star_entries" DROP CONSTRAINT "star_entries_sign_check";
ALTER TABLE "star_entries" ADD CONSTRAINT "star_entries_sign_check" CHECK (
  ("kind" IN ('earn', 'release', 'birthday') AND "stars" > 0)
  OR ("kind" IN ('reserve', 'reverse') AND "stars" < 0)
  OR ("kind" = 'adjust' AND "stars" <> 0)
);
