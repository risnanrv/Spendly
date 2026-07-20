'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { Logo } from '@/components/ui/Logo';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Receipt,
  Settings,
  LogOut,
  User,
  ChevronRight,
} from 'lucide-react';

const MENU_ITEMS = [
  { label: 'Expenses', icon: Receipt, href: '/expenses' },
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Settings', icon: Settings, href: '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <motion.aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ width: 64 }}
      animate={{ width: isHovered ? 220 : 64 }}
      transition={{ type: 'spring', stiffness: 220, damping: 26 }}
      className="hidden lg:flex flex-col justify-between h-screen fixed top-0 left-0 z-40 bg-white border-r border-[#E8E8E8] select-none shadow-[1px_0_10px_rgba(0,0,0,0.02)] overflow-hidden"
    >
      <div className="flex flex-col w-full">
        {/* Brand Logo Header */}
        <div className="h-16 flex items-center px-4 border-b border-[#E8E8E8] shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Logo className="w-8 h-8" />
            <AnimatePresence>
              {isHovered && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="font-semibold tracking-tight text-base text-[#0A0A0A] whitespace-nowrap"
                >
                  Spendly
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Menu Navigation */}
        <nav className="p-3 space-y-1 w-full">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex items-center h-10 px-3 rounded-xl transition-colors group"
              >
                {/* Sliding active background indicator */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute inset-0 bg-[#0A0A0A] rounded-xl z-0"
                    transition={{ type: 'spring', stiffness: 250, damping: 28 }}
                  />
                )}

                <div className="relative z-10 flex items-center w-full">
                  <Icon
                    className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                      isActive
                        ? 'text-white'
                        : 'text-[#6B6B6B] group-hover:text-[#0A0A0A]'
                    }`}
                  />
                  
                  <AnimatePresence>
                    {isHovered && (
                      <motion.span
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        transition={{ duration: 0.15 }}
                        className={`ml-3 text-xs font-medium whitespace-nowrap transition-colors ${
                          isActive
                            ? 'text-white'
                            : 'text-[#6B6B6B] group-hover:text-[#0A0A0A]'
                        }`}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / User Profile & Logout */}
      <div className="p-3 border-t border-[#E8E8E8] shrink-0 space-y-2 bg-white">
        {/* User Card */}
        <div className="flex items-center h-10 px-1.5 overflow-hidden">
          {user?.image ? (
            <img
              src={user.image}
              alt={user.name}
              className="w-7 h-7 rounded-full border border-[#E8E8E8] object-cover shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center font-semibold text-xs shrink-0">
              {user?.name ? user.name[0].toUpperCase() : <User className="h-3.5 w-3.5" />}
            </div>
          )}
          
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="ml-3 flex flex-col min-w-0"
              >
                <span className="text-xs font-semibold text-[#0A0A0A] truncate leading-none">
                  {user?.name || 'Spendly User'}
                </span>
                <span className="text-[10px] text-[#6B6B6B] truncate mt-1 leading-none">
                  {user?.email}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="relative w-full flex items-center h-10 px-3 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors group active:scale-[0.98]"
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          <AnimatePresence>
            {isHovered && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="ml-3 text-xs font-medium whitespace-nowrap"
              >
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
