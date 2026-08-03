"use client";

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { syncUserWithBackend } from '@/features/auth/auth.services';

export default function UserSync({ children }) {
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    const sync = async () => {
      if (isLoaded && isSignedIn && user) {
        const email = user.emailAddresses[0]?.emailAddress;
        const name = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || null;
        const imageUrl = user.imageUrl;
        
        try {
          // Prevent multiple requests in the same browser session tab
          const syncFlag = sessionStorage.getItem(`synced_${user.id}`);
          if (!syncFlag) {
            await syncUserWithBackend({
              clerkId: user.id,
              email,
              name,
              imageUrl,
            });
            sessionStorage.setItem(`synced_${user.id}`, 'true');
          }
        } catch (error) {
          console.error('Failed to sync user with backend:', error);
        }
      }
    };

    sync();
  }, [isLoaded, isSignedIn, user]);

  return <>{children}</>;
}
