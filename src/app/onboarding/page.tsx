'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [choice, setChoice] = useState<'create' | 'join' | null>(null);
  const [leagueName, setLeagueName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [createdLeague, setCreatedLeague] = useState<{ id: string; code: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setUserId(user.id);

    // Se ha già un nome, salta step 1
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, onboarding_completed')
      .eq('id', user.id)
      .single();

    if (profile?.onboarding_completed) {
      router.push('/dashboard');
      return;
    }

    if (profile?.full_name) {
      setName(profile.full_name);
      setStep(2);
    }
  };

  const saveNameAndContinue = async () => {
    if (!name.trim()) return;
    setLoading(true);

    await supabase
      .from('profiles')
      .update({ full_name: name.trim() })
      .eq('id', userId);

    setLoading(false);
    setStep(2);
  };

  const createLeague = async () => {
    if (!leagueName.trim()) return;
    setLoading(true);
    setError('');

    // Genera codice
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data: league, error: err } = await supabase
      .from('leagues')
      .insert({
        name: leagueName.trim(),
        code,
        created_by: userId
      })
      .select()
      .single();

    if (err) {
      setError('Errore nella creazione');
      setLoading(false);
      return;
    }

    // Aggiungi come membro
    await supabase.from('league_members').insert({
      league_id: league.id,
      user_id: userId
    });

    setCreatedLeague({ id: league.id, code: league.code, name: league.name });
    setLoading(false);
    setStep(3);
  };

  const joinLeague = async () => {
    if (!joinCode.trim()) return;
    setLoading(true);
    setError('');

    const { data: league } = await supabase
      .from('leagues')
      .select('id, name, code')
      .eq('code', joinCode.toUpperCase())
      .single();

    if (!league) {
      setError('Codice non trovato');
      setLoading(false);
      return;
    }

    // Controlla se già membro
    const { data: existing } = await supabase
      .from('league_members')
      .select('id')
      .eq('league_id', league.id)
      .eq('user_id', userId)
      .single();

    if (!existing) {
      await supabase.from('league_members').insert({
        league_id: league.id,
        user_id: userId
      });
    }

    setCreatedLeague({ id: league.id, code: league.code, name: league.name });
    setLoading(false);
    setStep(3);
  };

  const shareWhatsApp = () => {
    if (!createdLeague) return;
    const text = `🎾 Unisciti alla mia lega "${createdLeague.name}" su MyPadelog!\n\nCodice: ${createdLeague.code}\n\n👉 Scarica l'app e inserisci il codice!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const completeOnboarding = async () => {
    await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', userId);

    router.push('/dashboard');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0E5E4A 0%, #0A4A3A 100%)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Progress */}
      <div style={{ padding: '60px 24px 20px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '40px' }}>
          {[1, 2, 3].map(s => (
            <div
              key={s}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                background: s <= step ? '#fff' : 'rgba(255,255,255,0.3)'
              }}
            />
          ))}
        </div>

        {/* Step 1: Nome */}
        {step === 1 && (
          <div>
            <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>
              Ciao! 👋
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px', marginBottom: '32px' }}>
              Come ti chiami?
            </p>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Il tuo nome"
              autoFocus
              style={{
                width: '100%',
                padding: '18px 20px',
                fontSize: '18px',
                border: 'none',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.15)',
                color: '#fff',
                outline: 'none',
                marginBottom: '20px'
              }}
            />

            <button
              onClick={saveNameAndContinue}
              disabled={!name.trim() || loading}
              style={{
                width: '100%',
                padding: '18px',
                background: name.trim() ? '#fff' : 'rgba(255,255,255,0.3)',
                color: name.trim() ? '#0E5E4A' : 'rgba(255,255,255,0.5)',
                border: 'none',
                borderRadius: '16px',
                fontSize: '17px',
                fontWeight: 700,
                cursor: name.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              {loading ? 'Salvataggio...' : 'Continua →'}
            </button>
          </div>
        )}

        {/* Step 2: Crea o Unisciti */}
        {step === 2 && (
          <div>
            <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>
              Benvenuto {name.split(' ')[0]}! 🎾
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px', marginBottom: '32px' }}>
              Crea la tua lega o unisciti a una esistente
            </p>

            {!choice ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  onClick={() => setChoice('create')}
                  style={{
                    width: '100%',
                    padding: '24px 20px',
                    background: 'rgba(255,255,255,0.15)',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <p style={{ fontSize: '20px', marginBottom: '4px' }}>🏆</p>
                  <p style={{ color: '#fff', fontSize: '17px', fontWeight: 700 }}>Crea una nuova lega</p>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>Invita i tuoi amici a giocare</p>
                </button>

                <button
                  onClick={() => setChoice('join')}
                  style={{
                    width: '100%',
                    padding: '24px 20px',
                    background: 'rgba(255,255,255,0.15)',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <p style={{ fontSize: '20px', marginBottom: '4px' }}>🔗</p>
                  <p style={{ color: '#fff', fontSize: '17px', fontWeight: 700 }}>Ho un codice invito</p>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>Unisciti a una lega esistente</p>
                </button>
              </div>
            ) : choice === 'create' ? (
              <div>
                <input
                  type="text"
                  value={leagueName}
                  onChange={(e) => setLeagueName(e.target.value)}
                  placeholder="Nome della lega (es: Amici Padel)"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '18px 20px',
                    fontSize: '17px',
                    border: 'none',
                    borderRadius: '16px',
                    background: 'rgba(255,255,255,0.15)',
                    color: '#fff',
                    outline: 'none',
                    marginBottom: '16px'
                  }}
                />

                {error && (
                  <p style={{ color: '#FCA5A5', fontSize: '14px', marginBottom: '12px' }}>{error}</p>
                )}

                <button
                  onClick={createLeague}
                  disabled={!leagueName.trim() || loading}
                  style={{
                    width: '100%',
                    padding: '18px',
                    background: leagueName.trim() ? '#fff' : 'rgba(255,255,255,0.3)',
                    color: leagueName.trim() ? '#0E5E4A' : 'rgba(255,255,255,0.5)',
                    border: 'none',
                    borderRadius: '16px',
                    fontSize: '17px',
                    fontWeight: 700,
                    cursor: leagueName.trim() ? 'pointer' : 'not-allowed',
                    marginBottom: '12px'
                  }}
                >
                  {loading ? 'Creazione...' : 'Crea lega →'}
                </button>

                <button
                  onClick={() => { setChoice(null); setError(''); }}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: 'transparent',
                    color: 'rgba(255,255,255,0.7)',
                    border: 'none',
                    fontSize: '15px',
                    cursor: 'pointer'
                  }}
                >
                  ← Indietro
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Codice invito"
                  maxLength={6}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '18px 20px',
                    fontSize: '24px',
                    border: 'none',
                    borderRadius: '16px',
                    background: 'rgba(255,255,255,0.15)',
                    color: '#fff',
                    outline: 'none',
                    textAlign: 'center',
                    fontFamily: 'monospace',
                    letterSpacing: '6px',
                    marginBottom: '16px'
                  }}
                />

                {error && (
                  <p style={{ color: '#FCA5A5', fontSize: '14px', marginBottom: '12px', textAlign: 'center' }}>{error}</p>
                )}

                <button
                  onClick={joinLeague}
                  disabled={joinCode.length < 4 || loading}
                  style={{
                    width: '100%',
                    padding: '18px',
                    background: joinCode.length >= 4 ? '#fff' : 'rgba(255,255,255,0.3)',
                    color: joinCode.length >= 4 ? '#0E5E4A' : 'rgba(255,255,255,0.5)',
                    border: 'none',
                    borderRadius: '16px',
                    fontSize: '17px',
                    fontWeight: 700,
                    cursor: joinCode.length >= 4 ? 'pointer' : 'not-allowed',
                    marginBottom: '12px'
                  }}
                >
                  {loading ? 'Verifica...' : 'Unisciti →'}
                </button>

                <button
                  onClick={() => { setChoice(null); setError(''); }}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: 'transparent',
                    color: 'rgba(255,255,255,0.7)',
                    border: 'none',
                    fontSize: '15px',
                    cursor: 'pointer'
                  }}
                >
                  ← Indietro
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Invita amici */}
        {step === 3 && createdLeague && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <p style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</p>
              <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
                Perfetto!
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px' }}>
                Sei nella lega "{createdLeague.name}"
              </p>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '20px',
              padding: '24px',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '8px' }}>
                Il tuo codice lega
              </p>
              <p style={{
                color: '#fff',
                fontSize: '32px',
                fontWeight: 800,
                fontFamily: 'monospace',
                letterSpacing: '6px'
              }}>
                {createdLeague.code}
              </p>
            </div>

            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '15px', textAlign: 'center', marginBottom: '20px' }}>
              Invita almeno 2 amici per iniziare a giocare! 🎾
            </p>

            <button
              onClick={shareWhatsApp}
              style={{
                width: '100%',
                padding: '18px',
                background: '#25D366',
                color: '#fff',
                border: 'none',
                borderRadius: '16px',
                fontSize: '17px',
                fontWeight: 700,
                cursor: 'pointer',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              📲 Invita su WhatsApp
            </button>

            <button
              onClick={completeOnboarding}
              style={{
                width: '100%',
                padding: '18px',
                background: '#fff',
                color: '#0E5E4A',
                border: 'none',
                borderRadius: '16px',
                fontSize: '17px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Vai alla Dashboard →
            </button>

            <button
              onClick={completeOnboarding}
              style={{
                width: '100%',
                padding: '14px',
                background: 'transparent',
                color: 'rgba(255,255,255,0.6)',
                border: 'none',
                fontSize: '14px',
                cursor: 'pointer',
                marginTop: '8px'
              }}
            >
              Inviterò dopo
            </button>
          </div>
        )}
      </div>

      {/* Footer branding */}
      <div style={{ marginTop: 'auto', padding: '20px', textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
          MyPadelog
        </p>
      </div>
    </div>
  );
}
