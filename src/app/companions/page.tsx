'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Companion {
  user_id: string;
  name: string;
  totalMatches: number;
  togetherWins: number;
  togetherLosses: number;
  againstWins: number;
  againstLosses: number;
  lastPlayed: string | null;
  badge: string;
  badgeColor: string;
  source: 'played' | 'league';
}

interface MatchDetail {
  id: string;
  date: string;
  type: 'together' | 'against';
  won: boolean;
  score: string;
  partner: string;
}

interface League {
  id: string;
  name: string;
  memberCount: number;
}

export default function CompanionsPage() {
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [filteredCompanions, setFilteredCompanions] = useState<Companion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanion, setSelectedCompanion] = useState<Companion | null>(null);
  const [matchHistory, setMatchHistory] = useState<MatchDetail[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  
  // Invite flow
  const [showInvite, setShowInvite] = useState(false);
  const [userLeagues, setUserLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [creating, setCreating] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCompanions(companions);
    } else {
      setFilteredCompanions(
        companions.filter(c => 
          c.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, companions]);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    // 1. Carica TUTTI i membri delle leghe dell'utente
    const { data: myMemberships } = await supabase
      .from('league_members')
      .select('league_id')
      .eq('user_id', user.id);

    const leagueIds = myMemberships?.map(m => m.league_id) || [];

    let allLeagueMembers: { user_id: string }[] = [];
    if (leagueIds.length > 0) {
      const { data: members } = await supabase
        .from('league_members')
        .select('user_id')
        .in('league_id', leagueIds)
        .neq('user_id', user.id);
      
      allLeagueMembers = members || [];
    }

    const leagueMemberIds = [...new Set(allLeagueMembers.map(m => m.user_id))];

    // 2. Carica partite
    const { data: matches } = await supabase
      .from('matches')
      .select('*')
      .or(`player1_id.eq.${user.id},player2_id.eq.${user.id},player3_id.eq.${user.id},player4_id.eq.${user.id}`)
      .order('played_at', { ascending: false });

    const matchPlayerIds = new Set<string>();
    matches?.forEach(m => {
      [m.player1_id, m.player2_id, m.player3_id, m.player4_id].forEach(id => {
        if (id && id !== user.id) matchPlayerIds.add(id);
      });
    });

    const allPlayerIds = [...new Set([...leagueMemberIds, ...matchPlayerIds])];

    if (allPlayerIds.length === 0) {
      setLoading(false);
      return;
    }

    // 3. Carica profili
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', allPlayerIds);

    const profileMap: Record<string, string> = {};
    profiles?.forEach(p => {
      profileMap[p.id] = p.full_name || 'Giocatore';
    });

    // 4. Calcola stats
    const companionStats: Record<string, Companion> = {};
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    allPlayerIds.forEach(id => {
      companionStats[id] = {
        user_id: id,
        name: profileMap[id] || 'Giocatore',
        totalMatches: 0,
        togetherWins: 0,
        togetherLosses: 0,
        againstWins: 0,
        againstLosses: 0,
        lastPlayed: null,
        badge: '',
        badgeColor: '',
        source: leagueMemberIds.includes(id) ? 'league' : 'played'
      };
    });

    matches?.forEach(match => {
      const myTeam = [match.player1_id, match.player2_id].includes(user.id) ? 1 : 2;
      const iWon = match.winner_team === myTeam;
      
      const teammates = myTeam === 1 
        ? [match.player1_id, match.player2_id].filter(id => id !== user.id)
        : [match.player3_id, match.player4_id].filter(id => id !== user.id);
      
      const opponents = myTeam === 1 
        ? [match.player3_id, match.player4_id]
        : [match.player1_id, match.player2_id];

      teammates.forEach(id => {
        if (!id || !companionStats[id]) return;
        companionStats[id].totalMatches++;
        companionStats[id].source = 'played';
        if (iWon) companionStats[id].togetherWins++;
        else companionStats[id].togetherLosses++;
        if (!companionStats[id].lastPlayed || match.played_at > companionStats[id].lastPlayed!) {
          companionStats[id].lastPlayed = match.played_at;
        }
      });

      opponents.forEach(id => {
        if (!id || !companionStats[id]) return;
        companionStats[id].totalMatches++;
        companionStats[id].source = 'played';
        if (iWon) companionStats[id].againstWins++;
        else companionStats[id].againstLosses++;
        if (!companionStats[id].lastPlayed || match.played_at > companionStats[id].lastPlayed!) {
          companionStats[id].lastPlayed = match.played_at;
        }
      });
    });

    // 5. Calcola badge
    Object.values(companionStats).forEach(c => {
      const togetherTotal = c.togetherWins + c.togetherLosses;
      const againstTotal = c.againstWins + c.againstLosses;
      const togetherRate = togetherTotal > 0 ? (c.togetherWins / togetherTotal) * 100 : 0;
      const againstRate = againstTotal > 0 ? (c.againstWins / againstTotal) * 100 : 0;
      const lastPlayedDate = c.lastPlayed ? new Date(c.lastPlayed) : null;
      
      if (c.totalMatches === 0) {
        c.badge = '👋 Mai giocato insieme';
        c.badgeColor = '#8B5CF6';
      } else if (lastPlayedDate && lastPlayedDate < thirtyDaysAgo) {
        c.badge = '⏰ Da risentire';
        c.badgeColor = '#F59E0B';
      } else if (togetherTotal >= 5 && togetherRate >= 70) {
        c.badge = '🔥 Coppia perfetta';
        c.badgeColor = '#22C55E';
      } else if (togetherTotal >= 3 && togetherRate >= 50) {
        c.badge = '👍 Buon feeling';
        c.badgeColor = '#3B82F6';
      } else if (againstTotal >= 3 && againstRate < 40) {
        c.badge = '⚔️ La tua nemesi';
        c.badgeColor = '#EF4444';
      } else if (againstTotal >= 3 && againstRate >= 60) {
        c.badge = '😈 La tua preda';
        c.badgeColor = '#8B5CF6';
      } else if (c.totalMatches <= 2) {
        c.badge = '🆕 Nuovo';
        c.badgeColor = '#64748B';
      }
    });

    // 6. Ordina
    const sorted = Object.values(companionStats).sort((a, b) => {
      if (a.totalMatches > 0 && b.totalMatches === 0) return -1;
      if (a.totalMatches === 0 && b.totalMatches > 0) return 1;
      
      if (a.totalMatches > 0 && b.totalMatches > 0) {
        const aDate = a.lastPlayed ? new Date(a.lastPlayed).getTime() : 0;
        const bDate = b.lastPlayed ? new Date(b.lastPlayed).getTime() : 0;
        if (bDate !== aDate) return bDate - aDate;
        return b.totalMatches - a.totalMatches;
      }
      
      return a.name.localeCompare(b.name);
    });

    setCompanions(sorted);
    setFilteredCompanions(sorted);

    // 7. Carica leghe
    const { data: memberships } = await supabase
      .from('league_members')
      .select('league_id, leagues(id, name)')
      .eq('user_id', user.id);

    if (memberships) {
      const leagues = await Promise.all(
        memberships.map(async (m) => {
          const { count } = await supabase
            .from('league_members')
            .select('*', { count: 'exact', head: true })
            .eq('league_id', m.league_id);
          return {
            id: (m.leagues as any)?.id,
            name: (m.leagues as any)?.name || 'Lega',
            memberCount: count || 0
          };
        })
      );
      setUserLeagues(leagues.filter(l => l.id));
    }

    setLoading(false);
  };

  const selectCompanion = async (companion: Companion) => {
    setSelectedCompanion(companion);
    
    if (companion.totalMatches === 0) {
      setMatchHistory([]);
      return;
    }

    const { data: matches } = await supabase
      .from('matches')
      .select('*')
      .or(`player1_id.eq.${currentUserId},player2_id.eq.${currentUserId},player3_id.eq.${currentUserId},player4_id.eq.${currentUserId}`)
      .order('played_at', { ascending: false });

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name');

    const profileMap: Record<string, string> = {};
    profiles?.forEach(p => {
      profileMap[p.id] = p.full_name?.split(' ')[0] || '?';
    });

    const history: MatchDetail[] = [];

    matches?.forEach(match => {
      const players = [match.player1_id, match.player2_id, match.player3_id, match.player4_id];
      if (!players.includes(companion.user_id)) return;

      const myTeam = [match.player1_id, match.player2_id].includes(currentUserId) ? 1 : 2;
      const companionTeam = [match.player1_id, match.player2_id].includes(companion.user_id) ? 1 : 2;
      const together = myTeam === companionTeam;
      const iWon = match.winner_team === myTeam;

      let partner = '';
      if (together) {
        const opps = myTeam === 1 
          ? [match.player3_id, match.player4_id]
          : [match.player1_id, match.player2_id];
        partner = `vs ${opps.map(id => profileMap[id] || '?').join(' + ')}`;
      } else {
        const teammate = myTeam === 1 
          ? [match.player1_id, match.player2_id].find(id => id !== currentUserId)
          : [match.player3_id, match.player4_id].find(id => id !== currentUserId);
        partner = `con ${profileMap[teammate!] || '?'}`;
      }

      history.push({
        id: match.id,
        date: match.played_at,
        type: together ? 'together' : 'against',
        won: iWon,
        score: `${match.score_team1} - ${match.score_team2}`,
        partner
      });
    });

    setMatchHistory(history.slice(0, 10));
  };

  const closeModal = () => {
    setSelectedCompanion(null);
    setMatchHistory([]);
    setShowInvite(false);
    setSelectedLeague('');
    setSelectedDate('');
    setSelectedTime('');
  };

  const openInvite = () => {
    setShowInvite(true);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);
    setSelectedTime('19:00');
    if (userLeagues.length > 0) {
      setSelectedLeague(userLeagues[0].id);
    }
  };

  const goToQuickMatch = () => {
    if (selectedCompanion) {
      router.push(`/quick-match?partner=${encodeURIComponent(selectedCompanion.name)}`);
    }
  };

  const createEvent = async () => {
    if (!selectedLeague || !selectedDate || !selectedTime || !selectedCompanion) return;
    
    setCreating(true);

    const { error } = await supabase.from('league_events').insert({
      league_id: selectedLeague,
      event_date: selectedDate,
      event_time: selectedTime,
      location: null,
      status: 'planned',
      created_by: currentUserId
    });

    if (!error) {
      const leagueName = userLeagues.find(l => l.id === selectedLeague)?.name || 'la lega';
      const dateFormatted = new Date(selectedDate).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
      const text = `🎾 Ehi ${selectedCompanion.name.split(' ')[0]}! Partita ${dateFormatted} alle ${selectedTime}? Ho creato l'evento in "${leagueName}" su MyPadelog!`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      closeModal();
    }

    setCreating(false);
  };

  const inviteWhatsApp = () => {
    if (!selectedCompanion) return;
    const text = `🎾 Ehi ${selectedCompanion.name.split(' ')[0]}! Ti va una partita di padel? 💪`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return 'Mai';
    const date = new Date(dateStr);
    const now = new Date();
    const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Oggi';
    if (days === 1) return 'Ieri';
    if (days < 7) return `${days}g fa`;
    if (days < 30) return `${Math.floor(days / 7)} sett. fa`;
    return `${Math.floor(days / 30)} mesi fa`;
  };

  const generateDateOptions = () => {
    const options = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      options.push({
        value: date.toISOString().split('T')[0],
        label: i === 0 ? 'Oggi' : i === 1 ? 'Domani' : date.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })
      });
    }
    return options;
  };

  const timeOptions = ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAF7' }}>
        <p style={{ color: '#999' }}>Caricamento...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF7', paddingBottom: '100px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1A8CD8 0%, #1565C0 100%)',
        padding: '48px 24px 24px',
        borderRadius: '0 0 32px 32px'
      }}>
        <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '14px' }}>
          ← Home
        </Link>
        <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>
          I Miei Compagni
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginTop: '4px' }}>
          {companions.length} persone nel tuo network
        </p>

        {/* Search */}
        <div style={{ marginTop: '16px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Cerca compagno..."
            style={{
              width: '100%',
              padding: '14px 16px',
              fontSize: '15px',
              border: 'none',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.15)',
              color: '#fff',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Lista */}
      <div style={{ padding: '20px' }}>
        {filteredCompanions.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '20px', padding: '40px 20px', textAlign: 'center' }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>🎾</span>
            <p style={{ color: '#666', fontSize: '16px' }}>
              {searchQuery ? 'Nessun risultato' : 'Nessun compagno ancora'}
            </p>
            <p style={{ color: '#999', fontSize: '14px', marginTop: '4px' }}>
              {searchQuery ? 'Prova un altro nome' : 'Unisciti a una lega per vedere i compagni!'}
            </p>
            {!searchQuery && (
              <Link href="/leagues" style={{
                display: 'inline-block',
                marginTop: '20px',
                padding: '14px 28px',
                background: '#1A8CD8',
                color: '#fff',
                borderRadius: '12px',
                textDecoration: 'none',
                fontWeight: 600
              }}>
                Vai alle Leghe
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredCompanions.map(companion => (
              <div
                key={companion.user_id}
                onClick={() => selectCompanion(companion)}
                style={{
                  background: '#fff',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: companion.totalMatches > 0 ? '#1A8CD8' : '#E5E5E5',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: companion.totalMatches > 0 ? '#fff' : '#666',
                  fontWeight: 700,
                  fontSize: '18px'
                }}>
                  {companion.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: '16px', color: '#111' }}>
                    {companion.name.split(' ')[0]}
                  </p>
                  {companion.badge && (
                    <p style={{ fontSize: '13px', color: companion.badgeColor, marginTop: '2px' }}>
                      {companion.badge}
                    </p>
                  )}
                  {companion.totalMatches > 0 && (
                    <p style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                      {getTimeAgo(companion.lastPlayed)} • {companion.totalMatches} partite
                    </p>
                  )}
                </div>
                <span style={{ color: '#CCC', fontSize: '20px' }}>›</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Profilo */}
      {selectedCompanion && !showInvite && (
        <div 
          onClick={closeModal}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '24px 24px 0 0',
              padding: '24px',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '85vh',
              overflowY: 'auto'
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: selectedCompanion.totalMatches > 0 ? '#1A8CD8' : '#E5E5E5',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: selectedCompanion.totalMatches > 0 ? '#fff' : '#666',
                fontWeight: 700,
                fontSize: '24px',
                margin: '0 auto 12px'
              }}>
                {selectedCompanion.name.charAt(0).toUpperCase()}
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111' }}>
                {selectedCompanion.name.split(' ')[0]}
              </h2>
              {selectedCompanion.badge && (
                <p style={{ fontSize: '14px', color: selectedCompanion.badgeColor, marginTop: '4px' }}>
                  {selectedCompanion.badge}
                </p>
              )}
            </div>

            {/* Stats */}
            {selectedCompanion.totalMatches > 0 ? (
              <>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ flex: 1, padding: '16px', background: '#E8F4FC', borderRadius: '14px', textAlign: 'center' }}>
                    <p style={{ fontSize: '11px', color: '#1A8CD8', fontWeight: 600, marginBottom: '6px' }}>🤝 INSIEME</p>
                    <p style={{ fontSize: '24px', fontWeight: 800, color: '#1A8CD8' }}>
                      {selectedCompanion.togetherWins + selectedCompanion.togetherLosses > 0 
                        ? Math.round((selectedCompanion.togetherWins / (selectedCompanion.togetherWins + selectedCompanion.togetherLosses)) * 100) + '%'
                        : '—'}
                    </p>
                    <p style={{ fontSize: '12px', color: '#666' }}>
                      {selectedCompanion.togetherWins}V - {selectedCompanion.togetherLosses}P
                    </p>
                  </div>
                  <div style={{ flex: 1, padding: '16px', background: '#FEE2E2', borderRadius: '14px', textAlign: 'center' }}>
                    <p style={{ fontSize: '11px', color: '#EF4444', fontWeight: 600, marginBottom: '6px' }}>⚔️ CONTRO</p>
                    <p style={{ fontSize: '24px', fontWeight: 800, color: '#EF4444' }}>
                      {selectedCompanion.againstWins + selectedCompanion.againstLosses > 0 
                        ? Math.round((selectedCompanion.againstWins / (selectedCompanion.againstWins + selectedCompanion.againstLosses)) * 100) + '%'
                        : '—'}
                    </p>
                    <p style={{ fontSize: '12px', color: '#666' }}>
                      {selectedCompanion.againstWins}V - {selectedCompanion.againstLosses}P
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', justifyContent: 'center' }}>
                  <p style={{ fontSize: '13px', color: '#666' }}>📊 {selectedCompanion.totalMatches} partite</p>
                  <p style={{ fontSize: '13px', color: '#666' }}>📅 {getTimeAgo(selectedCompanion.lastPlayed)}</p>
                </div>

                {matchHistory.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#666', marginBottom: '10px' }}>ULTIME PARTITE</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                      {matchHistory.map(match => (
                        <div key={match.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          background: '#F5F5F3',
                          borderRadius: '10px'
                        }}>
                          <span style={{ fontSize: '14px' }}>
                            {match.type === 'together' ? '🤝' : '⚔️'}
                          </span>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '13px', fontWeight: 600, color: match.won ? '#22C55E' : '#666' }}>
                              {match.won ? 'Vinta' : 'Persa'} {match.partner}
                            </p>
                          </div>
                          <p style={{ fontSize: '12px', color: '#999' }}>{match.score}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', marginBottom: '20px' }}>
                <p style={{ fontSize: '48px', marginBottom: '12px' }}>🎾</p>
                <p style={{ color: '#666', fontSize: '15px' }}>Non avete ancora giocato insieme</p>
                <p style={{ color: '#999', fontSize: '13px', marginTop: '4px' }}>Propongli una partita!</p>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Partita Veloce - NUOVO */}
              <button
                onClick={goToQuickMatch}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: '#1A8CD8',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                ⚡ Partita Veloce con {selectedCompanion.name.split(' ')[0]}
              </button>

              {/* Pianifica in Lega */}
              {userLeagues.length > 0 && (
                <button
                  onClick={openInvite}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: '#F5F5F3',
                    color: '#111',
                    border: 'none',
                    borderRadius: '14px',
                    fontSize: '16px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  📅 Pianifica in Lega
                </button>
              )}

              {/* WhatsApp diretto */}
              <button
                onClick={inviteWhatsApp}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: '#25D366',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Scrivi su WhatsApp
              </button>

              <button
                onClick={closeModal}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'transparent',
                  color: '#999',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Invita in Lega */}
      {selectedCompanion && showInvite && (
        <div 
          onClick={closeModal}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '24px 24px 0 0',
              padding: '24px',
              width: '100%',
              maxWidth: '500px'
            }}
          >
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111', marginBottom: '20px', textAlign: 'center' }}>
              📅 Pianifica con {selectedCompanion.name.split(' ')[0]}
            </h2>

            {/* Lega */}
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#666', marginBottom: '8px' }}>📍 In quale lega?</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {userLeagues.map(league => (
                  <button
                    key={league.id}
                    onClick={() => setSelectedLeague(league.id)}
                    style={{
                      padding: '14px 16px',
                      background: selectedLeague === league.id ? '#E8F4FC' : '#F5F5F3',
                      border: selectedLeague === league.id ? '2px solid #1A8CD8' : '2px solid transparent',
                      borderRadius: '12px',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <p style={{ fontWeight: 600, color: '#111' }}>{league.name}</p>
                    <p style={{ fontSize: '12px', color: '#666' }}>{league.memberCount} giocatori</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Data */}
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#666', marginBottom: '8px' }}>📅 Quando?</p>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {generateDateOptions().slice(0, 7).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedDate(opt.value)}
                    style={{
                      padding: '10px 14px',
                      background: selectedDate === opt.value ? '#1A8CD8' : '#F5F5F3',
                      color: selectedDate === opt.value ? '#fff' : '#666',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ora */}
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#666', marginBottom: '8px' }}>🕐 A che ora?</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {timeOptions.map(time => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    style={{
                      padding: '10px 14px',
                      background: selectedTime === time ? '#1A8CD8' : '#F5F5F3',
                      color: selectedTime === time ? '#fff' : '#666',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={createEvent}
              disabled={!selectedLeague || !selectedDate || !selectedTime || creating}
              style={{
                width: '100%',
                padding: '16px',
                background: (selectedLeague && selectedDate && selectedTime) ? '#1A8CD8' : '#E5E5E5',
                color: (selectedLeague && selectedDate && selectedTime) ? '#fff' : '#999',
                border: 'none',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: 700,
                cursor: (selectedLeague && selectedDate && selectedTime) ? 'pointer' : 'not-allowed',
                marginBottom: '10px'
              }}
            >
              {creating ? 'Creazione...' : '✓ Crea e Invita su WhatsApp'}
            </button>
            <button
              onClick={() => setShowInvite(false)}
              style={{
                width: '100%',
                padding: '14px',
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
          </div>
        </div>
      )}
    </div>
  );
}
