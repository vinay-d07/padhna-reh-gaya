import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import WorkspacePage from '@/features/workspace/WorkspacePage';

export default async function Workspace({ params }) {
  const { userId } = await auth();
  if (!userId) {
    redirect('/auth/sign-in');
  }

  const { workspaceId } = await params;

  return <WorkspacePage workspaceId={workspaceId} />;
}
