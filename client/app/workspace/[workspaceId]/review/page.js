import ReviewPage from '@/features/review/ReviewPage';

export default async function Review({ params }) {
  const { workspaceId } = await params;

  return <ReviewPage workspaceId={workspaceId} />;
}
