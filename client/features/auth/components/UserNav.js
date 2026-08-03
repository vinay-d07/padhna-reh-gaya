import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";

export default function UserNav() {
  return (
    <div className="flex items-center gap-4">
      <Show when="signed-in">
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard" 
            className="hidden sm:inline-flex text-sm font-medium text-slate-350 hover:text-white transition-colors duration-200"
          >
            Dashboard
          </Link>
          <UserButton 
            afterSignOutUrl="/"
            appearance={{
              elements: {
                userButtonAvatarBox: "h-9 w-9 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors duration-200",
                userButtonTrigger: "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-xl"
              }
            }}
          />
        </div>
      </Show>
      <Show when="signed-out">
        <div className="flex items-center gap-3">
          <Link
            href="/auth/sign-in"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200 px-3.5 py-2 rounded-xl"
          >
            Sign In
          </Link>
          <Link
            href="/auth/sign-up"
            className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium text-white rounded-xl group bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 group-hover:from-indigo-500 group-hover:to-pink-500 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-indigo-800"
          >
            <span className="relative px-4 py-1.5 transition-all ease-in duration-75 bg-slate-950 rounded-[10px] group-hover:bg-opacity-0">
              Sign Up
            </span>
          </Link>
        </div>
      </Show>
    </div>
  );
}
