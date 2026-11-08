import { StarIcon, SunIcon, TimerIcon } from "@phosphor-icons/react/ssr";

import { ThemeChoices } from "./theme-choices";

// Auto runs on the cafe's clock, hence the stopwatch. Rendered here on the
// server, so no icon code ships with the switch (7.6).
const CHOICES = [
  { value: "auto", label: "Auto", icon: <TimerIcon aria-hidden size={18} /> },
  { value: "day", label: "Day", icon: <SunIcon aria-hidden size={18} /> },
  { value: "night", label: "Night", icon: <StarIcon aria-hidden size={18} /> },
] as const;

/** Auto follows the cafe's clock; Day or Night pins one (ADR 0010). */
export function ThemeSwitch({ name }: { name: string }) {
  return <ThemeChoices name={name} choices={[...CHOICES]} />;
}
