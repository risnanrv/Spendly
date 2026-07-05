'use client';

import React from 'react';

interface GreetingHeaderProps {
  todayDateStr: string;
  greeting: string;
  userName: string;
}

export function GreetingHeader({
  todayDateStr,
}: GreetingHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex flex-col">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#111111] mt-1">
          Dashboard
        </h1>
        <span className="text-xs text-[#707070] mt-0.5">
          {todayDateStr}
        </span>
      </div>
    </div>
  );
}
