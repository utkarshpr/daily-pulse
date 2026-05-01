import React from 'react';

// Routinely brand mark — open progress ring + checkmark. Mirrors public/icon.svg
// and public/favicon.svg so in-app branding stays consistent with the install /
// home-screen icon. Renders in `currentColor`, so put it inside a tile and set
// the parent's text colour to control the stroke.
export default function BrandMark({ size = 24, className = '' }) {
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="40"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="256" cy="256" r="160" strokeDasharray="800 1200" transform="rotate(126 256 256)" />
      <path d="M188 262 L232 306 L324 218" />
    </svg>
  );
}
