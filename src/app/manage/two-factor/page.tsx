import type { Metadata } from "next";
import { Suspense } from "react";
import { renderSVG } from "uqr";

import {
  secondFactorEnrolment,
  staffAwaitingSecondFactor,
} from "@/modules/identity";

import { SecondFactorForm } from "./second-factor-form";

export const metadata: Metadata = {
  title: "Your code",
  robots: { index: false },
};

// Staff pages ask for an authenticator code once per sign-in (ADR 0014).
export default function SecondFactorPage({
  searchParams,
}: PageProps<"/manage/two-factor">) {
  return (
    <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <Suspense fallback={<p>Loading...</p>}>
        <Step searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Step({
  searchParams,
}: Pick<PageProps<"/manage/two-factor">, "searchParams">) {
  const { next } = await searchParams;
  const staff = await staffAwaitingSecondFactor(
    typeof next === "string" ? next : undefined
  );
  const enrolment = await secondFactorEnrolment(staff.id, staff.email);
  if (!enrolment) {
    return (
      <>
        <h1 className="font-display pb-1 text-4xl italic">Enter your code</h1>
        <p className="mt-2 max-w-prose">
          Open your authenticator app and type the 6-digit code for Hoshikopi.
          We ask once each time you sign in to the staff pages.
        </p>
        <SecondFactorForm next={staff.next} />
      </>
    );
  }
  const qr = `data:image/svg+xml,${encodeURIComponent(renderSVG(enrolment.uri))}`;
  return (
    <>
      <h1 className="font-display pb-1 text-4xl italic">
        Set up your authenticator
      </h1>
      <p className="mt-2 max-w-prose">
        Staff pages need one more step after the email link: a 6-digit code from
        an app on your phone, such as Google Authenticator, Microsoft
        Authenticator or 1Password.
      </p>
      <ol className="mt-6 grid max-w-prose list-decimal gap-4 pl-6">
        <li>Open the app and add an account.</li>
        <li>
          Scan this code, or type the setup key.
          {/* eslint-disable-next-line @next/next/no-img-element -- an inline SVG data image */}
          <img
            src={qr}
            alt="QR code for your authenticator app"
            width={200}
            height={200}
            className="rounded-card mt-3 block bg-white p-3"
          />
          <p className="mt-3">
            Setup key:{" "}
            <code className="font-mono break-all">
              {enrolment.setupKey.match(/.{1,4}/g)!.join(" ")}
            </code>
          </p>
          <p className="mt-2">
            <a href={enrolment.uri}>Open it in the app on this phone</a>
          </p>
        </li>
        <li>Type the 6-digit code the app shows.</li>
      </ol>
      <SecondFactorForm next={staff.next} />
    </>
  );
}
