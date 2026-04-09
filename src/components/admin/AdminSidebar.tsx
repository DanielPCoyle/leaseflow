"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/properties", label: "Properties", icon: "apartment" },
  { href: "/admin/units", label: "Units", icon: "door_front" },
  { href: "/admin/agents", label: "Agents", icon: "badge" },
  { href: "/admin/prospects", label: "Prospects", icon: "people" },
  { href: "/admin/tours", label: "Tours", icon: "calendar_month" },
  { href: "/admin/applications", label: "Applications", icon: "description" },
  { href: "/admin/leases", label: "Leases", icon: "handshake" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r border-border bg-white dark:bg-secondary lg:flex lg:flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <span className="material-icons text-white text-lg">apartment</span>
        </div>
        <span className="text-lg font-bold tracking-tight text-secondary dark:text-white">
          LeaseFlow
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted hover:bg-surface hover:text-foreground"
                  }`}
                >
                  <span className="material-icons text-[20px]">
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
