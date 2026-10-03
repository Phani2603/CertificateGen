"use client";

import { useEffect, useRef } from "react";

function TrustBoxBase({ theme = "light" }: { theme?: "light" | "dark" }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
      data-theme={theme}
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

export function TrustpilotVariants() {
  return (
    <div className="space-y-12">
      {/* Variant 1: Minimalist Border */}
      <div>
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Variant 1: Minimalist Border</h3>
        <div className="w-full max-w-md p-4 bg-white border border-gray-200 rounded-lg">
          <TrustBoxBase />
        </div>
      </div>

      {/* Variant 2: Elevated Shadow */}
      <div>
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Variant 2: Elevated Shadow</h3>
        <div className="w-full max-w-md p-5 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          <TrustBoxBase />
        </div>
      </div>

      {/* Variant 3: Glassmorphism (Dark Context) */}
      <div className="bg-gradient-to-br from-indigo-900 to-purple-900 p-8 rounded-3xl">
        <h3 className="text-xl font-semibold mb-4 text-white">Variant 3: Glassmorphism (Dark)</h3>
        <div className="w-full max-w-md p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-xl">
          <TrustBoxBase theme="dark" />
        </div>
      </div>

      {/* Variant 4: Solid Dark Mode */}
      <div className="bg-gray-50 p-8 rounded-3xl border border-gray-200">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Variant 4: Solid Dark Mode</h3>
        <div className="w-full max-w-md p-4 bg-gray-900 border border-gray-800 rounded-lg shadow-inner">
          <TrustBoxBase theme="dark" />
        </div>
      </div>
    </div>
  );
}
