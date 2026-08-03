import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-carbon-black py-10 text-paper-white">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <span className="font-display text-xl tracking-wide">padhle</span>
        <nav className="flex items-center gap-6">
          <Link href="/auth/sign-in" className="text-body-sm text-smoke hover:text-paper-white">
            Sign in
          </Link>
          <Link href="/auth/sign-up" className="text-body-sm text-smoke hover:text-paper-white">
            Sign up
          </Link>
        </nav>
        <span className="font-mono text-caption text-smoke">
          © {new Date().getFullYear()} padhle
        </span>
      </div>
    </footer>
  );
}
