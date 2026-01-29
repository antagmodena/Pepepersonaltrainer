'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Member {
  user_id: string;
  handicap: number;
  profile: { full_name: string } | null;
}

export default function NewMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: leagueId } = use(params);
  const [members, setMembers] = useState<Member[]>([]);
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');
  const [player3, setPlayer3] = useState('');
  const [player4, setPlayer4] = useState('');
  const [score1, setScore1] = useState('');
  const [score2, setScore2] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { loadMembers(); }, []);

  const loadMembers = async () => {
    const { data } = await supabase
      .from('league_members')
      .select('user_id, handicap, profile:profiles(full_name)')
      .eq('league_id', leagueId);
    
    const formatted = (data || []).map((d: any) => ({
      user_id: d.user_id,
      handicap: d.handicap,
      profile: d.profile
    }));
    setMembers(formatted);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!player1 || !player2 || !player3 || !player4 || !score1 || !score2) return;
    if (new Set([player1, player2, player3, player4]).size !== 4) {
      alert('Seleziona 4 giocatori diversi!');
      return;
    }
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Determina il vincitore
    const parseScore = (s: string) => {
      return s.split(' ').reduce((acc, set) => {
        const parts = set.split('-');
        return acc + parseInt(parts[0] || '0');
      }, 0);
    };
    const games1 = parseScore(score1);
    const games2 = parseScore(score2);
    const winnerTeam = games1 >= games2 ? 1 : 2;

    // Calcola handicap coppie
    const hc1 = (members.find(m => m.user_id === player1)?.handicap || 10) + 
                (members.find(m => m.user_id === player2)?.handicap || 10);
    const hc2 = (members.find(m => m.user_id === player3)?.handicap || 10) + 
                (members.find(m => m.user_id === player4)?.handicap || 10);

    // Calcola punti
    const diff = Math.abs(hc1 - hc2);
    let pointsWinner = 3;
    let pointsLoser = 1;

    if (diff >= 5) {
      if ((winnerTeam === 1 && hc1 > hc2) || (winnerTeam === 2 && hc2 > hc1)) {
        pointsWinner = 5;
        pointsLoser = 1;
      } else {
        pointsWinner = 2;
        pointsLoser = 0;
      }
    }

    // Registra partita
    const { error } = await supabase.from('matches').insert({
      league_id: leagueId,
      player1_id: player1,
      player2_id: player2,
      player3_id: player3,
      player4_id: player4,
      score_team1: score1,
      score_team2: score2,
      winner_team: winnerTeam,
      registered_by: user.id
    });

    if (error) {
      alert('Errore: ' + error.message);
      setSaving(false);
      return;
    }

    // Aggiorna punti
    const winners = winnerTeam === 1 ? [player1, player2] : [player3, player4];
    const losers = winnerTeam === 1 ? [player3, player4] : [player1, player2];

    for (const playerId of winners) {
      await supabase
        .from('league_members')
        .update({ 
          points: (members.find(m => m.user_id === playerId)?.handicap || 0) + pointsWinner,
          wins: 1 
        })
        .eq('league_id', leagueId)
        .eq('user_id', playerId);
    }

    for (const playerId of losers) {
      await supabase
        .from('league_members')  
        .update({ 
          points: (members.find(m => m.user_id === playerId)?.handicap || 0) + pointsLoser,
          losses: 1 
        })
        .eq('league_id', leagueId)
        .eq('user_id', playerId);
    }

    router.push(`/leagues/${leagueId}`);
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    fontSize: '15px',
    border: '2px solid #E2E8F0',
    borderRadius: '12px',
    background: '#fff',
    cursor: 'pointer'
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <p style={{ color: '#94A3B8' }}>Caricamento...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
      paddingBottom: '100px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
        padding: '48px 24px 32px',
        borderRadius: '0 0 32px 32px',
        marginBottom: '24px'
      }}>
        <Link href={`/leagues/${leagueId}`} style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
          ← Annulla
        </Link>
        <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>
          🎾 Nuova Partita
        </h1>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Team 1 */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '16px' }}>
            🔵 Coppia 1
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <select value={player1} onChange={(e) => setPlayer1(e.target.value)} style={selectStyle}>
              <option value="">Giocatore 1...</option>
              {members.map(m => (
                <option key={m.user_id} value={m.user_id} disabled={[player2, player3, player4].includes(m.user_id)}>
                  {m.profile?.full_name || 'Giocatore'} (HC {m.handicap})
                </option>
              ))}
            </select>
            <select value={player2} onChange={(e) => setPlayer2(e.target.value)} style={selectStyle}>
              <option value="">Giocatore 2...</option>
              {members.map(m => (
                <option key={m.user_id} value={m.user_id} disabled={[player1, player3, player4].includes(m.user_id)}>
                  {m.profile?.full_name || 'Giocatore'} (HC {m.handicap})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* VS */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '24px', fontWeight: 800, color: '#94A3B8' }}>VS</span>
        </div>

        {/* Team 2 */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '16px' }}>
            🔴 Coppia 2
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <select value={player3} onChange={(e) => setPlayer3(e.target.value)} style={selectStyle}>
              <option value="">Giocatore 3...</option>
              {members.map(m => (
                <option key={m.user_id} value={m.user_id} disabled={[player1, player2, player4].includes(m.user_id)}>
                  {m.profile?.full_name || 'Giocatore'} (HC {m.handicap})
                </option>
              ))}
            </select>
            <select value={player4} onChange={(e) => setPlayer4(e.target.value)} style={selectStyle}>
              <option value="">Giocatore 4...</option>
              {members.map(m => (
                <option key={m.user_id} value={m.user_id} disabled={[player1, player2, player3].includes(m.user_id)}>
                  {m.profile?.full_name || 'Giocatore'} (HC {m.handicap})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Risultato */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '16px' }}>
            📊 Risultato
          </h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'center' }}>
            <input
              type="text"
              value={score1}
              onChange={(e) => setScore1(e.target.value)}
              placeholder="6-4 6-3"
              style={{
                width: '120px',
                padding: '16px',
                fontSize: '18px',
                fontWeight: 700,
                textAlign: 'center',
                border: '2px solid #3B82F6',
                borderRadius: '12px',
                background: '#EFF6FF'
              }}
            />
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#94A3B8' }}>-</span>
            <input
              type="text"
              value={score2}
              onChange={(e) => setScore2(e.target.value)}
              placeholder="4-6 3-6"
              style={{
                width: '120px',
                padding: '16px',
                fontSize: '18px',
                fontWeight: 700,
                textAlign: 'center',
                border: '2px solid #EF4444',
                borderRadius: '12px',
                background: '#FEF2F2'
              }}
            />
          </div>
          <p style={{ fontSize: '12px', color: '#94A3B8', textAlign: 'center', marginTop: '12px' }}>
            Es: "6-4 6-3" o "6-4 4-6 10-8"
          </p>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving || !player1 || !player2 || !player3 || !player4 || !score1 || !score2}
          style={{
            width: '100%',
            padding: '18px',
            background: (!player1 || !player2 || !player3 || !player4 || !score1 || !score2) ? '#E2E8F0' : 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
            color: (!player1 || !player2 || !player3 || !player4 || !score1 || !score2) ? '#94A3B8' : '#fff',
            border: 'none',
            borderRadius: '14px',
            fontSize: '17px',
            fontWeight: 700,
            cursor: (!player1 || !player2 || !player3 || !player4 || !score1 || !score2) ? 'not-allowed' : 'pointer',
            boxShadow: (!player1 || !player2 || !player3 || !player4 || !score1 || !score2) ? 'none' : '0 8px 32px rgba(34, 197, 94, 0.3)'
          }}
        >
          {saving ? 'Salvataggio...' : '🏆 Registra Partita'}
        </button>
      </div>
    </div>
  );
}
