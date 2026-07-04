'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  Settings,
} from 'lucide-react';

const TAB_ITEMS = [
  { label: 'Expenses', icon: Receipt, href: '/expenses' },
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Settings', icon: Settings, href: '/settings' },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-lg border-t border-[#EAEAEA] flex items-center justify-around px-2 pb-safe z-30 select-none lg:hidden">
      {TAB_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname?.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center flex-1 h-full py-2 group text-center"
          >
            <div
              className={`p-1 rounded-xl transition-all duration-200 ${
                isActive ? 'text-black' : 'text-[#707070] group-active:scale-95'
              }`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <span
              className={`text-[10px] font-bold mt-0.5 tracking-tight transition-colors ${
                isActive ? 'text-black' : 'text-[#707070]'
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
