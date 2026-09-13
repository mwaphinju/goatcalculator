"use client";

import { useState } from "react";

/**
 * Tracks which required fields a visitor has interacted with (blurred),
 * so a required field's "Enter a value" message only appears after
 * interaction, blur, or an attempted calculation, never on first paint
 * before the visitor has had a chance to answer.
 */
export function useTouchedFields<K extends string>() {
  const [touched, setTouched] = useState<Set<K>>(new Set());

  function markTouched(key: K) {
    setTouched((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }

  return { touched, markTouched };
}
