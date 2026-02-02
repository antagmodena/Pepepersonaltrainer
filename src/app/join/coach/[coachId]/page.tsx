'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function JoinCoachPage({ params }: { params: Promise<{ coachId: string }> }) {
  const { coachId } = use(params);
  const [coachName, setCoachName] = useState('');
  const [loading, setLoading] = useState(true);
  const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      // Carica info coach
      const { data: coach } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', coachId)
        .single();

      if (!coach) {
        setError('Maestro non trovato');
        setLoading(false);
        return;
      }
      setCoachName(coach.full_name || 'Maestro');

      // Check se utente è già loggato
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setAlreadyLoggedIn(true);
        // Check se già connesso
        const { data: existing } = await supabase
          .from('coach_student_connections')
          .select('id, status')
          .eq('coach_id', coachId)
          .eq('student_id', user.id)
          .single();

        if (existing) {
          setConnected(true);
        }
      }
      setLoading(false);
    };
    init();
  }, [coachId]);

  const connectNow = async () => {
    setConnecting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: err } = await supabase.from('coach_student_connections').insert({
      coach_id: coachId,
      student_id: user.id,
      status: 'accepted'
    });

    if (err) {
      setError('Errore nella connessione');
    } else {
      setConnected(true);
    }
    setConnecting(false);
  };

  const handleRegisterClick = () => {
    // Salva coachId per dopo la registrazione
    localStorage.setItem('pendingCoachId', coachId);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '48px' }}>🎾</span>
      </div>
    );
  }

  if (error && !coachName) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
        <div>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>😕</span>
          <p style={{ color: '#666', fontSize: '16px', marginBottom: '24px' }}>{error}</p>
          <Link href="/" style={{ color: '#1A8CD8', fontWeight: 600, textDecoration: 'none' }}>Torna alla home</Link>
        </div>
      </div>
    );
  }

  // Già connesso
  if (connected) {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', padding: '20px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #064E3B 100%)',
          padding: '72px 24px 48px',
          textAlign: 'center',
          borderRadius: '0 0 32px 32px',
          margin: '-20px -20px 32px'
        }}>
          <span style={{ fontSize: '72px', display: 'block', marginBottom: '16px' }}>✅</span>
          <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 900, marginBottom: '8px' }}>Collegato!</h1>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
            Sei connesso con <strong>{coachName}</strong>
          </p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#666', fontSize: '15px', marginBottom: '24px', lineHeight: '1.6' }}>
            Il tuo maestro può ora inviarti piani di allenamento, video e valutazioni.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              width: '100%', padding: '18px',
              background: 'linear-gradient(135deg, #059669, #047857)',
              color: '#fff', border: 'none', borderRadius: '16px',
              fontSize: '17px', fontWeight: 700, cursor: 'pointer'
            }}
          >
            Vai alla Dashboard 🎾
          </button>
        </div>
      </div>
    );
  }

  // Già loggato ma non connesso
  if (alreadyLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', padding: '20px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #064E3B 100%)',
          padding: '72px 24px 48px',
          textAlign: 'center',
          borderRadius: '0 0 32px 32px',
          margin: '-20px -20px 32px'
        }}>
          <span style={{ fontSize: '72px', display: 'block', marginBottom: '16px' }}>👨‍🏫</span>
          <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 900, marginBottom: '8px' }}>{coachName}</h1>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
            ti invita come allievo
          </p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#666', fontSize: '15px', marginBottom: '24px', lineHeight: '1.6' }}>
            Accettando, il tuo maestro potrà inviarti piani di allenamento personalizzati, video tecnici e valutazioni.
          </p>
          <button
            onClick={connectNow}
            disabled={connecting}
            style={{
              width: '100%', padding: '18px',
              background: connecting ? '#94A3B8' : 'linear-gradient(135deg, #059669, #047857)',
              color: '#fff', border: 'none', borderRadius: '16px',
              fontSize: '17px', fontWeight: 700, cursor: connecting ? 'wait' : 'pointer'
            }}
          >
            {connecting ? 'Connessione...' : '✅ Collegati con ' + coachName}
          </button>
        </div>
      </div>
    );
  }

  // Non loggato — deve registrarsi
  return (
    <div style={{ minHeight: '100vh', background: '#fff', paddingBottom: '40px' }}>
      <div style={{
        background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #064E3B 100%)',
        padding: '72px 24px 48px',
        textAlign: 'center',
        borderRadius: '0 0 32px 32px'
      }}>
        <span style={{ fontSize: '72px', display: 'block', marginBottom: '16px' }}>👨‍🏫</span>
        <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 900, marginBottom: '8px' }}>{coachName}</h1>
        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
          ti invita su MyPadelog
        </p>
      </div>

      <div style={{ padding: '32px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
          {[
            { icon: '📋', title: 'Piani personalizzati', desc: 'Ricevi programmi dal tuo maestro' },
            { icon: '🎥', title: 'Video tecnici', desc: 'Accedi alla videoteca del coach' },
            { icon: '📊', title: 'Valutazioni', desc: 'Monitora i tuoi progressi' },
            { icon: '🎾', title: 'Organizza partite', desc: 'Gioca con amici e registra risultati' },
          ].map((f, i) => (
            <div key={i} style={{
              display: 'flex', gap: '16px', alignItems: 'center',
              padding: '16px', background: '#F0FDF4', borderRadius: '16px'
            }}>
              <span style={{ fontSize: '28px', width: '40px', textAlign: 'center' }}>{f.icon}</span>
              <div>
                <p style={{ fontWeight: 700, color: '#111', fontSize: '15px' }}>{f.title}</p>
                <p style={{ color: '#666', fontSize: '13px' }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <Link
          href="/register"
          onClick={handleRegisterClick}
          style={{
            display: 'block', width: '100%', padding: '18px',
            background: 'linear-gradient(135deg, #059669, #047857)',
            color: '#fff', border: 'none', borderRadius: '16px',
            fontSize: '18px', fontWeight: 800, textAlign: 'center',
            textDecoration: 'none', boxShadow: '0 8px 32px rgba(5,150,105,0.3)'
          }}
        >
          Registrati gratis 🎾
        </Link>

        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px', color: '#666' }}>
          Hai già un account?{' '}
          <Link
            href="/login"
            onClick={handleRegisterClick}
            style={{ color: '#059669', fontWeight: 600, textDecoration: 'none' }}
          >
            Accedi
          </Link>
        </p>
      </div>
    </div>
  );
}
