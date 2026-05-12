"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  CalendarDays,
  Plane,
  Building2,
  MessageCircle,
  Settings,
  Plus,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SidebarNavItem } from "./SidebarNavItem";
import { SearchBar } from "./SearchBar";
import { TripListItem } from "@/components/trip/TripListItem";
import { Avatar } from "./Avatar";
import type { Trip } from "@/types/database";

interface SidebarProps {
  trips: Trip[];
  userId: string;
  userName: string;
  userAvatarUrl?: string | null;
  /** Set true when rendered inside the mobile drawer (drawer provides its own header) */
  hideLogo?: boolean;
}

export function Sidebar({ trips, userId, userName, userAvatarUrl, hideLogo }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const currentTripId = pathname.match(/\/trips\/([0-9a-f-]{36})/)?.[1];
  const currentTrip = trips.find((t) => t.id === currentTripId);
  const isOrganiser = currentTrip ? currentTrip.organiser_id === userId : false;

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const tripBase = currentTripId ? `/trips/${currentTripId}` : null;
  const [searchQuery, setSearchQuery] = useState("");

  function submitSearch() {
    const q = searchQuery.trim();
    if (!q || !tripBase) return;
    router.push(`${tripBase}/itinerary?q=${encodeURIComponent(q)}`);
  }

  return (
    <nav
      className="flex flex-col h-full bg-[var(--color-sidebar-bg)] text-[var(--color-sidebar-text)] overflow-hidden"
      aria-label="Main navigation"
    >
      {/* Logo — omitted when rendered inside the mobile drawer */}
      {!hideLogo && (
        <div className="flex items-center gap-2.5 px-5 h-[64px] shrink-0 border-b border-white/10">
          <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--color-primary)] flex items-center justify-center">
            <span className="text-white font-[var(--font-weight-bold)] text-sm leading-none">G</span>
          </div>
          <span
            className="text-[var(--font-size-lg)] font-[var(--font-weight-bold)] text-white tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Golazo
          </span>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-y-auto py-4 gap-6">
        {/* Trip list */}
        <section>
          <div className="flex items-center justify-between px-5 mb-2">
            <p className="text-[10px] font-[var(--font-weight-semibold)] text-[#6B6560] uppercase tracking-widest">
              My Trips
            </p>
            <Link
              href="/trips/new"
              className="text-[#6B6560] hover:text-white transition-colors"
              aria-label="Create new trip"
            >
              <Plus size={14} strokeWidth={2} />
            </Link>
          </div>

          <div className="px-2 space-y-0.5">
            {trips.length === 0 ? (
              <p className="px-3 py-2 text-[var(--font-size-xs)] text-[#6B6560] italic">
                No trips yet
              </p>
            ) : (
              trips.map((trip) => <TripListItem key={trip.id} trip={trip} userId={userId} />)
            )}
          </div>

          <div className="px-3 mt-2">
            <Link
              href="/trips/new"
              className="flex items-center gap-2 text-[var(--font-size-xs)] text-[#6B6560] hover:text-white transition-colors py-1"
            >
              <Plus size={12} strokeWidth={2} />
              New Trip
            </Link>
          </div>
        </section>

        {/* Per-trip nav */}
        {tripBase && (
          <section>
            <div className="px-3 mb-3">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onSubmit={submitSearch}
                placeholder="Search trip…"
                variant="sidebar"
                ariaLabel="Search this trip"
              />
            </div>
            <p className="px-5 mb-2 text-[10px] font-[var(--font-weight-semibold)] text-[#6B6560] uppercase tracking-widest">
              This Trip
            </p>
            <div className="px-2 space-y-0.5">
              <SidebarNavItem
                href={`${tripBase}/dashboard`}
                icon={<LayoutDashboard size={16} strokeWidth={1.5} />}
                label="Dashboard"
              />
              <SidebarNavItem
                href={`${tripBase}/vault`}
                icon={<FolderOpen size={16} strokeWidth={1.5} />}
                label="Documents"
              />
              <SidebarNavItem
                href={`${tripBase}/itinerary`}
                icon={<CalendarDays size={16} strokeWidth={1.5} />}
                label="Itinerary"
              />
              <SidebarNavItem
                href={`${tripBase}/flights`}
                icon={<Plane size={16} strokeWidth={1.5} />}
                label="Flights"
              />
              <SidebarNavItem
                href={`${tripBase}/accommodation`}
                icon={<Building2 size={16} strokeWidth={1.5} />}
                label="Accommodation"
              />
              <SidebarNavItem
                href={`${tripBase}/chat`}
                icon={<MessageCircle size={16} strokeWidth={1.5} />}
                label="AI Chat"
              />
              {isOrganiser && (
                <SidebarNavItem
                  href={`${tripBase}/settings`}
                  icon={<Settings size={16} strokeWidth={1.5} />}
                  label="Settings"
                />
              )}
            </div>
          </section>
        )}
      </div>

      {/* User footer */}
      <div className="shrink-0 border-t border-white/10 px-4 py-3 flex items-center gap-3">
        <Avatar name={userName} avatarUrl={userAvatarUrl} size={32} />
        <span className="flex-1 text-[var(--font-size-sm)] text-[var(--color-sidebar-text)] truncate min-w-0">
          {userName}
        </span>
        <button
          type="button"
          onClick={handleLogout}
          className="text-[#6B6560] hover:text-white transition-colors shrink-0"
          aria-label="Log out"
          title="Log out"
        >
          <LogOut size={16} strokeWidth={1.5} />
        </button>
      </div>
    </nav>
  );
}
