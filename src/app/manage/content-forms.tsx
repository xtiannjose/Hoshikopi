"use client";

import { useActionState } from "react";

import { Field, SaveBar } from "@/components/fields";
import { MarkdownField } from "@/components/markdown-field";
import { useKeptForm } from "@/components/use-kept-form";

import {
  saveEventAction,
  savePostAction,
  type ContentFormState,
} from "./content-actions";

const idle: ContentFormState = { status: "idle" };

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
  isPublished: boolean;
};

export function EventForm({ event }: { event: EventFormData }) {
  const [state, action, pending] = useActionState(saveEventAction, idle);
  const form = useKeptForm(action, state);
  const error = (name: string) => state.errors?.[name];
  return (
    <form {...form} className="mt-6 grid gap-5">
      {event.id && <input type="hidden" name="id" value={event.id} />}
      <div className="grid max-w-3xl gap-5">
        <Field
          name="title"
          label="Title"
          defaultValue={event.title}
          error={error("title")}
        />
        <Field
          name="slug"
          label="Web address"
          hint="Lowercase words joined by dashes."
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
          className="size-5"
        />
        Published on the site
      </label>
      <SaveBar
        pending={pending}
        status={state.status}
        label={event.id ? "Save Event" : "Add Event"}
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
  isPublished: boolean;
};

export function PostForm({ post }: { post: PostFormData }) {
  const [state, action, pending] = useActionState(savePostAction, idle);
  const form = useKeptForm(action, state);
  const error = (name: string) => state.errors?.[name];
  return (
    <form {...form} className="mt-6 grid gap-5">
      {post.id && <input type="hidden" name="id" value={post.id} />}
      <div className="grid max-w-3xl gap-5">
        <Field
          name="title"
          label="Title"
          defaultValue={post.title}
          error={error("title")}
        />
        <Field
          name="slug"
          label="Web address"
          hint="Lowercase words joined by dashes."
          defaultValue={post.slug}
          error={error("slug")}
        />
        <Field
          name="excerpt"
          label="One line for the news list (up to 180 characters)"
          maxLength={180}
          defaultValue={post.excerpt}
          error={error("excerpt")}
        />
      </div>
      <MarkdownField
        name="bodyMd"
        label="The Post"
        defaultValue={post.bodyMd}
        error={error("bodyMd")}
      />
      <label className="inline-flex min-h-11 items-center gap-2">
        <input
          type="checkbox"
          name="isPublished"
          defaultChecked={post.isPublished}
          className="size-5"
        />
        Published on the site
      </label>
      <SaveBar
        pending={pending}
        status={state.status}
        label={post.id ? "Save Post" : "Add Post"}
      />
    </form>
  );
}
