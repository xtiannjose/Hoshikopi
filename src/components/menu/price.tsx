import { formatPrice } from "@/lib/money";

/** Today's price, with the regular one struck through while a Promo runs. */
export function Price({
  cents,
  regularCents,
}: {
  cents: number;
  regularCents: number | null;
}) {
  if (regularCents === null) return <>{formatPrice(cents)}</>;
  return (
    <>
      {formatPrice(cents)}{" "}
      <s aria-hidden className="text-muted-foreground">
        {formatPrice(regularCents)}
      </s>
      <span className="sr-only">, was {formatPrice(regularCents)}</span>
    </>
  );
}
