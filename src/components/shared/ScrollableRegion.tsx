"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface ScrollableRegionProps {
  ariaLabel: string;
  children: ReactNode;
}

/**
 * A focusable, labelled horizontal-scroll container for wide tables
 * (`role="region"`, `tabIndex={0}`), so keyboard users without a pointer
 * can reach and scroll it, not just mouse/touch users. Shows a visible
 * "Scroll to view all columns." hint, but only once the content actually
 * overflows the container (detected via `ResizeObserver`, not a fixed
 * breakpoint) so it never appears when everything already fits.
 */
export function ScrollableRegion({ ariaLabel, children }: ScrollableRegionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const checkOverflow = () => {
      setIsScrollable(el.scrollWidth > el.clientWidth + 1);
    };

    checkOverflow();

    const resizeObserver = new ResizeObserver(checkOverflow);
    resizeObserver.observe(el);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div>
      {isScrollable ? <p className="mb-1 text-xs text-navy-soft">Scroll to view all columns.</p> : null}
      <div
        ref={scrollRef}
        role="region"
        aria-label={ariaLabel}
        tabIndex={0}
        className="max-h-96 overflow-auto rounded-md border border-border"
      >
        {children}
      </div>
    </div>
  );
}
