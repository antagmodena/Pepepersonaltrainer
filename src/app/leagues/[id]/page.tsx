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
  profile: { full_name: string } | null;
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
}

interface LeagueEvent {
  id: string;
  event_date: string;
  event_time: string | null;
  location: string | null;
  status: string;
}

export default function LeagueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [league, setLeague] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [events, setEvents] = useState<LeagueEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);

    const { data: leagueData } = await supabase
      .from('leagues')
      .select('*')
      .eq('id', id)
      .single();
    setLeague(leagueData);

    const { data: membersData } = await supabase
      .from('league_members')
      .select('user_id, points, wins, losses, handicap, profile:profiles(full_name)')
      .eq('league_id', id)
      .order('points', { ascending: false });
    
    const formatted = (membersData || []).map((d: any) => ({
      user_id: d.user_id,
      points: d.points,
      wins: d.wins,
      losses: d.losses,
      handicap: d.handicap,
      profile: d.profile
    }));
    setMembers(formatted);

    const { data: matchesData } = await supabase
      .from('matches')
      .select('*')
      .eq('league_id', id)
      .order('played_at', { ascending: false })
      .limit(10);
    setMatches(matchesData || []);

    const { data: eventsData } = await supabase
      .from('league_events')
      .select('*')
      .eq('league_id', id)
      .eq('status', 'planned')
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date', { ascending: true })
      .limit(3);
    setEvents(eventsData || []);

    setLoading(false);
  };

  const copyCode = async () => {
    if (league?.code) {
      await navigator.clipboard.writeText(league.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareWhatsApp = () => {
    const text = `🎾 Unisciti alla mia lega "${league?.name}"!\n\nCodice: ${league?.code}\n\n👉 https://pepepersonaltrainer.vercel.app/leagues`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getPositionStyle = (index: number) => {
    if (index === 0) return { emoji: '🥇', color: '#F59E0B' };
    if (index === 1) return { emoji: '🥈', color: '#94A3B8' };
    if (index === 2) return { emoji: '🥉', color: '#CD7F32' };
    return { emoji: `${index + 1}`, color: '#64748B' };
  };

  const getPlayerName = (playerId: string) => {
    const member = members.find(m => m.user_id === playerId);
    return member?.profile?.full_name?.split(' ')[0] || '?';
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
          ← Le mie Leghe
        </Link>
        <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 800, marginTop: '8px' }}>
          {league?.name}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginTop: '4px' }}>
          👥 {members.length} giocatori • 🎾 {matches.length} partite
        </p>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Azione Principale - Registra Partita */}
        <Link href={`/leagues/${id}/match/new`} style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '12px',
            boxShadow: '0 8px 32px rgba(34, 197, 94, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px'
            }}>
              🎾
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#fff', fontSize: '17px', fontWeight: 700 }}>Registra Partita</p>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>Inserisci il risultato</p>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '24px' }}>→</span>
          </div>
        </Link>

        {/* Azione Secondaria - Pianifica */}
        <Link href={`/leagues/${id}/plan`} style={{ textDecoration: 'none' }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '16px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            border: '1px solid #E2E8F0'
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              background: '#EFF6FF',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              📅
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#1a1a2e', fontSize: '15px', fontWeight: 600 }}>Organizza partita</p>
              <p style={{ color: '#64748B', fontSize: '12px' }}>Fissa data e luogo</p>
            </div>
            <span style={{ color: '#CBD5E1', fontSize: '20px' }}>›</span>
          </div>
        </Link>

        {/* Prossimi Eventi */}
        {events.length > 0 && (
          <div style={{
            background: '#EFF6FF',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '16px',
            border: '1px solid #BFDBFE'
          }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#1D4ED8', marginBottom: '10px' }}>📅 Prossime partite</p>
            {events.map(event => (
              <div key={event.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 0',
                borderBottom: '1px solid #BFDBFE'
              }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a2e' }}>
                    {new Date(event.event_date).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {event.event_time && ` • ${event.event_time.slice(0,5)}`}
                  </p>
                  {event.location && <p style={{ fontSize: '12px', color: '#64748B' }}>📍 {event.location}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Invita Amici */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a2e' }}>Invita amici</p>
            <div style={{
              background: '#FEF3C7',
              padding: '8px 16px',
              borderRadius: '10px'
            }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '18px', color: '#D97706', letterSpacing: '3px' }}>
                {league?.code}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={copyCode}
              style={{
                flex: 1,
                padding: '12px',
                background: copied ? '#DCFCE7' : '#F1F5F9',
                color: copied ? '#16A34A' : '#64748B',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              {copied ? '✓ Copiato!' : '📋 Copia'}
            </button>
            <button
              onClick={shareWhatsApp}
              style={{
                flex: 1,
                padding: '12px',
                background: '#25D366',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              📱 WhatsApp
            </button>
          </div>
        </div>

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
          {members.length === 0 ? (
            <p style={{ color: '#94A3B8', textAlign: 'center', padding: '20px' }}>
              Invita amici per iniziare! 👥
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {members.map((member, index) => {
                const pos = getPositionStyle(index);
                const isMe = member.user_id === currentUserId;
                const winRate = member.wins + member.losses > 0 
                  ? Math.round((member.wins / (member.wins + member.losses)) * 100) 
                  : 0;
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
                        {isMe && <span style={{ color: '#F59E0B', marginLeft: '8px', fontSize: '11px', fontWeight: 500 }}>• Tu</span>}
                      </p>
                      <p style={{ fontSize: '12px', color: '#64748B' }}>
                        {member.wins}V {member.losses}S • {winRate}%
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '22px', fontWeight: 800, color: pos.color }}>{member.points}</p>
                      <p style={{ fontSize: '9px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>punti</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
              Nessuna partita ancora 🎾
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                        {getPlayerName(match.player1_id)} + {getPlayerName(match.player2_id)}
                      </p>
                    </div>
                    <div style={{ 
                      padding: '6px 12px', 
                      background: '#fff', 
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0'
                    }}>
                      <p style={{ fontWeight: 700, fontSize: '13px', color: '#1a1a2e', textAlign: 'center' }}>
                        {match.score_team1}
                      </p>
                      <p style={{ fontWeight: 700, fontSize: '13px', color: '#1a1a2e', textAlign: 'center' }}>
                        {match.score_team2}
                      </p>
                    </div>
                    <div style={{ flex: 1, textAlign: 'right' }}>
                      <p style={{
                        fontWeight: match.winner_team === 2 ? 700 : 400,
                        fontSize: '14px',
                        color: match.winner_team === 2 ? '#16A34A' : '#64748B'
                      }}>
                        {getPlayerName(match.player3_id)} + {getPlayerName(match.player4_id)}
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
