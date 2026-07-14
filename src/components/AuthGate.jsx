import React, { useEffect, useState } from 'react';
import { getSession, signInWithPassword, signOut, signUp } from '../lib/auth.js';
import { isSupabaseConfigured, supabase } from '../lib/supabase.js';

export default function AuthGate({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return undefined;

    getSession()
      .then(setSession)
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false));

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured) {
    return (
      <>
        <div className="environment-banner">
          Demo mode: connect Supabase to activate secure login and live records.
        </div>
        {children}
      </>
    );
  }

  if (loading) {
    return <div className="auth-loading">Securing Ore Route…</div>;
  }

  if (session) {
    return (
      <>
        <div className="session-strip">
          <span>Signed in as {session.user.email}</span>
          <button type="button" onClick={() => signOut().catch((error) => setMessage(error.message))}>
            Sign out
          </button>
        </div>
        {children}
      </>
    );
  }

  async function submit(event) {
    event.preventDefault();
    setMessage('');
    try {
      if (mode === 'signup') {
        await signUp(form.email, form.password, form.fullName);
        setMessage('Account created. Check your email if confirmation is enabled.');
      } else {
        await signInWithPassword(form.email, form.password);
      }
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-visual" aria-label="Ore Route mining operations">
        <div className="auth-visual-copy">
          <p className="eyebrow">ORE ROUTE BY SOVEREIGN SALTS</p>
          <h1>Verified mineral movement from source to buyer.</h1>
          <p>Secure custody records, transport evidence, processing history and trade documentation in one operating platform.</p>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <p className="eyebrow">SECURE PLATFORM ACCESS</p>
          <h2>{mode === 'signup' ? 'Create your account' : 'Sign in to Ore Route'}</h2>
          <p className="muted">Access is controlled by organisation membership and role.</p>
          <form onSubmit={submit}>
            {mode === 'signup' && (
              <label>
                Full name
                <input required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
              </label>
            )}
            <label>
              Email address
              <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </label>
            <label>
              Password
              <input required minLength="8" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
            </label>
            <button className="primary-button auth-submit" type="submit">
              {mode === 'signup' ? 'Create account' : 'Enter platform'}
            </button>
          </form>
          {message && <p className="auth-message" role="status">{message}</p>}
          <button className="text-button" type="button" onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}>
            {mode === 'signup' ? 'Already registered? Sign in' : 'Need an account? Register'}
          </button>
        </div>
      </section>
    </main>
  );
}
