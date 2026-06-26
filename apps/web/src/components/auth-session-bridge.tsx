'use client';

import { useEffect } from 'react';
import { onIdTokenChanged } from 'firebase/auth';
import { getFirebaseAuth } from '../lib/firebase';

export function AuthSessionBridge() {
  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    getFirebaseAuth().then((auth) => {
      if (!active) {
        return;
      }

      unsubscribe = onIdTokenChanged(auth, async (user) => {
        if (user) {
          const idToken = await user.getIdToken();
          await fetch('/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken })
          });
          return;
        }

        await fetch('/auth/logout', { method: 'POST' });
      });
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  return null;
}
