"use client";

import { useEffect, useState } from "react";

import { formatTime, now } from "@/lib/clock";

/** The cafe's clock in Manila time, ticking each 15 seconds. */
export function ManilaClock() {
  const [text, setText] = useState("");
  useEffect(() => {
    const tick = () => setText(formatTime(now()));
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 15_000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);
  return (
    <span className="font-mono">
      <span className="sr-only">Time in Manila: </span>
      {text || "Manila time"}
    </span>
  );
}
