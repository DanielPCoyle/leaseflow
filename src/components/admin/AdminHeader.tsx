"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface AdminHeaderProps {
  user: {
    name?: string | null;
    email: string;
    role: string;
  };
}

const mobileNavItems = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/properties", label: "Properties", icon: "apartment" },
  { href: "/admin/units", label: "Units", icon: "door_front" },
  { href: "/admin/agents", label: "Agents", icon: "badge" },
  { href: "/admin/prospects", label: "Prospects", icon: "people" },
  { href: "/admin/tours", label: "Tours", icon: "calendar_month" },
  { href: "/admin/applications", label: "Applications", icon: "description" },
  { href: "/admin/leases", label: "Leases", icon: "handshake" },
  { href: "/admin/listings", label: "Listings", icon: "rss_feed" },
  { href: "/admin/reports", label: "Reports", icon: "bar_chart" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

export function AdminHeader({ user }: AdminHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const roleLabel = user.role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-border bg-white dark:bg-secondary px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden rounded-lg p-2 text-muted hover:bg-surface"
          >
            <span className="material-icons">menu</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative rounded-lg p-2 text-muted hover:bg-surface">
            <span className="material-icons text-[20px]">notifications</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="material-icons text-[18px]">person</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium">{user.name || user.email}</p>
              <p className="text-xs text-muted">{roleLabel}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-lg p-2 text-muted hover:bg-surface hover:text-danger transition-colors"
            title="Sign out"
          >
            <span className="material-icons text-[20px]">logout</span>
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-border bg-white dark:bg-secondary px-3 py-2">
          <nav>
            <ul className="space-y-1">
              {mobileNavItems.map((item) => {
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted hover:bg-surface hover:text-foreground"
                      }`}
                    >
                      <span className="material-icons text-[20px]">{item.icon}</span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}
