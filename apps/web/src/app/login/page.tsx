'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirebaseAuth } from '../../lib/firebase';

type Mode = 'login' | 'signup';

type SessionUser = {
  role: 'CUSTOMER' | 'MECHANIC' | 'ADMIN';
  customerProfileId?: string | null;
};

function getRoleDestination(user: SessionUser): string {
  if (user.role === 'ADMIN') {
    return '/admin/bookings';
  }

  if (user.role === 'MECHANIC') {
    return '/mechanic/tasks';
  }

  return user.customerProfileId ? '/bookings' : '/register';
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const heading = useMemo(() => (mode === 'login' ? 'Log in to MotoTrust' : 'Create your MotoTrust account'), [mode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get('fullName') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    const phone = String(formData.get('phone') ?? '').trim();

    try {
      const auth = await getFirebaseAuth();
      const credential =
        mode === 'signup'
          ? await createUserWithEmailAndPassword(auth, email, password)
          : await signInWithEmailAndPassword(auth, email, password);

      if (mode === 'signup' && fullName) {
        await updateProfile(credential.user, { displayName: fullName });
      }

      const idToken = await credential.user.getIdToken(true);
      const response = await fetch('/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ message: 'Unable to start MotoTrust session.' }));
        throw new Error(body.message);
      }

      const sessionUser = (await response.json()) as SessionUser;

      if (mode === 'signup') {
        const query = new URLSearchParams();
        if (fullName) {
          query.set('fullName', fullName);
        }
        query.set('email', email);
        if (phone) {
          query.set('phone', phone);
        }
        router.push(`/register?${query.toString()}`);
        router.refresh();
        return;
      }

      router.push(getRoleDestination(sessionUser));
      router.refresh();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page form-page">
      <section className="form-shell">
        <p className="eyebrow">Authentication</p>
        <h1>{heading}</h1>
        <p className="lede">Use Firebase Authentication to access bookings, service operations, and live audit views.</p>

        <div className="segmented-control" style={{ marginTop: 24 }}>
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            Log in
          </button>
          <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flow-form">
          {mode === 'signup' ? (
            <label>
              Full name
              <input name="fullName" placeholder="Hruday Vishal Banda" minLength={2} maxLength={120} required />
            </label>
          ) : null}

          <label>
            Email
            <input name="email" type="email" placeholder="hruday@example.com" required />
          </label>

          {mode === 'signup' ? (
            <label>
              Phone
              <input name="phone" type="tel" placeholder="+919876543210" />
            </label>
          ) : null}

          <label>
            Password
            <input name="password" type="password" minLength={6} required />
          </label>

          {error ? <p className="error-text">{error}</p> : null}

          <button type="submit" disabled={loading}>
            {loading ? 'Working...' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>
      </section>
    </main>
  );
}
