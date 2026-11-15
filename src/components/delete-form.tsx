/**
 * A Delete that asks once: the first tap opens it, the second deletes.
 * Native details, so it needs no client code.
 */
export function DeleteForm({
  action,
  id,
  label,
  note,
}: {
  action: (form: FormData) => Promise<void>;
  id: string;
  label: string;
  note: string;
}) {
  return (
    <details className="max-w-3xl">
      <summary className="border-input inline-flex min-h-11 cursor-pointer items-center rounded-full border px-5 font-semibold">
        {label}
      </summary>
      <form action={action} className="mt-3 grid gap-3">
        <input type="hidden" name="id" value={id} />
        <p className="max-w-measure">{note}</p>
        <button
          type="submit"
          className="border-destructive text-destructive min-h-11 justify-self-start rounded-full border-2 px-5 font-semibold"
        >
          Yes, delete it
        </button>
      </form>
    </details>
  );
}
