-- Birthday Treat (LOY-04). Its own migration: Postgres cannot use a new
-- enum value in the transaction that adds it.
ALTER TYPE "StarKind" ADD VALUE 'birthday';
