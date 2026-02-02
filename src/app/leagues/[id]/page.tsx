'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Member {
  user_id: string;
  points: number;
  wins: number;
  losses: number;
  handicap: number;
  profile: { full_name: string } | null;
  matchesPlayed?: number;
  improvement?: number;
  giantKills?: number;
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

interface NewsItem {
  emoji: string;
  text: string;
}

export default function LeagueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [league, setLeague] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [events, setEvents] = useState<LeagueEvent[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [activeRanking, setActiveRanking] = useState<'points' | 'matches' | 'improvement' | 'giant'>('points');
  const [showSettings, setShowSettings] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

    const { data: matchesData } = await supabase
      .from('matches')
      .select('*')
      .eq('league_id', id)
      .order('played_at', { ascending: false });

    const allMatches = matchesData || [];
    setMatches(allMatches.slice(0, 10));

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const formatted = (membersData || []).map((d: any) => {
      const memberId = d.user_id;
      const memberMatches = allMatches.filter(m => 
        [m.player1_id, m.player2_id, m.player3_id, m.player4_id].includes(memberId)
      );
      
      const recentMatches = memberMatches.filter(m => new Date(m.played_at) >= oneWeekAgo);
      const recentWins = recentMatches.filter(m => {
        const inTeam1 = [m.player1_id, m.player2_id].includes(memberId);
        return (inTeam1 && m.winner_team === 1) || (!inTeam1 && m.winner_team === 2);
      }).length;
      const recentWinRate = recentMatches.length > 0 ? Math.round((recentWins / recentMatches.length) * 100) : 0;
      
      const prevMatches = memberMatches.filter(m => {
        const date = new Date(m.played_at);
        return date >= twoWeeksAgo && date < oneWeekAgo;
      });
      const prevWins = prevMatches.filter(m => {
        const inTeam1 = [m.player1_id, m.player2_id].includes(memberId);
        return (inTeam1 && m.winner_team === 1) || (!inTeam1 && m.winner_team === 2);
      }).length;
      const previousWinRate = prevMatches.length > 0 ? Math.round((prevWins / prevMatches.length) * 100) : 0;
      
      const giantKills = memberMatches.filter(m => {
        const inTeam1 = [m.player1_id, m.player2_id].includes(memberId);
        const won = (inTeam1 && m.winner_team === 1) || (!inTeam1 && m.winner_team === 2);
        if (!won) return false;
        const opponents = inTeam1 ? [m.player3_id, m.player4_id] : [m.player1_id, m.player2_id];
        const myPoints = d.points;
        return opponents.some(oppId => {
          const opp = membersData?.find((x: any) => x.user_id === oppId);
          return opp && opp.points > myPoints;
        });
      }).length;

      return {
        user_id: d.user_id,
        points: d.points,
        wins: d.wins,
        losses: d.losses,
        handicap: d.handicap,
        profile: d.profile,
        matchesPlayed: memberMatches.length,
        improvement: recentWinRate - previousWinRate,
        giantKills
      };
    });

    setMembers(formatted);

    // News
    const generatedNews: NewsItem[] = [];
    const thisWeekMatches = allMatches.filter(m => new Date(m.played_at) >= oneWeekAgo);
    
    if (thisWeekMatches.length > 0) {
      const playCountThisWeek: Record<string, number> = {};
      thisWeekMatches.forEach(m => {
        [m.player1_id, m.player2_id, m.player3_id, m.player4_id].forEach(p => {
          playCountThisWeek[p] = (playCountThisWeek[p] || 0) + 1;
        });
      });
      const mostActive = Object.entries(playCountThisWeek).sort((a, b) => b[1] - a[1])[0];
      if (mostActive) {
        const player = formatted.find(m => m.user_id === mostActive[0]);
        if (player && mostActive[1] >= 2) {
          generatedNews.push({
            emoji: '🔥',
            text: `${player.profile?.full_name?.split(' ')[0]} instancabile: ${mostActive[1]} partite!`
          });
        }
      }
    }

    formatted.forEach(member => {
      if (member.wins >= 3) {
        const memberRecentMatches = allMatches
          .filter(m => [m.player1_id, m.player2_id, m.player3_id, m.player4_id].includes(member.user_id))
          .slice(0, 5);
        let streak = 0;
        for (const m of memberRecentMatches) {
          const inTeam1 = [m.player1_id, m.player2_id].includes(member.user_id);
          const won = (inTeam1 && m.winner_team === 1) || (!inTeam1 && m.winner_team === 2);
          if (won) streak++;
          else break;
        }
        if (streak >= 3) {
          generatedNews.push({
            emoji: '🏆',
            text: `${member.profile?.full_name?.split(' ')[0]} imbattuto: ${streak} di fila!`
          });
        }
      }
    });

    setNews(generatedNews.slice(0, 3));

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
    const text = `🎾 Unisciti alla mia lega "${league?.name}" su MyPadelog!\n\n👉 Codice: ${league?.code}`;
    const waUrl = 'https://wa.me/?text=' + encodeURIComponent(text);
    window.open(waUrl, '_blank');
  };

  const deleteLeague = async () => {
    if (!confirm('Sei sicuro di voler ELIMINARE questa lega? Tutti i dati verranno persi permanentemente.')) return;
    if (!confirm('Conferma: questa azione NON può essere annullata.')) return;
    
    setDeleting(true);
    
    // Elimina prima i membri, poi le partite, poi la lega
    await supabase.from('league_members').delete().eq('league_id', id);
    await supabase.from('matches').delete().eq('league_id', id);
    await supabase.from('league_events').delete().eq('league_id', id);
    await supabase.from('leagues').delete().eq('id', id);
    
    router.push('/leagues');
  };

  const getPositionStyle = (index: number) => {
    if (index === 0) return { emoji: '👑', color: '#F4C430' };
    if (index === 1) return { emoji: '🥈', color: '#94A3B8' };
    if (index === 2) return { emoji: '🥉', color: '#CD7F32' };
    return { emoji: `${index + 1}`, color: '#666' };
  };

  const getPlayerName = (playerId: string) => {
    const member = members.find(m => m.user_id === playerId);
    return member?.profile?.full_name?.split(' ')[0] || '?';
  };

  const getSortedMembers = () => {
    switch (activeRanking) {
      case 'matches':
        return [...members].sort((a, b) => (b.matchesPlayed || 0) - (a.matchesPlayed || 0));
      case 'improvement':
        return [...members].sort((a, b) => (b.improvement || 0) - (a.improvement || 0));
      case 'giant':
        return [...members].sort((a, b) => (b.giantKills || 0) - (a.giantKills || 0));
      default:
        return members;
    }
  };

  const getRankingValue = (member: Member) => {
    switch (activeRanking) {
      case 'matches':
        return { value: member.matchesPlayed || 0, label: 'partite' };
      case 'improvement':
        return { value: `${(member.improvement || 0) >= 0 ? '+' : ''}${member.improvement || 0}%`, label: 'vs scorsa' };
      case 'giant':
        return { value: member.giantKills || 0, label: 'giant' };
      default:
        return { value: member.points, label: 'punti' };
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAF7' }}>
        <p style={{ color: '#999' }}>Caricamento...</p>
      </div>
    );
  }

  const sortedMembers = getSortedMembers();
  const isOwner = league?.created_by === currentUserId;

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF7', paddingBottom: '100px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0E5E4A 0%, #0A4A3A 100%)',
        padding: '48px 24px 32px',
        borderRadius: '0 0 32px 32px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/leagues" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
            ← Leghe
          </Link>
          {isOwner && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', padding: '8px 12px', color: '#fff', cursor: 'pointer' }}
            >
              ⚙️
            </button>
          )}
        </div>
        <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 800, marginTop: '8px' }}>
          {league?.name}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginTop: '4px' }}>
          👥 {members.length} giocatori • 🎾 {matches.length} partite
        </p>
      </div>

      {/* Settings Panel */}
      {showSettings && isOwner && (
        <div style={{ padding: '0 20px', marginBottom: '16px' }}>
          <div style={{ background: '#FEE2E2', borderRadius: '16px', padding: '20px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#DC2626', marginBottom: '12px' }}>⚠️ Zona Pericolosa</p>
            <button
              onClick={deleteLeague}
              disabled={deleting}
              style={{
                width: '100%',
                padding: '14px',
                background: '#DC2626',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {deleting ? 'Eliminazione...' : '🗑️ Elimina Lega'}
            </button>
          </div>
        </div>
      )}

      <div style={{ padding: '0 20px' }}>
        {/* CTA Registra */}
        <Link href={`/leagues/${id}/match/new`} style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'linear-gradient(135deg, #0E5E4A 0%, #0A4A3A 100%)',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <span style={{ fontSize: '32px' }}>🎾</span>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#fff', fontSize: '17px', fontWeight: 700 }}>Registra Partita</p>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>20 secondi</p>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '24px' }}>→</span>
          </div>
        </Link>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <Link href={`/leagues/${id}/tournaments`} style={{ textDecoration: 'none', flex: 1 }}>
            <div style={{ background: '#fff', borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
              <span style={{ fontSize: '24px' }}>🎲</span>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#111', marginTop: '4px' }}>Tornei</p>
            </div>
          </Link>
          <Link href={`/leagues/${id}/plan`} style={{ textDecoration: 'none', flex: 1 }}>
            <div style={{ background: '#fff', borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
              <span style={{ fontSize: '24px' }}>📅</span>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#111', marginTop: '4px' }}>Organizza</p>
            </div>
          </Link>
          <div onClick={shareWhatsApp} style={{ flex: 1, cursor: 'pointer' }}>
            <div style={{ background: '#fff', borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
              <span style={{ fontSize: '24px' }}>📲</span>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#111', marginTop: '4px' }}>Invita</p>
            </div>
          </div>
        </div>

        {/* News */}
        {news.length > 0 && (
          <div style={{
            background: '#111',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            {news.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: i < news.length - 1 ? '8px' : 0 }}>
                <span>{item.emoji}</span>
                <p style={{ fontSize: '14px', color: '#fff' }}>{item.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Eventi */}
        {events.length > 0 && (
          <div style={{ background: '#E0F2FE', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#0369A1', marginBottom: '8px' }}>📅 PROSSIME</p>
            {events.map(event => (
              <p key={event.id} style={{ fontSize: '14px', color: '#0369A1' }}>
                {new Date(event.event_date).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}
                {event.event_time && ` • ${event.event_time.slice(0,5)}`}
                {event.location && ` • ${event.location}`}
              </p>
            ))}
          </div>
        )}

        {/* Classifiche */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: '20px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111', marginBottom: '16px' }}>🏆 Classifiche</h2>
          
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', overflowX: 'auto' }}>
            {[
              { key: 'points', label: '🏆 Punti' },
              { key: 'matches', label: '🎾 Partite' },
              { key: 'improvement', label: '📈 Crescita' },
              { key: 'giant', label: '🦁 Giant' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveRanking(tab.key as any)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '20px',
                  border: 'none',
                  background: activeRanking === tab.key ? '#111' : '#F5F5F3',
                  color: activeRanking === tab.key ? '#fff' : '#666',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {members.length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>Invita amici per iniziare! 👥</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sortedMembers.map((member, index) => {
                const pos = getPositionStyle(index);
                const isMe = member.user_id === currentUserId;
                const rankValue = getRankingValue(member);
                const winRate = member.wins + member.losses > 0 ? Math.round((member.wins / (member.wins + member.losses)) * 100) : 0;
                return (
                  <div key={member.user_id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 16px',
                    background: isMe ? '#E8F5E9' : '#F5F5F3',
                    borderRadius: '14px',
                    border: isMe ? '2px solid #0E5E4A' : 'none'
                  }}>
                    <span style={{ fontSize: index < 3 ? '24px' : '16px', width: '32px', textAlign: 'center', color: pos.color, fontWeight: 700 }}>
                      {pos.emoji}
                    </span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: '15px', color: '#111' }}>
                        {member.profile?.full_name?.split(' ')[0] || 'Giocatore'}
                        {isMe && <span style={{ color: '#0E5E4A', marginLeft: '8px', fontSize: '11px' }}>• Tu</span>}
                      </p>
                      <p style={{ fontSize: '12px', color: '#666' }}>{member.wins}V {member.losses}S • {winRate}%</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '20px', fontWeight: 800, color: activeRanking === 'improvement' ? ((member.improvement || 0) >= 0 ? '#22C55E' : '#EF4444') : pos.color }}>
                        {rankValue.value}
                      </p>
                      <p style={{ fontSize: '9px', color: '#999', textTransform: 'uppercase' }}>{rankValue.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Codice */}
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <p style={{ fontSize: '12px', color: '#666' }}>Codice invito</p>
            <p style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '20px', color: '#0E5E4A', letterSpacing: '3px' }}>
              {league?.code}
            </p>
          </div>
          <button onClick={copyCode} style={{
            padding: '10px 20px',
            background: copied ? '#DCFCE7' : '#F5F5F3',
            color: copied ? '#16A34A' : '#666',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 600,
            cursor: 'pointer'
          }}>
            {copied ? '✓' : '📋'}
          </button>
        </div>

        {/* Ultime Partite */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111', marginBottom: '16px' }}>📊 Ultime Partite</h2>
          {matches.length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>Nessuna partita ancora 🎾</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {matches.map(match => (
                <div key={match.id} style={{ padding: '14px', background: '#F5F5F3', borderRadius: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: match.winner_team === 1 ? 700 : 400, fontSize: '14px', color: match.winner_team === 1 ? '#16A34A' : '#666' }}>
                        {match.winner_team === 1 && '🏆 '}{getPlayerName(match.player1_id)} + {getPlayerName(match.player2_id)}
                      </p>
                    </div>
                    <div style={{ padding: '6px 12px', background: '#fff', borderRadius: '8px' }}>
                      <p style={{ fontWeight: 700, fontSize: '13px', color: '#111', textAlign: 'center' }}>{match.score_team1}</p>
                      <p style={{ fontWeight: 700, fontSize: '13px', color: '#111', textAlign: 'center' }}>{match.score_team2}</p>
                    </div>
                    <div style={{ flex: 1, textAlign: 'right' }}>
                      <p style={{ fontWeight: match.winner_team === 2 ? 700 : 400, fontSize: '14px', color: match.winner_team === 2 ? '#16A34A' : '#666' }}>
                        {getPlayerName(match.player3_id)} + {getPlayerName(match.player4_id)}{match.winner_team === 2 && ' 🏆'}
                      </p>
                    </div>
                  </div>
                  <p style={{ fontSize: '11px', color: '#999', textAlign: 'center', marginTop: '8px' }}>
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
