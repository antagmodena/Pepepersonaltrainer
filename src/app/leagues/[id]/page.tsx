'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Member {
  user_id: string;
  points: number;
  wins: number;
  losses: number;
  handicap: number;
  profile?: { full_name: string };
}

interface Match {
  id: string;
  player1_id: string;
  player2_id: string;
  player3_id: string;
  player4_id: string;
  score_team1: string;
  score_team2: string;
  winner_team: number;
  played_at: string;
  profiles1?: { full_name: string };
  profiles2?: { full_name: string };
  profiles3?: { full_name: string };
  profiles4?: { full_name: string };
}

export default function LeagueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [league, setLeague] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);

    // Lega
    const { data: leagueData } = await supabase
      .from('leagues')
      .select('*')
      .eq('id', id)
      .single();
    setLeague(leagueData);

    // Membri con profili
    const { data: membersData } = await supabase
      .from('league_members')
      .select('*, profile:profiles(full_name)')
      .eq('league_id', id)
      .order('points', { ascending: false });
    setMembers(membersData || []);

    // Partite
    const { data: matchesData } = await supabase
      .from('matches')
      .select(`
        *,
        profiles1:profiles!matches_player1_id_fkey(full_name),
        profiles2:profiles!matches_player2_id_fkey(full_name),
        profiles3:profiles!matches_player3_id_fkey(full_name),
        profiles4:profiles!matches_player4_id_fkey(full_name)
      `)
      .eq('league_id', id)
      .order('played_at', { ascending: false })
      .limit(10);
    setMatches(matchesData || []);

    setLoading(false);
  };

  const getPositionStyle = (index: number) => {
    if (index === 0) return { emoji: '🥇', color: '#F59E0B' };
    if (index === 1) return { emoji: '🥈', color: '#94A3B8' };
    if (index === 2) return { emoji: '🥉', color: '#CD7F32' };
    return { emoji: `${index + 1}`, color: '#64748B' };
  };

  const getFirstName = (fullName: string | undefined) => {
    return fullName?.split(' ')[0] || '?';
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
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
        padding: '48px 24px 32px',
        borderRadius: '0 0 32px 32px',
        marginBottom: '24px'
      }}>
        <Link href="/leagues" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
          ← Leghe
        </Link>
        <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 800, marginTop: '8px' }}>
          🎾 {league?.name}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginTop: '4px' }}>
          👥 {members.length} giocatori
        </p>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Codice Invito */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '8px' }}>Invita amici con il codice:</p>
          <p style={{
            fontSize: '32px',
            fontWeight: 800,
            color: '#F59E0B',
            fontFamily: 'monospace',
            letterSpacing: '6px',
            background: '#FEF3C7',
            padding: '12px 20px',
            borderRadius: '12px',
            display: 'inline-block'
          }}>
            {league?.code}
          </p>
        </div>

        {/* Nuova Partita */}
        <Link href={`/leagues/${id}/match/new`} style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
            borderRadius: '16px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '20px',
            boxShadow: '0 8px 32px rgba(34, 197, 94, 0.3)'
          }}>
            <span style={{ fontSize: '20px' }}>🎾</span>
            <span style={{ color: '#fff', fontSize: '16px', fontWeight: 700 }}>Registra Partita</span>
          </div>
        </Link>

        {/* Classifica */}
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
            {members.map((member, index) => {
              const pos = getPositionStyle(index);
              const isMe = member.user_id === currentUserId;
              return (
                <div
                  key={member.user_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 16px',
                    background: isMe ? '#FEF3C7' : '#F8FAFC',
                    borderRadius: '14px',
                    border: isMe ? '2px solid #F59E0B' : '2px solid transparent'
                  }}
                >
                  <span style={{ fontSize: index < 3 ? '24px' : '16px', width: '32px', textAlign: 'center', color: pos.color, fontWeight: 700 }}>
                    {pos.emoji}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: '15px', color: '#1a1a2e' }}>
                      {member.profile?.full_name || 'Giocatore'}
                      {isMe && <span style={{ color: '#F59E0B', marginLeft: '8px' }}>← Tu</span>}
                    </p>
                    <p style={{ fontSize: '12px', color: '#64748B' }}>
                      {member.wins}W - {member.losses}L • HC {member.handicap}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '20px', fontWeight: 800, color: pos.color }}>{member.points}</p>
                    <p style={{ fontSize: '10px', color: '#94A3B8' }}>PUNTI</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ultime Partite */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '16px' }}>
            📊 Ultime Partite
          </h2>
          {matches.length === 0 ? (
            <p style={{ color: '#94A3B8', textAlign: 'center', padding: '20px' }}>
              Nessuna partita ancora. Registra la prima! 🎾
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {matches.map(match => (
                <div
                  key={match.id}
                  style={{
                    padding: '14px',
                    background: '#F8FAFC',
                    borderRadius: '14px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{
                        fontWeight: match.winner_team === 1 ? 700 : 400,
                        fontSize: '14px',
                        color: match.winner_team === 1 ? '#16A34A' : '#64748B'
                      }}>
                        {match.winner_team === 1 && '🏆 '}
                        {getFirstName(match.profiles1?.full_name)} + {getFirstName(match.profiles2?.full_name)}
                      </p>
                    </div>
                    <div style={{ padding: '0 12px', textAlign: 'center' }}>
                      <p style={{ fontWeight: 700, fontSize: '16px', color: '#1a1a2e' }}>
                        {match.score_team1} - {match.score_team2}
                      </p>
                    </div>
                    <div style={{ flex: 1, textAlign: 'right' }}>
                      <p style={{
                        fontWeight: match.winner_team === 2 ? 700 : 400,
                        fontSize: '14px',
                        color: match.winner_team === 2 ? '#16A34A' : '#64748B'
                      }}>
                        {getFirstName(match.profiles3?.full_name)} + {getFirstName(match.profiles4?.full_name)}
                        {match.winner_team === 2 && ' 🏆'}
                      </p>
                    </div>
                  </div>
                  <p style={{ fontSize: '11px', color: '#94A3B8', textAlign: 'center', marginTop: '8px' }}>
                    {new Date(match.played_at).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
