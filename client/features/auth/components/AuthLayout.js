import Link from "next/link";

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo and Brand Link */}
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center border border-current rounded">
              <span className="text-xl font-bold tracking-wider">P</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">
              padhle
            </span>
          </Link>
        </div>

        {title && (
          <h2 className="text-center text-2xl font-bold tracking-tight">
            {title}
          </h2>
        )}
        
        {subtitle && (
          <p className="mt-2 text-center text-sm">
            {subtitle}
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center px-4 py-8 sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}
