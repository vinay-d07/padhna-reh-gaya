import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import UserNav from "@/features/auth/components/UserNav";

export default async function Home() {
  const { userId } = await auth();
  if (userId) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 font-sans text-white">
      <div className="flex flex-col items-center gap-8 text-center">
        <h1 className="text-5xl font-black tracking-widest uppercase">
          Landing Page
        </h1>
        <UserNav />
      </div>
    </div>
  );
}
