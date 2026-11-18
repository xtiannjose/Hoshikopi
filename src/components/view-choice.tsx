import Link from "next/link";

const STAR =
  "M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z";

/**
 * A ring on the dashed thread that turns into the gold star when picked:
 * List or Photos. A native radio on Home's menu (CSS shows the view, no
 * JavaScript), or with `href` a link, current when picked: the staff menu
 * keeps its view in the address (batch 12.5).
 */
export function ViewChoice(
  props: { label: string } & (
    | { id: string; defaultChecked?: boolean }
    | { href: string; current: boolean }
  )
) {
  const mark = (
    <>
      <span className="bg-muted relative grid size-7 place-items-center rounded-full">
        <span className="border-input size-3 rounded-full border-[1.5px] transition-transform group-has-[:checked]/choice:scale-0 group-aria-[current=page]/choice:scale-0 motion-reduce:transition-none" />
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className="ease-pop absolute size-5 scale-0 -rotate-72 transition-transform duration-350 group-has-[:checked]/choice:scale-100 group-has-[:checked]/choice:rotate-0 group-aria-[current=page]/choice:scale-100 group-aria-[current=page]/choice:rotate-0 motion-reduce:transition-none"
        >
          <path
            d={STAR}
            className="fill-star stroke-star-edge"
            strokeWidth="1"
          />
        </svg>
      </span>
      <span className="font-display text-lg italic">{props.label}</span>
    </>
  );
  const look =
    "group/choice text-muted-foreground has-[:checked]:text-foreground aria-[current=page]:text-foreground inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full pr-2";
  if ("href" in props) {
    return (
      <Link
        href={props.href}
        scroll={false}
        aria-current={props.current ? "page" : undefined}
        className={`${look} no-underline`}
      >
        {mark}
      </Link>
    );
  }
  return (
    <label
      htmlFor={props.id}
      className={`${look} has-[:focus-visible]:outline-ring has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2`}
    >
      <input
        id={props.id}
        type="radio"
        name="menu-view"
        defaultChecked={props.defaultChecked}
        className="sr-only"
      />
      {mark}
    </label>
  );
}

/** The dashed thread between the two choices. */
export const VIEW_THREAD = (
  <span aria-hidden className="border-input w-10 border-t border-dashed" />
);
