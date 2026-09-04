"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Users } from "lucide-react";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/rooms", label: "Rooms", icon: Users },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-ash bg-paper-white px-4 sm:px-6">
      <div className="flex items-center gap-6">
        <Link
          href="/dashboard"
          className="font-display text-lg uppercase tracking-wide text-carbon-black"
        >
          padhle
        </Link>
        <nav className="flex items-center gap-1">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const isActive = href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-body-sm font-medium transition-colors ${
                  isActive
                    ? "bg-mist-gray text-carbon-black"
                    : "text-slate hover:bg-mist-gray/60 hover:text-carbon-black"
                }`}
              >
                {Icon && <Icon size={14} />}
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      <UserButton
        appearance={{ elements: { userButtonAvatarBox: "h-8 w-8 rounded-lg border border-ash" } }}
      />
    </header>
  );
}
