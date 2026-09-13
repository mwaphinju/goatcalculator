"use client";

import { useState } from "react";

export type ExampleOrigin = "default" | "example" | "user";

/**
 * The example/origin state machine shared by every calculator: origin
 * moves one way, `default -> example -> user`, and never back. `default`
 * covers a field's starting state, whether that's genuinely empty (a
 * required field) or a visible zero default. `example` means "Try an
 * example" has loaded illustrative sample values into every tracked
 * field. `user` means at least one field has been edited since; every
 * *other* tracked field that still holds its untouched example value gets
 * flagged in `exampleResidue` until it, too, is edited, so an untouched
 * example value is never silently presented as something the visitor
 * chose.
 */
export function useExampleOrigin<K extends string>(fieldKeys: readonly K[]) {
  const [origin, setOrigin] = useState<ExampleOrigin>("default");
  const [exampleResidue, setExampleResidue] = useState<Set<K>>(new Set());

  /** Call when a tracked field (one that "Try an example" fills in) is edited. */
  function onFieldEdit(key: K) {
    if (origin === "example") {
      setExampleResidue(new Set(fieldKeys.filter((k) => k !== key)));
      setOrigin("user");
    } else if (origin === "user") {
      if (exampleResidue.has(key)) {
        const next = new Set(exampleResidue);
        next.delete(key);
        setExampleResidue(next);
      }
    } else {
      setOrigin("user");
    }
  }

  /**
   * Call when a mechanics choice not covered by `fieldKeys` (a timing or
   * rate-mode radio) changes. It never gets its own residue tag, but
   * changing it while an example is loaded still means the visitor acted,
   * so the scenario stops being untouched, and every tracked field is
   * still carrying its example value.
   */
  function onUntrackedEdit() {
    if (origin === "example") {
      setExampleResidue(new Set(fieldKeys));
      setOrigin("user");
    } else if (origin === "default") {
      setOrigin("user");
    }
  }

  function activateExample() {
    setOrigin("example");
    setExampleResidue(new Set());
  }

  return {
    origin,
    exampleResidue,
    onFieldEdit,
    onUntrackedEdit,
    activateExample,
  };
}
