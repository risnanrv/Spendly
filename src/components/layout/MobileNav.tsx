'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
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
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/70 backdrop-blur-xl border-t border-[#E8E8E8] flex items-center justify-around px-4 pb-safe z-40 select-none lg:hidden">
      {TAB_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname?.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className="relative flex flex-col items-center justify-center flex-1 h-full py-2 group text-center"
          >
            {/* Sliding active pill indicator */}
            {isActive && (
              <motion.div
                layoutId="mobile-nav-active-pill"
                className="absolute inset-x-4 top-1 bottom-1 bg-[#F5F5F5] rounded-xl -z-10"
                transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              />
            )}

            <motion.div
              className={`p-1 transition-colors ${
                isActive ? 'text-[#0A0A0A]' : 'text-[#6B6B6B]'
              }`}
              whileTap={{ scale: 0.92 }}
            >
              <Icon className="h-5 w-5" />
            </motion.div>
            
            <span
              className={`text-[10px] font-medium tracking-tight mt-0.5 transition-colors ${
                isActive ? 'text-[#0A0A0A]' : 'text-[#6B6B6B]'
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
