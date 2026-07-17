import React from 'react';

interface LogoProps {
  className?: string;
  inverse?: boolean; // Set to true to invert colors (white block with black ribbon)
}

export function Logo({ className = 'w-8 h-8', inverse = false }: LogoProps) {
  const bg = inverse ? '#FFFFFF' : '#111111';
  const fg = inverse ? '#111111' : '#FFFFFF';

  return (
    <svg
      viewBox="0 0 512 512"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="512" height="512" rx="128" fill={bg} />
      <path
        d="M 192,128 H 384 V 192 H 288 L 192,288 V 384 H 128 V 320 H 224 L 320,224 V 128 Z"
        fill={fg}
      />
    </svg>
  );
}
