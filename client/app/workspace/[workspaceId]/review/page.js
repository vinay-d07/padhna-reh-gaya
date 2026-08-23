import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import ReviewPage from '@/features/review/ReviewPage';

export default async function Review({ params }) {
  const { userId } = await auth();
  if (!userId) {
    redirect('/auth/sign-in');
  }

  const { workspaceId } = await params;

  return <ReviewPage workspaceId={workspaceId} />;
}
