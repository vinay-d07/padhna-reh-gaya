import DocumentHubPage from '@/features/documents/DocumentHubPage';

export default async function Document({ params }) {
  const { docId } = await params;

  return <DocumentHubPage documentId={docId} />;
}
