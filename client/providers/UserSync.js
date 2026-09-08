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
            const response = await syncUserWithBackend({ email, name, imageUrl });
            sessionStorage.setItem(`synced_${user.id}`, 'true');
            // Persisted (not sessionStorage) so the onboarding walkthrough
            // still shows up if the user closes the tab before finishing it —
            // the dashboard clears this flag once the walkthrough is shown.
            if (response?.isNewUser) {
              localStorage.setItem(`padhle:onboarding-pending:${user.id}`, '1');
            }
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
