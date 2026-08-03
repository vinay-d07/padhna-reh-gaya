import Link from "next/link";
import UserNav from "@/features/auth/components/UserNav";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#notes", label: "Notes" },
];

export default function Navbar() {
  return (
    <header className="flex h-32 w-full items-center justify-center px-6">
      <div className="flex w-full max-w-[1200px] items-center justify-between gap-6 rounded-pill bg-paper-white px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-carbon-black text-paper-white font-display text-lg">
            p
          </span>
          <span className="font-display text-2xl tracking-wide">padhle</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-body-sm font-medium text-slate transition-colors hover:text-carbon-black"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <UserNav />
      </div>
    </header>
  );
}
