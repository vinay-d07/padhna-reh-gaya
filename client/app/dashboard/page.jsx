import { UserButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
    const { userId } = await auth();
    if (!userId) {
        redirect('/auth/sign-in');
    }

    return (
        <div>
            <h1>DASHBOARD
                <UserButton />
            </h1>
        </div>
    );
}
