/**
 * A Delete that asks once: the first tap opens it, the second deletes.
 * Native details, so it needs no client code. Inside another form, pass
 * `form`: the id of a form elsewhere on the page that posts the action,
 * since forms can't nest.
 */
export function DeleteForm({
  action,
  form,
  id,
  label,
  note,
  confirm = "Yes, delete it",
}: {
  id: string;
  label: string;
  note: string;
  confirm?: string;
} & (
  | { action: (form: FormData) => Promise<void>; form?: never }
  | { form: string; action?: never }
)) {
  const body = (
    <>
      <p className="max-w-measure">{note}</p>
      {/* The id travels with the button, so it works in either form. */}
      <button
        type="submit"
        name="id"
        value={id}
        form={form}
        className="border-destructive text-destructive min-h-11 justify-self-start rounded-full border-2 px-5 font-semibold"
      >
        {confirm}
      </button>
    </>
  );
  return (
    <details className="max-w-3xl">
      <summary className="border-input inline-flex min-h-11 cursor-pointer items-center rounded-full border px-5 font-semibold">
        {label}
      </summary>
      {form ? (
        <div className="mt-3 grid gap-3">{body}</div>
      ) : (
        <form action={action} className="mt-3 grid gap-3">
          {body}
        </form>
      )}
    </details>
  );
}
