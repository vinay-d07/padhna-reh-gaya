import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import RoomsLobby from '@/features/rooms/RoomsLobby';

export default async function Rooms() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/auth/sign-in');
  }

  return <RoomsLobby />;
}
