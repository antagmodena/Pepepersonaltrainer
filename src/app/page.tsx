'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LandingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace('/dashboard');
      else setChecking(false);
    });
  }, []);

  if (checking) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: '48px' }}>🎾</span>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#fff', paddingBottom: '40px' }}>
      <div style={{
        background: 'linear-gradient(135deg, #1A8CD8 0%, #0066FF 50%, #00D4AA 100%)',
        padding: '72px 24px 48px',
        textAlign: 'center',
        borderRadius: '0 0 32px 32px'
      }}>
        <span style={{ fontSize: '72px', display: 'block', marginBottom: '16px' }}>🎾</span>
        <h1 style={{ color: '#fff', fontSize: '36px', fontWeight: 900, marginBottom: '12px' }}>MyPadelog</h1>
        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '17px', maxWidth: '280px', margin: '0 auto', lineHeight: '1.5' }}>
          Organizza partite, traccia risultati, gioca con gli amici
        </p>
      </div>

      <div style={{ padding: '32px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '36px' }}>
          {[
            { icon: '⚡', title: 'Organizza in 30 secondi', desc: 'Crea partita e invita via WhatsApp' },
            { icon: '📊', title: 'Traccia tutto', desc: 'Risultati, statistiche, streak di vittorie' },
            { icon: '🏆', title: 'Leghe tra amici', desc: 'Classifiche, sfide e tornei privati' },
            { icon: '👨‍🏫', title: 'Migliora il tuo gioco', desc: 'Piani di allenamento dal tuo maestro' },
          ].map((f, i) => (
            <div key={i} style={{
              display: 'flex', gap: '16px', alignItems: 'center',
              padding: '16px', background: '#F8FAFC', borderRadius: '16px'
            }}>
              <span style={{ fontSize: '28px', width: '40px', textAlign: 'center' }}>{f.icon}</span>
              <div>
                <p style={{ fontWeight: 700, color: '#111', fontSize: '15px' }}>{f.title}</p>
                <p style={{ color: '#666', fontSize: '13px' }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <Link href="/register" style={{
          display: 'block', width: '100%', padding: '18px',
          background: 'linear-gradient(135deg, #0066FF 0%, #00D4AA 100%)',
          color: '#fff', border: 'none', borderRadius: '16px',
          fontSize: '18px', fontWeight: 800, textAlign: 'center',
          textDecoration: 'none', boxShadow: '0 8px 32px rgba(0,102,255,0.3)'
        }}>
          Registrati gratis 🎾
        </Link>

        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px', color: '#666' }}>
          Hai già un account?{' '}
          <Link href="/login" style={{ color: '#0066FF', fontWeight: 600, textDecoration: 'none' }}>Accedi</Link>
        </p>

        <p style={{ textAlign: 'center', marginTop: '32px', fontSize: '13px', color: '#bbb' }}>
          ✓ 100% gratuito · ✓ Nessuna carta richiesta
        </p>
      </div>
    </div>
  );
}
