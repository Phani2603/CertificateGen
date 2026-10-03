"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    Trustpilot?: any;
  }
}

export function TrustBoxWidget() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If window.Trustpilot is available, it means the script has loaded.
    // We need to initialize the widget explicitly in a React/Next.js environment
    // when components mount dynamically.
    if (window.Trustpilot && ref.current) {
      window.Trustpilot.loadFromElement(ref.current, true);
    }
  }, []);

  return (
    <div
      ref={ref}
      className="trustpilot-widget"
      data-locale="en-US"
      data-template-id="56278e9abfbbba0bdcd568bc"
      data-businessunit-id="6ab2526d5acc69f37376d97d"
      data-style-height="52px"
      data-style-width="100%"
      data-token="bceb4dbd-a0b8-459b-beb8-f80158166f58"
    >
      <a
        href="https://www.trustpilot.com/review/gocertiflo.com"
        target="_blank"
        rel="noopener noreferrer"
      >
        Trustpilot
      </a>
    </div>
  );
}
