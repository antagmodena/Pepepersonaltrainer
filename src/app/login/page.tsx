'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    border: '2px solid #E2E8F0',
    borderRadius: '14px',
    outline: 'none',
    background: '#fff',
    transition: 'border-color 0.2s'
  };

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
        width: '100%',
        maxWidth: '400px'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #0066FF 0%, #00D4AA 100%)',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(0, 102, 255, 0.3)'
          }}>
            <span style={{ fontSize: '40px' }}>🎾</span>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1a1a2e', marginBottom: '4px' }}>
            Pepe Padel Trainer
          </h1>
          <p style={{ color: '#64748B', fontSize: '15px' }}>Il tuo quaderno digitale</p>
        </div>

        {/* Form Card */}
        <div style={{
          background: '#fff',
          borderRadius: '24px',
          padding: '32px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)'
        }}>
          {error && (
            <div style={{
              background: '#FEF2F2',
              color: '#DC2626',
              padding: '14px 16px',
              borderRadius: '12px',
              marginBottom: '20px',
              fontSize: '14px',
              border: '1px solid #FECACA'
            }}>
              {error === 'Invalid login credentials' ? 'Email o password non corretti' : error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#1a1a2e' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                placeholder="mario@esempio.it"
                required
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#1a1a2e' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                background: loading ? '#94A3B8' : 'linear-gradient(135deg, #0066FF 0%, #0052CC 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 32px rgba(0, 102, 255, 0.3)'
              }}
            >
              {loading ? 'Accesso in corso...' : '🚀 Accedi'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', color: '#64748B', fontSize: '14px' }}>
          Non hai un account?{' '}
          <Link href="/register" style={{ color: '#0066FF', fontWeight: 600, textDecoration: 'none' }}>
            Registrati
          </Link>
        </p>
      </div>
    </div>
  );
}
