"use client";

import { useActionState, useState, type ReactNode } from "react";

import { Field, fillSlug, SaveBar } from "@/components/fields";
import { MarkdownField } from "@/components/markdown-field";
import { useKeptForm } from "@/components/use-kept-form";

import {
  saveEventAction,
  savePostAction,
  type ContentFormState,
} from "./content-actions";

const idle: ContentFormState = { status: "idle" };

// Fields on the left at 48rem, the aside (Sign-ups) sticky on the right.
const TOP =
  "grid gap-10 xl:grid-cols-[minmax(0,48rem)_minmax(0,1fr)] xl:items-start";
const SLUG_HINT = "Lowercase words joined by dashes, like latte-art-night.";

/** Shown on a new Event or Post whose photo didn't store (12.3). */
export function PhotoFailed() {
  return (
    <p role="alert" className="text-destructive font-semibold">
      The photo didn&apos;t save. Choose it again below, then save.
    </p>
  );
}

/**
 * The photo picker and its description (12.3), as for Menu Items. The
 * saved photo shows above it; a new file replaces it on save.
 */
function PhotoFields({
  label,
  altName,
  alt,
  current,
  error,
}: {
  label: string;
  altName: string;
  alt: string;
  current?: ReactNode;
  error: (name: string) => string | undefined;
}) {
  return (
    <div className="grid gap-5">
      {current && <div className="max-w-80">{current}</div>}
      {current && (
        <label className="inline-flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            name="removePhoto"
            className="size-5 shrink-0"
          />
          Remove this photo
        </label>
      )}
      <Field
        name="photo"
        label={label}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hint={`JPEG, PNG or WebP, 16:9, under 2 MB.${current ? " Choose a new file to replace this one." : ""}`}
        error={error("photo")}
      />
      <Field
        name={altName}
        label="Photo description (alt text)"
        hint="Say what the photo shows, for people who can't see it."
        defaultValue={alt}
        error={error(altName)}
      />
    </div>
  );
}

export type EventFormData = {
  id: string | null;
  title: string;
  slug: string;
  /** "2026-11-12T19:00", Manila time. */
  startsAt: string;
  endsAt: string;
  summary: string;
  bodyMd: string;
  price: string;
  signupUrl: string;
  seats: string;
  photoAlt: string;
  isPublished: boolean;
};

export function EventForm({
  event,
  aside,
  photo,
}: {
  event: EventFormData;
  aside?: ReactNode;
  /** The saved photo, if it has one. */
  photo?: ReactNode;
}) {
  const [state, action, pending] = useActionState(saveEventAction, idle);
  const form = useKeptForm(action, state);
  const error = (name: string) => state.errors?.[name];
  return (
    <form {...form} className="grid gap-5">
      {event.id && <input type="hidden" name="id" value={event.id} />}
      <div className={TOP}>
        <div className="grid max-w-3xl gap-5">
          <Field
            name="title"
            label="Title"
            defaultValue={event.title}
            onBlur={event.id ? undefined : fillSlug}
            error={error("title")}
          />
          <Field
            name="slug"
            label="Web address"
            hint={SLUG_HINT}
            defaultValue={event.slug}
            error={error("slug")}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              name="startsAt"
              label="Starts (Manila time)"
              type="datetime-local"
              defaultValue={event.startsAt}
              error={error("startsAt")}
            />
            <Field
              name="endsAt"
              label="Ends"
              type="datetime-local"
              defaultValue={event.endsAt}
              error={error("endsAt")}
            />
          </div>
          <Field
            name="summary"
            label="One line about it"
            defaultValue={event.summary}
            error={error("summary")}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              name="price"
              label="Price (PHP, empty for free)"
              inputMode="decimal"
              defaultValue={event.price}
              error={error("price")}
            />
            <Field
              name="signupUrl"
              label="Sign-up link (optional)"
              type="url"
              defaultValue={event.signupUrl}
              error={error("signupUrl")}
            />
          </div>
          <Field
            name="seats"
            label="Seats for Sign-ups here (optional)"
            hint="People sign up on the Event page until these run out. Empty for no Sign-up here."
            inputMode="numeric"
            defaultValue={event.seats}
            error={error("seats")}
          />
          <PhotoFields
            label="Photo"
            altName="photoAlt"
            alt={event.photoAlt}
            current={photo}
            error={error}
          />
        </div>
        {aside && (
          <div className="xl:top-below-header grid gap-6 xl:sticky">
            {aside}
          </div>
        )}
      </div>
      <MarkdownField
        name="bodyMd"
        label="About the Event"
        defaultValue={event.bodyMd}
        error={error("bodyMd")}
      />
      <label className="inline-flex min-h-11 items-center gap-2">
        <input
          type="checkbox"
          name="isPublished"
          defaultChecked={event.isPublished}
          className="size-5 shrink-0"
        />
        Published on the site
      </label>
      <SaveBar
        pending={pending}
        status={state.status}
        label={event.id ? "Save Event" : "Add Event"}
        savedText={state.saved}
      />
    </form>
  );
}

export type PostFormData = {
  id: string | null;
  title: string;
  slug: string;
  excerpt: string;
  bodyMd: string;
  coverAlt: string;
  isPublished: boolean;
  /** The saved publish date, formatted ("Sat, Nov 7"); null for a draft. */
  publishedOn: string | null;
};

export function PostForm({
  post,
  aside,
  photo,
}: {
  post: PostFormData;
  aside?: ReactNode;
  /** The saved cover photo, if it has one. */
  photo?: ReactNode;
}) {
  const [state, action, pending] = useActionState(savePostAction, idle);
  const form = useKeptForm(action, state);
  const [excerptLength, setExcerptLength] = useState(post.excerpt.length);
  const error = (name: string) => state.errors?.[name];
  return (
    <form {...form} className="grid gap-5">
      {post.id && <input type="hidden" name="id" value={post.id} />}
      <div className={TOP}>
        <div className="grid max-w-3xl gap-5">
          <Field
            name="title"
            label="Title"
            defaultValue={post.title}
            onBlur={post.id ? undefined : fillSlug}
            error={error("title")}
          />
          <Field
            name="slug"
            label="Web address"
            hint={SLUG_HINT}
            defaultValue={post.slug}
            error={error("slug")}
          />
          <div className="grid gap-1.5">
            <Field
              name="excerpt"
              label="One line for the news list (up to 180 characters)"
              maxLength={180}
              defaultValue={post.excerpt}
              onChange={(e) => setExcerptLength(e.currentTarget.value.length)}
              error={error("excerpt")}
            />
            <p className="text-muted-foreground font-mono text-sm tabular-nums">
              {excerptLength} of 180
            </p>
          </div>
          <PhotoFields
            label="Cover photo"
            altName="coverAlt"
            alt={post.coverAlt}
            current={photo}
            error={error}
          />
        </div>
        {aside && (
          <div className="xl:top-below-header grid gap-6 xl:sticky">
            {aside}
          </div>
        )}
      </div>
      <MarkdownField
        name="bodyMd"
        label="The Post"
        defaultValue={post.bodyMd}
        error={error("bodyMd")}
      />
      <div className="grid gap-1">
        <label className="inline-flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            name="isPublished"
            defaultChecked={post.isPublished}
            aria-describedby="isPublished-hint"
            className="size-5 shrink-0"
          />
          Published on the site
        </label>
        <p id="isPublished-hint" className="text-muted-foreground text-sm">
          {post.publishedOn
            ? `Published ${post.publishedOn}. Untick to take it off the News page.`
            : "Drafts stay here until you tick this."}
        </p>
      </div>
      <SaveBar
        pending={pending}
        status={state.status}
        label={post.id ? "Save Post" : "Add Post"}
      />
    </form>
  );
}
