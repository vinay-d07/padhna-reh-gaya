import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import RoomPage from '@/features/rooms/RoomPage';

export default async function Room({ params }) {
  const { userId } = await auth();
  if (!userId) {
    redirect('/auth/sign-in');
  }

  const { roomId } = await params;

  return <RoomPage roomId={roomId} />;
}
