'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [wantToCoach, setWantToCoach] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'student',
          can_coach: wantToCoach,
          active_role: 'student',
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    border: '2px solid #E2E8F0',
    borderRadius: '14px',
    outline: 'none',
    background: '#fff'
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
          padding: '40px 32px',
          maxWidth: '400px',
          textAlign: 'center',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 8px 32px rgba(34, 197, 94, 0.3)'
          }}>
            <span style={{ fontSize: '40px' }}>✉️</span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1a1a2e', marginBottom: '12px' }}>
            Controlla la tua email!
          </h2>
          <p style={{ color: '#64748B', fontSize: '15px', marginBottom: '24px' }}>
            Ti abbiamo inviato un link di conferma a<br />
            <strong style={{ color: '#1a1a2e' }}>{email}</strong>
          </p>
          <Link href="/login" style={{
            display: 'inline-block',
            padding: '14px 32px',
            background: '#F1F5F9',
            color: '#1a1a2e',
            borderRadius: '12px',
            fontWeight: 600,
            textDecoration: 'none'
          }}>
            ← Torna al login
          </Link>
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
            Crea il tuo account
          </h1>
          <p style={{ color: '#64748B', fontSize: '15px' }}>Inizia a tracciare i tuoi progressi</p>
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
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#1a1a2e' }}>
                Nome completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={inputStyle}
                placeholder="Mario Rossi"
                required
              />
            </div>

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

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#1a1a2e' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
                placeholder="Minimo 6 caratteri"
                minLength={6}
                required
              />
            </div>

            {/* Coach Toggle */}
            <div style={{
              background: '#F8FAFC',
              borderRadius: '14px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={wantToCoach}
                  onChange={(e) => setWantToCoach(e.target.checked)}
                  style={{ width: '20px', height: '20px', accentColor: '#22C55E' }}
                />
                <div>
                  <p style={{ fontWeight: 600, color: '#1a1a2e', fontSize: '15px' }}>
                    👨‍🏫 Sono anche un Maestro
                  </p>
                  <p style={{ fontSize: '12px', color: '#64748B' }}>
                    Potrai gestire allievi e creare piani
                  </p>
                </div>
              </label>
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
              {loading ? 'Registrazione...' : '🚀 Crea account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', color: '#64748B', fontSize: '14px' }}>
          Hai già un account?{' '}
          <Link href="/login" style={{ color: '#0066FF', fontWeight: 600, textDecoration: 'none' }}>
            Accedi
          </Link>
        </p>
      </div>
    </div>
  );
}
