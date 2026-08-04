import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import DashboardPage from '@/features/dashboard/DashboardPage';

export default async function Dashboard() {
    const { userId } = await auth();
    if (!userId) {
        redirect('/auth/sign-in');
    }

    return <DashboardPage />;
}
