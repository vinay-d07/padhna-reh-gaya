import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";

export default function UserNav() {
  return (
    <div className="flex items-center gap-4">
      <Show when="signed-in">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="hidden text-body-sm font-medium text-slate transition-colors hover:text-carbon-black sm:inline-flex"
          >
            Dashboard
          </Link>
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                userButtonAvatarBox: "h-9 w-9 rounded-lg border border-ash",
                userButtonTrigger: "rounded-lg focus:outline-none focus:ring-2 focus:ring-carbon-black",
              },
            }}
          />
        </div>
      </Show>
      <Show when="signed-out">
        <div className="flex items-center gap-3">
          <Link
            href="/auth/sign-in"
            className="text-body-sm font-medium text-slate transition-colors hover:text-carbon-black"
          >
            Sign in
          </Link>
          <Link
            href="/auth/sign-up"
            className="rounded-lg bg-carbon-black px-5 py-2.5 text-body-sm font-medium text-paper-white transition-opacity hover:opacity-80"
          >
            Sign up
          </Link>
        </div>
      </Show>
    </div>
  );
}
