"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

interface SidebarNavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  exact?: boolean;
}

export function SidebarNavItem({ href, icon, label, exact = false }: SidebarNavItemProps) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-[var(--font-size-sm)] font-[var(--font-weight-medium)] transition-all duration-100 group relative",
        isActive
          ? "bg-[var(--color-sidebar-hover)] text-white"
          : "text-[#A39D97] hover:bg-[var(--color-sidebar-hover)] hover:text-white"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {/* Active indicator */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[var(--color-sidebar-active)] rounded-r-full" />
      )}
      <span className={cn("shrink-0", isActive ? "text-[var(--color-sidebar-active)]" : "")}>
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
}
