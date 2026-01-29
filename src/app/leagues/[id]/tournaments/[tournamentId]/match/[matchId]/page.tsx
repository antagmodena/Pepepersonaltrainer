'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TournamentMatchPage({ params }: { params: Promise<{ id: string; tournamentId: string; matchId: string }> }) {
  const { id: leagueId, tournamentId, matchId } = use(params);
  const [match, setMatch] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [score1, setScore1] = useState('');
  const [score2, setScore2] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: matchData } = await supabase
      .from('tournament_matches')
      .select('*')
      .eq('id', matchId)
      .single();
    setMatch(matchData);

    if (matchData) {
      setScore1(matchData.score_team1 || '');
      setScore2(matchData.score_team2 || '');
    }

    const { data: playersData } = await supabase
      .from('tournament_players')
      .select('*, profile:profiles(full_name)')
      .eq('tournament_id', tournamentId);
    setPlayers(playersData || []);

    setLoading(false);
  };

  const getPlayerName = (id: string) => {
    const p = players.find((p: any) => p.user_id === id);
    return p?.profile?.full_name || 'Giocatore';
  };

  const getPlayer = (id: string) => players.find((p: any) => p.user_id === id);

  const handleSave = async () => {
    if (!score1 || !score2) return;
    setSaving(true);

    // Determina vincitore
    const parseScore = (s: string) => s.split(' ').reduce((acc, set) => {
      const parts = set.split('-');
      return acc + parseInt(parts[0] || '0');
    }, 0);
    const games1 = parseScore(score1);
    const games2 = parseScore(score2);
    const winnerTeam = games1 >= games2 ? 1 : 2;

    // Aggiorna partita
    await supabase.from('tournament_matches').update({
      score_team1: score1,
      score_team2: score2,
      winner_team: winnerTeam,
      status: 'completed',
      played_at: new Date().toISOString()
    }).eq('id', matchId);

    // Aggiorna punti giocatori
    const winners = winnerTeam === 1 
      ? [match.player1_id, match.player2_id] 
      : [match.player3_id, match.player4_id];
    const losers = winnerTeam === 1 
      ? [match.player3_id, match.player4_id] 
      : [match.player1_id, match.player2_id];

    for (const playerId of winners) {
      const player = getPlayer(playerId);
      if (player) {
        await supabase.from('tournament_players').update({
          points: player.points + 3,
          wins: player.wins + 1
        }).eq('tournament_id', tournamentId).eq('user_id', playerId);
      }
    }

    for (const playerId of losers) {
      const player = getPlayer(playerId);
      if (player) {
        await supabase.from('tournament_players').update({
          points: player.points + 1,
          losses: player.losses + 1
        }).eq('tournament_id', tournamentId).eq('user_id', playerId);
      }
    }

    // Controlla se torneo completato
    const { count: pendingCount } = await supabase
      .from('tournament_matches')
      .select('*', { count: 'exact', head: true })
      .eq('tournament_id', tournamentId)
      .eq('status', 'pending');

    if (pendingCount === 0) {
      await supabase.from('tournaments').update({ status: 'completed' }).eq('id', tournamentId);
    }

    router.push(`/leagues/${leagueId}/tournaments/${tournamentId}`);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <p style={{ color: '#94A3B8' }}>Caricamento...</p>
      </div>
    );
  }

  const isCompleted = match?.status === 'completed';

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
        <Link href={`/leagues/${leagueId}/tournaments/${tournamentId}`} style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
          ← Torneo
        </Link>
        <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 800, marginTop: '8px' }}>
          🎾 Partita #{match?.match_number}
        </h1>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Coppie */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '12px', color: '#3B82F6', fontWeight: 600, marginBottom: '8px' }}>🔵 COPPIA 1</p>
            <p style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a2e' }}>
              {getPlayerName(match?.player1_id)} + {getPlayerName(match?.player2_id)}
            </p>
          </div>
          <div style={{ textAlign: 'center', margin: '16px 0' }}>
            <span style={{ fontSize: '20px', fontWeight: 800, color: '#94A3B8' }}>VS</span>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#EF4444', fontWeight: 600, marginBottom: '8px' }}>🔴 COPPIA 2</p>
            <p style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a2e' }}>
              {getPlayerName(match?.player3_id)} + {getPlayerName(match?.player4_id)}
            </p>
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
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#3B82F6', fontWeight: 600, marginBottom: '6px' }}>Coppia 1</p>
              <input
                type="text"
                value={score1}
                onChange={(e) => setScore1(e.target.value)}
                placeholder="6-4 6-3"
                disabled={isCompleted}
                style={{
                  width: '110px',
                  padding: '14px',
                  fontSize: '16px',
                  fontWeight: 700,
                  textAlign: 'center',
                  border: '2px solid #3B82F6',
                  borderRadius: '12px',
                  background: isCompleted ? '#F1F5F9' : '#EFF6FF'
                }}
              />
            </div>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#94A3B8', marginTop: '20px' }}>-</span>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#EF4444', fontWeight: 600, marginBottom: '6px' }}>Coppia 2</p>
              <input
                type="text"
                value={score2}
                onChange={(e) => setScore2(e.target.value)}
                placeholder="4-6 3-6"
                disabled={isCompleted}
                style={{
                  width: '110px',
                  padding: '14px',
                  fontSize: '16px',
                  fontWeight: 700,
                  textAlign: 'center',
                  border: '2px solid #EF4444',
                  borderRadius: '12px',
                  background: isCompleted ? '#F1F5F9' : '#FEF2F2'
                }}
              />
            </div>
          </div>
        </div>

        {/* Save */}
        {!isCompleted && (
          <button
            onClick={handleSave}
            disabled={saving || !score1 || !score2}
            style={{
              width: '100%',
              padding: '18px',
              background: (!score1 || !score2) ? '#E2E8F0' : 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
              color: (!score1 || !score2) ? '#94A3B8' : '#fff',
              border: 'none',
              borderRadius: '14px',
              fontSize: '17px',
              fontWeight: 700,
              cursor: (!score1 || !score2) ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? 'Salvataggio...' : '🏆 Registra Risultato'}
          </button>
        )}

        {isCompleted && (
          <div style={{
            background: '#DCFCE7',
            padding: '16px',
            borderRadius: '16px',
            textAlign: 'center'
          }}>
            <p style={{ color: '#16A34A', fontWeight: 600 }}>
              ✅ Partita completata - {match?.winner_team === 1 ? 'Coppia 1' : 'Coppia 2'} ha vinto!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
