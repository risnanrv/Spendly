'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import {
  LayoutDashboard,
  Receipt,
  Settings,
  LogOut,
  User,
} from 'lucide-react';

const MENU_ITEMS = [
  { label: 'Expenses', icon: Receipt, href: '/expenses' },
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Settings', icon: Settings, href: '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="hidden lg:flex w-64 bg-[#F7F7F7] border-r border-[#EAEAEA] flex-col justify-between h-screen fixed top-0 left-0 z-30 select-none">
      <div className="flex flex-col">
        {/* Header / Brand Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-[#EAEAEA]">
          <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center shadow-sm">
            <span className="text-lg font-black tracking-tighter text-white">S</span>
          </div>
          <span className="font-extrabold tracking-tight text-lg text-[#111111]">Spendly</span>
        </div>

        {/* Menu Navigation */}
        <nav className="p-4 space-y-1 flex-1">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 group ${
                  isActive
                    ? 'bg-black text-white'
                    : 'text-[#707070] hover:text-[#111111] hover:bg-[#EAEAEA]/50'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 transition-transform duration-200 ${
                  isActive ? 'text-white' : 'text-[#707070] group-hover:scale-105 group-hover:text-[#111111]'
                }`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Sign Out */}
      <div className="p-4 border-t border-[#EAEAEA] space-y-3">
        {/* User Card */}
        <div className="flex items-center gap-3 px-2">
          {user?.image ? (
            <img
              src={user.image}
              alt={user.name}
              className="w-10 h-10 rounded-full border border-[#EAEAEA] object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#EAEAEA] border border-[#EAEAEA] flex items-center justify-center text-black font-bold text-sm">
              {user?.name ? user.name[0].toUpperCase() : <User className="h-4 w-4" />}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-[#111111] truncate leading-tight">
              {user?.name || 'Guest User'}
            </span>
            <span className="text-xs text-[#707070] truncate leading-none mt-0.5">
              {user?.email}
            </span>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 active:scale-[0.98] transition-all duration-200"
        >
          <LogOut className="h-4.5 w-4.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
