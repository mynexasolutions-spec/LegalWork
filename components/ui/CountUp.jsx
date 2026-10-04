"use client";

import { useEffect, useRef, useState } from "react";

// counts up to a number the first time it shows, and eases between values after that
export default function CountUp({ value, duration = 900 }) {
  const target = typeof value === "number" ? value : /^\d+$/.test(String(value)) ? Number(value) : null;
  const [shown, setShown] = useState(target === null ? 0 : 0);
  const from = useRef(0);

  useEffect(() => {
    if (target === null) return;
    const start = performance.now();
    const origin = from.current;
    let frame;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = Math.round(origin + (target - origin) * eased);
      setShown(v);
      from.current = v;
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return target === null ? value : shown;
}
