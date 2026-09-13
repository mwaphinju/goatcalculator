"use client";

import { useEffect } from "react";

/**
 * Browsers hide a closed <details> element's content in a way that plain
 * CSS (even `display` and `content-visibility` overrides) cannot reliably
 * unhide for printing. The robust fix is to actually open every <details>
 * on the page immediately before printing, and restore whichever ones the
 * visitor had left closed immediately after — covering both the in-page
 * "Print this result" button (which calls `window.print()`) and a
 * visitor's own browser print command (Ctrl+P), since both fire the
 * standard `beforeprint`/`afterprint` events this listens for.
 */
export function PrintDetailsExpander() {
  useEffect(() => {
    let previouslyClosed: HTMLDetailsElement[] = [];

    function openAllDetails() {
      previouslyClosed = Array.from(document.querySelectorAll("details")).filter((el) => !el.open);
      for (const el of previouslyClosed) {
        el.open = true;
      }
    }

    function restoreClosedDetails() {
      for (const el of previouslyClosed) {
        el.open = false;
      }
      previouslyClosed = [];
    }

    window.addEventListener("beforeprint", openAllDetails);
    window.addEventListener("afterprint", restoreClosedDetails);
    return () => {
      window.removeEventListener("beforeprint", openAllDetails);
      window.removeEventListener("afterprint", restoreClosedDetails);
    };
  }, []);

  return null;
}
