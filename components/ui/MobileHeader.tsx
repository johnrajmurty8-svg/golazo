"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import type { Trip } from "@/types/database";

interface MobileHeaderProps {
  trips: Trip[];
  userId: string;
  userName: string;
  userAvatarUrl?: string | null;
}

export function MobileHeader({ trips, userId, userName, userAvatarUrl }: MobileHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar — hamburger + logo */}
      <div className="md:hidden flex items-center gap-3 px-4 h-14 shrink-0 bg-[var(--color-sidebar-bg)] border-b border-white/10">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          className="text-[#A39D97] hover:text-white transition-colors p-1 -ml-1"
        >
          <Menu size={22} strokeWidth={1.5} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--color-primary)] flex items-center justify-center">
            <span className="text-white font-bold text-xs leading-none">G</span>
          </div>
          <span
            className="text-[var(--font-size-base)] font-bold text-white tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Golazo
          </span>
        </div>
      </div>

      {/* Drawer overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer panel */}
          <div className="relative w-[280px] h-full flex flex-col bg-[var(--color-sidebar-bg)] animate-[slide-in-left_200ms_ease-out] shadow-2xl">
            <div className="flex items-center justify-between px-5 h-14 shrink-0 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--color-primary)] flex items-center justify-center">
                  <span className="text-white font-bold text-xs leading-none">G</span>
                </div>
                <span
                  className="text-[var(--font-size-base)] font-bold text-white tracking-tight"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Golazo
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="text-[#A39D97] hover:text-white transition-colors"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>
            {/* Sidebar content — reuse existing Sidebar but without the logo block */}
            <div className="flex-1 overflow-y-auto" onClick={() => setOpen(false)}>
              <Sidebar
                trips={trips}
                userId={userId}
                userName={userName}
                userAvatarUrl={userAvatarUrl}
                hideLogo
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
