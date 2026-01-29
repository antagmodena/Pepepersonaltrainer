'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Player {
  user_id: string;
  points: number;
  wins: number;
  losses: number;
  profile: { full_name: string } | null;
}

interface Match {
  id: string;
  match_number: number;
  player1_id: string;
  player2_id: string;
  player3_id: string;
  player4_id: string;
  score_team1: string | null;
  score_team2: string | null;
  winner_team: number | null;
  status: string;
}

export default function TournamentDetailPage({ params }: { params: Promise<{ id: string; tournamentId: string }> }) {
  const { id: leagueId, tournamentId } = use(params);
  const [tournament, setTournament] = useState<any>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [leagueMembers, setLeagueMembers] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [generating, setGenerating] = useState(false);

  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);

    const { data: tournamentData } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();
    setTournament(tournamentData);

    const { data: playersData } = await supabase
      .from('tournament_players')
      .select('*, profile:profiles(full_name)')
      .eq('tournament_id', tournamentId)
      .order('points', { ascending: false });

    const formatted = (playersData || []).map((p: any) => ({
      user_id: p.user_id,
      points: p.points,
      wins: p.wins,
      losses: p.losses,
      profile: p.profile
    }));
    setPlayers(formatted);

    const { data: matchesData } = await supabase
      .from('tournament_matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('match_number');
    setMatches(matchesData || []);

    const { data: membersData } = await supabase
      .from('league_members')
      .select('user_id, profile:profiles(full_name)')
      .eq('league_id', leagueId);
    setLeagueMembers(membersData || []);

    setLoading(false);
  };

  const joinTournament = async () => {
    setJoining(true);
    await supabase.from('tournament_players').insert({
      tournament_id: tournamentId,
      user_id: currentUserId
    });
    loadData();
    setJoining(false);
  };

  const generateMatches = async () => {
    if (players.length < 4) {
      alert('Servono almeno 4 giocatori!');
      return;
    }
    setGenerating(true);

    // Genera tutte le combinazioni per Roulette
    const playerIds = players.map(p => p.user_id);
    const matches: { p1: string; p2: string; p3: string; p4: string }[] = [];

    // Algoritmo: ogni combinazione di 4 giocatori, con rotazione coppie
    for (let i = 0; i < playerIds.length; i++) {
      for (let j = i + 1; j < playerIds.length; j++) {
        for (let k = j + 1; k < playerIds.length; k++) {
          for (let l = k + 1; l < playerIds.length; l++) {
            const four = [playerIds[i], playerIds[j], playerIds[k], playerIds[l]];
            // 3 combinazioni di coppie per ogni gruppo di 4
            matches.push({ p1: four[0], p2: four[1], p3: four[2], p4: four[3] });
            matches.push({ p1: four[0], p2: four[2], p3: four[1], p4: four[3] });
            matches.push({ p1: four[0], p2: four[3], p3: four[1], p4: four[2] });
          }
        }
      }
    }

    // Se troppi giocatori, limita le partite (tutti vs tutti base)
    let finalMatches = matches;
    if (matches.length > 50) {
      // Versione semplificata: ogni giocatore gioca con ogni altro almeno una volta
      finalMatches = [];
      for (let i = 0; i < playerIds.length - 1; i += 2) {
        for (let j = 0; j < playerIds.length - 1; j += 2) {
          if (i !== j) {
            finalMatches.push({
              p1: playerIds[i],
              p2: playerIds[i + 1] || playerIds[0],
              p3: playerIds[j],
              p4: playerIds[j + 1] || playerIds[1]
            });
          }
        }
      }
    }

    // Inserisci partite
    for (let idx = 0; idx < finalMatches.length; idx++) {
      const m = finalMatches[idx];
      await supabase.from('tournament_matches').insert({
        tournament_id: tournamentId,
        match_number: idx + 1,
        player1_id: m.p1,
        player2_id: m.p2,
        player3_id: m.p3,
        player4_id: m.p4,
        status: 'pending'
      });
    }

    // Aggiorna stato torneo
    await supabase.from('tournaments').update({ status: 'active' }).eq('id', tournamentId);

    loadData();
    setGenerating(false);
  };

  const getPlayerName = (id: string) => {
    const p = players.find(p => p.user_id === id);
    return p?.profile?.full_name?.split(' ')[0] || '?';
  };

  const isJoined = players.some(p => p.user_id === currentUserId);

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
        background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
        padding: '48px 24px 32px',
        borderRadius: '0 0 32px 32px',
        marginBottom: '24px'
      }}>
        <Link href={`/leagues/${leagueId}/tournaments`} style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
          ← Tornei
        </Link>
        <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 800, marginTop: '8px' }}>
          {tournament?.type === 'roulette' ? '🎲' : '🏆'} {tournament?.name}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginTop: '4px' }}>
          {tournament?.status === 'open' ? '📝 Iscrizioni aperte' : 
           tournament?.status === 'active' ? '🎾 In corso' : '🏆 Completato'}
        </p>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Iscrizioni Aperte */}
        {tournament?.status === 'open' && (
          <>
            {!isJoined ? (
              <button
                onClick={joinTournament}
                disabled={joining}
                style={{
                  width: '100%',
                  padding: '18px',
                  background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '16px',
                  fontSize: '17px',
                  fontWeight: 700,
                  marginBottom: '16px',
                  cursor: 'pointer',
                  boxShadow: '0 8px 32px rgba(34, 197, 94, 0.3)'
                }}
              >
                {joining ? 'Iscrizione...' : '✋ Partecipa al Torneo'}
              </button>
            ) : (
              <div style={{
                background: '#DCFCE7',
                padding: '16px',
                borderRadius: '16px',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                <p style={{ color: '#16A34A', fontWeight: 600 }}>✅ Sei iscritto!</p>
              </div>
            )}

            {/* Genera partite (solo creatore) */}
            {tournament?.created_by === currentUserId && players.length >= 4 && (
              <button
                onClick={generateMatches}
                disabled={generating}
                style={{
                  width: '100%',
                  padding: '18px',
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '16px',
                  fontSize: '17px',
                  fontWeight: 700,
                  marginBottom: '16px',
                  cursor: 'pointer',
                  boxShadow: '0 8px 32px rgba(245, 158, 11, 0.3)'
                }}
              >
                {generating ? 'Generazione...' : `🎲 Chiudi Iscrizioni e Genera ${players.length} Partite`}
              </button>
            )}

            {/* Lista Iscritti */}
            <div style={{
              background: '#fff',
              borderRadius: '20px',
              padding: '20px',
              marginBottom: '16px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
            }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '16px' }}>
                👥 Iscritti ({players.length})
              </h2>
              {players.length < 4 && (
                <div style={{ background: '#FEF3C7', padding: '12px', borderRadius: '10px', marginBottom: '12px' }}>
                  <p style={{ fontSize: '13px', color: '#92400E' }}>⚠️ Servono almeno 4 giocatori per iniziare</p>
                </div>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {players.map(p => (
                  <div key={p.user_id} style={{
                    padding: '10px 16px',
                    background: p.user_id === currentUserId ? '#F5F3FF' : '#F1F5F9',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#1a1a2e'
                  }}>
                    {p.profile?.full_name || 'Giocatore'}
                    {p.user_id === currentUserId && ' (tu)'}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Torneo Attivo - Classifica */}
        {tournament?.status === 'active' && (
          <>
            <div style={{
              background: '#fff',
              borderRadius: '20px',
              padding: '20px',
              marginBottom: '16px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
            }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '16px' }}>
                🏆 Classifica
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {players.sort((a, b) => b.points - a.points).map((p, idx) => (
                  <div key={p.user_id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: p.user_id === currentUserId ? '#F5F3FF' : '#F8FAFC',
                    borderRadius: '12px'
                  }}>
                    <span style={{ fontWeight: 700, fontSize: '18px', color: idx === 0 ? '#F59E0B' : '#64748B', width: '24px' }}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                    </span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a2e' }}>{p.profile?.full_name}</p>
                      <p style={{ fontSize: '12px', color: '#64748B' }}>{p.wins}V {p.losses}S</p>
                    </div>
                    <p style={{ fontWeight: 800, fontSize: '20px', color: '#8B5CF6' }}>{p.points}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabellone Partite */}
            <div style={{
              background: '#fff',
              borderRadius: '20px',
              padding: '20px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
            }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '16px' }}>
                🎾 Partite ({matches.filter(m => m.status === 'completed').length}/{matches.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {matches.map(m => (
                  <Link key={m.id} href={`/leagues/${leagueId}/tournaments/${tournamentId}/match/${m.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      padding: '14px',
                      background: m.status === 'completed' ? '#F0FDF4' : '#FEF3C7',
                      borderRadius: '12px',
                      border: m.status === 'completed' ? '1px solid #BBF7D0' : '1px solid #FDE68A'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '4px' }}>Partita #{m.match_number}</p>
                          <p style={{ fontWeight: 600, fontSize: '14px', color: m.winner_team === 1 ? '#16A34A' : '#1a1a2e' }}>
                            {getPlayerName(m.player1_id)} + {getPlayerName(m.player2_id)}
                          </p>
                          <p style={{ fontWeight: 600, fontSize: '14px', color: m.winner_team === 2 ? '#16A34A' : '#1a1a2e' }}>
                            {getPlayerName(m.player3_id)} + {getPlayerName(m.player4_id)}
                          </p>
                        </div>
                        {m.status === 'completed' ? (
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontWeight: 700, color: '#1a1a2e' }}>{m.score_team1}</p>
                            <p style={{ fontWeight: 700, color: '#1a1a2e' }}>{m.score_team2}</p>
                          </div>
                        ) : (
                          <span style={{ color: '#D97706', fontWeight: 600, fontSize: '13px' }}>Da giocare →</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
