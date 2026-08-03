import Link from "next/link";

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-warm-canvas px-6 py-16">
      <Link href="/" className="mb-10 flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-carbon-black text-paper-white font-display text-xl">
          p
        </span>
        <span className="font-display text-2xl tracking-wide text-carbon-black">
          padhle
        </span>
      </Link>

      <div className="w-full max-w-md rounded-card-lg bg-paper-white p-8 sm:p-10">
        {title && (
          <h1 className="text-center font-display text-heading uppercase text-carbon-black">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="mt-2 text-center text-body-sm text-slate">{subtitle}</p>
        )}

        <div className="mt-8 flex justify-center">{children}</div>
      </div>

      <Link
        href="/"
        className="mt-8 text-body-sm text-slate transition-colors hover:text-carbon-black"
      >
        &larr; Back to home
      </Link>
    </div>
  );
}
