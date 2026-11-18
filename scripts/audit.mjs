// The dependency audit for CI and `npm run qa`: high and critical advisories
// in the packages the site runs fail it (batch 7.11a). npm counts vitest as
// one of them, because better-auth lists it as an optional peer, so an
// advisory that reaches only the test runner would block every pull request.
// Those few are listed here with their reason, and only while no fix exists.
import { execSync } from "node:child_process";

const ALLOWED = {
  // picomatch <= 4.0.7, ReDoS (published 2026-11-18, no fixed version yet):
  // reached only through vitest and vite, which run the tests and never
  // ship. Remove this line once picomatch publishes a fix.
  "GHSA-fc5q-39xc-vjpf": "vitest and vite only",
};

let report;
try {
  report = execSync("npm audit --omit=dev --json", { encoding: "utf8" });
} catch (error) {
  // npm audit exits 1 whenever it finds anything; the report is on stdout.
  report = error.stdout;
}
// No report (offline, npm changed its output) fails: the gate stays closed.
const { vulnerabilities } = JSON.parse(report);

const SERIOUS = ["high", "critical"];
const blocking = new Set();
const seen = new Set();
for (const [name, { via }] of Object.entries(vulnerabilities)) {
  // A string names another flagged package; its own entry is checked.
  for (const advisory of via.filter((v) => typeof v === "object")) {
    const id = advisory.url.split("/").pop();
    seen.add(id);
    if (SERIOUS.includes(advisory.severity) && !ALLOWED[id]) {
      blocking.add(`${name}: ${advisory.title} (${advisory.url})`);
    }
  }
}

for (const id of Object.keys(ALLOWED)) {
  console.log(
    seen.has(id)
      ? `Allowed: ${id} (${ALLOWED[id]}).`
      : `${id} is no longer reported: remove it from scripts/audit.mjs.`
  );
}
if (blocking.size > 0) {
  console.error([...blocking].join("\n"));
  process.exit(1);
}
console.log("No high or critical advisory in the packages the site runs.");
