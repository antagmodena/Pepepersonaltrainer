'use client';

import { useState, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function RegisterForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isCoach, setIsCoach] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, can_coach: isCoach },
        emailRedirectTo: `${window.location.origin}/auth/callback${redirect ? `?redirect=${redirect}` : ''}`
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: '#fff',
          borderRadius: '24px',
          padding: '40px 24px',
          textAlign: 'center',
          maxWidth: '400px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
        }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>📧</span>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a2e', marginBottom: '12px' }}>
            Controlla la tua email!
          </h2>
          <p style={{ color: '#64748B', fontSize: '14px' }}>
            Ti abbiamo inviato un link per confermare il tuo account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #0066FF 0%, #00D4AA 100%)',
          borderRadius: '24px',
          padding: '32px',
          textAlign: 'center',
          marginBottom: '24px',
          boxShadow: '0 8px 32px rgba(0, 102, 255, 0.2)'
        }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '8px' }}>🎾</span>
          <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 800 }}>MyPadelog</h1>
        </div>

        <div style={{
          background: '#fff',
          borderRadius: '24px',
          padding: '32px 24px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a2e', marginBottom: '24px', textAlign: 'center' }}>
            Crea il tuo account
          </h2>

          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px', color: '#1a1a2e' }}>Nome completo</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '16px',
                  border: '2px solid #E2E8F0',
                  borderRadius: '12px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px', color: '#1a1a2e' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '16px',
                  border: '2px solid #E2E8F0',
                  borderRadius: '12px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px', color: '#1a1a2e' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '16px',
                  border: '2px solid #E2E8F0',
                  borderRadius: '12px',
                  outline: 'none'
                }}
              />
            </div>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              background: '#F0FDF4',
              borderRadius: '12px',
              marginBottom: '24px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={isCoach}
                onChange={(e) => setIsCoach(e.target.checked)}
                style={{ width: '20px', height: '20px' }}
              />
              <span style={{ fontSize: '14px', color: '#1a1a2e' }}>👨‍🏫 Sono anche un Maestro</span>
            </label>

            {error && (
              <div style={{
                background: '#FEF2F2',
                color: '#DC2626',
                padding: '12px',
                borderRadius: '10px',
                marginBottom: '16px',
                fontSize: '14px',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                background: loading ? '#94A3B8' : 'linear-gradient(135deg, #0066FF 0%, #00D4AA 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: 700,
                cursor: loading ? 'wait' : 'pointer'
              }}
            >
              {loading ? 'Registrazione...' : 'Registrati'}
            </button>
          </form>

          <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#64748B' }}>
            Hai già un account?{' '}
            <Link href={redirect ? `/login?redirect=${redirect}` : '/login'} style={{ color: '#0066FF', fontWeight: 600 }}>
              Accedi
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Caricamento...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
