-- Data only: rename the seeded demo people on databases seeded before the
-- rename (the live demo). Fresh databases have no rows yet, and seeded ones
-- that already match are left as they are.
-- Manager Christian, Barista Annika, Member Hoshi (docs/06-SETUP.md section 6).

-- Two steps, so swapping two addresses never trips the unique email index.
UPDATE "users" SET "email" = "id" || '@rename.invalid'
WHERE "id" IN ('seed-manager', 'seed-barista', 'seed-member');

UPDATE "users" SET "name" = 'Christian', "email" = 'christian@hoshikopi.example' WHERE "id" = 'seed-manager';
UPDATE "users" SET "name" = 'Annika', "email" = 'annika@hoshikopi.example' WHERE "id" = 'seed-barista';
UPDATE "users" SET "name" = 'Hoshi', "email" = 'hoshi@hoshikopi.example' WHERE "id" = 'seed-member';

UPDATE "cafe_settings" SET "story_md" = replace(replace("story_md",
  'Jomar (head barista) and Kai (manager)', 'Annika (head barista) and Christian (manager)'),
  'Annika (head barista) and Hoshi (manager)', 'Annika (head barista) and Christian (manager)');

UPDATE "events" SET "summary" = replace("summary", 'with Jomar.', 'with Annika.')
WHERE "slug" = 'latte-art-night';
