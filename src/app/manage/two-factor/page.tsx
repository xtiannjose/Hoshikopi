import type { Metadata } from "next";
import { Suspense } from "react";
import { ShieldCheckIcon } from "@phosphor-icons/react/ssr";
import { renderSVG } from "uqr";

import { BackLink } from "@/components/back-link";
import { IconCircle } from "@/components/panel";
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
    <main id="main" className="page-width flex-1 py-10">
      <Suspense fallback={<p>Loading...</p>}>
        <Step searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

/** The way back, the shield and a warm lead line above the h1. */
function Lead({ name }: { name: string }) {
  const first = name.trim().split(/\s+/)[0];
  return (
    <>
      <BackLink href="/account">Your account</BackLink>
      <div className="mt-4 flex items-center gap-3">
        <IconCircle size="lg">
          <ShieldCheckIcon size={24} />
        </IconCircle>
        <p className="text-lg">One more step{first && `, ${first}`}.</p>
      </div>
    </>
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
      <div className="mx-auto w-full max-w-md">
        <Lead name={staff.name} />
        <h1 className="font-display mt-6 pb-1 text-4xl italic">
          Enter your code
        </h1>
        <p className="max-w-measure mt-2">
          Open your authenticator app and type the 6-digit code for Hoshikopi.
          We ask once each time you sign in to the staff pages.
        </p>
        <SecondFactorForm next={staff.next} />
      </div>
    );
  }
  const qr = `data:image/svg+xml,${encodeURIComponent(renderSVG(enrolment.uri))}`;
  // Phones read the steps, the QR and key, then the form; from lg the QR
  // and key sit on the right of everything else.
  return (
    <div className="mx-auto w-full max-w-3xl lg:grid lg:grid-cols-[1fr_auto] lg:gap-x-10">
      <div className="lg:col-start-1">
        <Lead name={staff.name} />
        <h1 className="font-display mt-6 pb-1 text-4xl italic">
          Set up your authenticator
        </h1>
        <p className="max-w-measure mt-2">
          Staff pages need one more step after the email link: a 6-digit code
          from an app on your phone, such as Google Authenticator, Microsoft
          Authenticator or 1Password.
        </p>
        <ol className="max-w-measure mt-6 grid list-decimal gap-4 pl-6">
          <li>Open the app and add an account.</li>
          <li>Scan the QR code, or type the setup key.</li>
          <li>Type the 6-digit code the app shows.</li>
        </ol>
      </div>
      <div className="mt-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:self-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- an inline SVG data image */}
        <img
          src={qr}
          alt="QR code for your authenticator app"
          width={200}
          height={200}
          className="rounded-card block bg-white p-3"
        />
        <p className="mt-3 lg:max-w-[200px]">
          Setup key:{" "}
          <code className="font-mono break-all">
            {enrolment.setupKey.match(/.{1,4}/g)!.join(" ")}
          </code>
        </p>
        <p className="mt-2">
          <a href={enrolment.uri}>Open it in the app on this phone</a>
        </p>
      </div>
      <div className="lg:col-start-1">
        <SecondFactorForm next={staff.next} />
      </div>
    </div>
  );
}
