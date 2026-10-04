"use client";

import { useEffect } from "react";
import { applyBrandColor, defaults, loadSettings } from "@/lib/settings";

// re-applies the saved primary colour on every page load
export default function ThemeApplier() {
  useEffect(() => {
    const { color } = loadSettings().appearance;
    if (color !== defaults.appearance.color) applyBrandColor(color);
  }, []);
  return null;
}
