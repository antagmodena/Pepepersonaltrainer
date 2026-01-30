'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function QuickMatchPage() {
  const [step, setStep] = useState(1);
  const [myPartner, setMyPartner] = useState('');
  const [opponent1, setOpponent1] = useState('');
  const [opponent2, setOpponent2] = useState('');
  const [score, setScore] = useState({ team1: [0, 0, 0], team2: [0, 0, 0] });
  const [sets, setSets] = useState(2);
  const [winner, setWinner] = useState<1 | 2 | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const updateScore = (team: 1 | 2, setIndex: number, delta: number) => {
    setScore(prev => {
      const key = team === 1 ? 'team1' : 'team2';
      const newScores = [...prev[key]];
      newScores[setIndex] = Math.max(0, Math.min(7, newScores[setIndex] + delta));
      return { ...prev, [key]: newScores };
    });
  };

  const calculateWinner = () => {
    let team1Sets = 0;
    let team2Sets = 0;
    for (let i = 0; i < sets; i++) {
      if (score.team1[i] > score.team2[i]) team1Sets++;
      else if (score.team2[i] > score.team1[i]) team2Sets++;
    }
    return team1Sets > team2Sets ? 1 : team2Sets > team1Sets ? 2 : null;
  };

  const saveMatch = async () => {
    const calculatedWinner = calculateWinner();
    if (!calculatedWinner) {
      alert('Il punteggio deve avere un vincitore!');
      return;
    }

    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Salva come partita "quick" senza league_id
    const scoreTeam1 = score.team1.slice(0, sets).join('-');
    const scoreTeam2 = score.team2.slice(0, sets).join('-');

    await supabase.from('quick_matches').insert({
      user_id: user.id,
      my_partner_name: myPartner.trim() || null,
      opponent1_name: opponent1.trim(),
      opponent2_name: opponent2.trim() || null,
      score_team1: scoreTeam1,
      score_team2: scoreTeam2,
      winner_team: calculatedWinner,
      played_at: new Date().toISOString()
    });

    setSaving(false);
    setSaved(true);
  };

  if (saved) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0E5E4A 0%, #0A4A3A 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '64px', marginBottom: '20px' }}>🎉</p>
        <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>
          Partita salvata!
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '15px', marginBottom: '32px' }}>
          {winner === 1 ? 'Hai vinto! 🏆' : 'Peccato, la prossima!'}
        </p>

        <button
          onClick={() => router.push('/dashboard')}
          style={{
            padding: '16px 40px',
            background: '#fff',
            color: '#0E5E4A',
            border: 'none',
            borderRadius: '14px',
            fontSize: '16px',
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: '12px'
          }}
        >
          Torna alla Home
        </button>

        <button
          onClick={() => {
            setSaved(false);
            setStep(1);
            setMyPartner('');
            setOpponent1('');
            setOpponent2('');
            setScore({ team1: [0, 0, 0], team2: [0, 0, 0] });
            setWinner(null);
          }}
          style={{
            padding: '14px 40px',
            background: 'rgba(255,255,255,0.2)',
            color: '#fff',
            border: 'none',
            borderRadius: '14px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Registra un'altra
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF7', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0E5E4A 0%, #0A4A3A 100%)',
        padding: '48px 24px 32px',
        borderRadius: '0 0 32px 32px'
      }}>
        <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '14px' }}>
          ← Home
        </Link>
        <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 800, marginTop: '8px' }}>
          🎾 Partita Veloce
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginTop: '4px' }}>
          Registra senza lega
        </p>
      </div>

      <div style={{ padding: '20px' }}>
        {/* Step 1: Giocatori */}
        {step === 1 && (
          <div style={{ background: '#fff', borderRadius: '20px', padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111', marginBottom: '20px' }}>
              Chi ha giocato?
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#666', marginBottom: '8px' }}>
                🟢 LA TUA SQUADRA
              </p>
              <p style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>Tu + compagno (opzionale)</p>
              <input
                type="text"
                value={myPartner}
                onChange={(e) => setMyPartner(e.target.value)}
                placeholder="Nome compagno (lascia vuoto se singolo)"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '15px',
                  border: '2px solid #E5E5E5',
                  borderRadius: '12px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#666', marginBottom: '8px' }}>
                🔴 AVVERSARI
              </p>
              <input
                type="text"
                value={opponent1}
                onChange={(e) => setOpponent1(e.target.value)}
                placeholder="Avversario 1 *"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '15px',
                  border: '2px solid #E5E5E5',
                  borderRadius: '12px',
                  outline: 'none',
                  marginBottom: '10px'
                }}
              />
              <input
                type="text"
                value={opponent2}
                onChange={(e) => setOpponent2(e.target.value)}
                placeholder="Avversario 2 (opzionale)"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '15px',
                  border: '2px solid #E5E5E5',
                  borderRadius: '12px',
                  outline: 'none'
                }}
              />
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!opponent1.trim()}
              style={{
                width: '100%',
                padding: '16px',
                background: opponent1.trim() ? '#0E5E4A' : '#E5E5E5',
                color: opponent1.trim() ? '#fff' : '#999',
                border: 'none',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: 700,
                cursor: opponent1.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              Continua →
            </button>
          </div>
        )}

        {/* Step 2: Punteggio */}
        {step === 2 && (
          <div style={{ background: '#fff', borderRadius: '20px', padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111', marginBottom: '20px' }}>
              Punteggio
            </h2>

            {/* Set selector */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', justifyContent: 'center' }}>
              {[2, 3].map(s => (
                <button
                  key={s}
                  onClick={() => setSets(s)}
                  style={{
                    padding: '10px 24px',
                    background: sets === s ? '#0E5E4A' : '#F5F5F3',
                    color: sets === s ? '#fff' : '#666',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {s} set
                </button>
              ))}
            </div>

            {/* Score inputs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              {Array.from({ length: sets }).map((_, setIndex) => (
                <div key={setIndex} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <p style={{ width: '50px', fontSize: '13px', color: '#666', fontWeight: 600 }}>
                    Set {setIndex + 1}
                  </p>
                  
                  {/* Team 1 */}
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <button
                      onClick={() => updateScore(1, setIndex, -1)}
                      style={{ width: '36px', height: '36px', background: '#F5F5F3', border: 'none', borderRadius: '8px', fontSize: '18px', cursor: 'pointer' }}
                    >
                      -
                    </button>
                    <span style={{ width: '40px', textAlign: 'center', fontSize: '24px', fontWeight: 700, color: '#0E5E4A' }}>
                      {score.team1[setIndex]}
                    </span>
                    <button
                      onClick={() => updateScore(1, setIndex, 1)}
                      style={{ width: '36px', height: '36px', background: '#E8F5E9', border: 'none', borderRadius: '8px', fontSize: '18px', cursor: 'pointer' }}
                    >
                      +
                    </button>
                  </div>

                  <span style={{ color: '#999' }}>-</span>

                  {/* Team 2 */}
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <button
                      onClick={() => updateScore(2, setIndex, -1)}
                      style={{ width: '36px', height: '36px', background: '#F5F5F3', border: 'none', borderRadius: '8px', fontSize: '18px', cursor: 'pointer' }}
                    >
                      -
                    </button>
                    <span style={{ width: '40px', textAlign: 'center', fontSize: '24px', fontWeight: 700, color: '#DC2626' }}>
                      {score.team2[setIndex]}
                    </span>
                    <button
                      onClick={() => updateScore(2, setIndex, 1)}
                      style={{ width: '36px', height: '36px', background: '#FEE2E2', border: 'none', borderRadius: '8px', fontSize: '18px', cursor: 'pointer' }}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Preview */}
            <div style={{ background: '#F5F5F3', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: calculateWinner() === 1 ? '#0E5E4A' : '#666' }}>
                    {calculateWinner() === 1 && '🏆 '}Tu{myPartner ? ` + ${myPartner}` : ''}
                  </p>
                </div>
                <p style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                  {score.team1.slice(0, sets).join('-')}
                </p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: calculateWinner() === 2 ? '#DC2626' : '#666' }}>
                    {calculateWinner() === 2 && '🏆 '}{opponent1}{opponent2 ? ` + ${opponent2}` : ''}
                  </p>
                </div>
                <p style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                  {score.team2.slice(0, sets).join('-')}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: '#F5F5F3',
                  color: '#666',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                ← Indietro
              </button>
              <button
                onClick={saveMatch}
                disabled={!calculateWinner() || saving}
                style={{
                  flex: 2,
                  padding: '16px',
                  background: calculateWinner() ? '#0E5E4A' : '#E5E5E5',
                  color: calculateWinner() ? '#fff' : '#999',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: calculateWinner() ? 'pointer' : 'not-allowed'
                }}
              >
                {saving ? 'Salvataggio...' : '✓ Salva partita'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
