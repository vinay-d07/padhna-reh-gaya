import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import WorkspaceShell from '@/features/workspace/WorkspaceShell';

export default async function WorkspaceLayout({ children, params }) {
  const { userId } = await auth();
  if (!userId) {
    redirect('/auth/sign-in');
  }

  const { workspaceId } = await params;

  return <WorkspaceShell workspaceId={workspaceId}>{children}</WorkspaceShell>;
}
