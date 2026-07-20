import React from 'react';

interface LogoProps {
  className?: string;
  inverse?: boolean; // Set to true to invert colors (white block with black icon)
  withText?: boolean; // Show the logo mark alongside the wordmark
  textSize?: string;  // Class for text size (e.g. 'text-lg')
}

export function Logo({
  className = 'w-8 h-8',
  inverse = false,
  withText = false,
  textSize = 'text-lg',
}: LogoProps) {
  const bg = inverse ? '#FFFFFF' : '#0A0A0A';
  const fg = inverse ? '#0A0A0A' : '#FFFFFF';

  const logoMark = (
    <svg
      viewBox="0 0 512 512"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="512" height="512" rx="150" fill={bg} />
      <path
        d="M160 176 C160 115, 352 115, 352 190 C352 235, 290 248, 256 256 C210 266, 160 280, 160 336 C160 400, 352 395, 352 336"
        stroke={fg}
        strokeWidth="76"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );

  if (withText) {
    return (
      <div className="flex items-center gap-2.5">
        {logoMark}
        <span className={`font-semibold tracking-tight text-[#0A0A0A] font-sans ${textSize}`}>
          Spendly
        </span>
      </div>
    );
  }

  return logoMark;
}
