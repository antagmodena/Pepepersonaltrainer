'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface PlayerStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  currentStreak: number;
  topPartner: { name: string; winRate: number } | null;
  nemesis: { name: string; winRate: number } | null;
  title: string;
  titleEmoji: string;
  badges: { emoji: string; name: string; description: string }[];
}

export default function PlayerCardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [shared, setShared] = useState(false);

  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    setProfile(profileData);

    // Carica partite lega
    const { data: matches } = await supabase
      .from('matches')
      .select('*')
      .or(`player1_id.eq.${user.id},player2_id.eq.${user.id},player3_id.eq.${user.id},player4_id.eq.${user.id}`)
      .order('played_at', { ascending: false });

    // Carica partite veloci
    const { data: quickMatches } = await supabase
      .from('quick_matches')
      .select('*')
      .eq('user_id', user.id)
      .order('played_at', { ascending: false });

    const allMatches = matches || [];
    const allQuick = quickMatches || [];
    const totalMatches = allMatches.length + allQuick.length;

    // Vittorie/sconfitte lega
    let leagueWins = 0, leagueLosses = 0;
    allMatches.forEach(m => {
      const myTeam = [m.player1_id, m.player2_id].includes(user.id) ? 1 : 2;
      if (m.winner_team === myTeam) leagueWins++;
      else leagueLosses++;
    });

    // Partite veloci
    const quickWins = allQuick.filter(q => q.winner_team === 1).length;
    const quickLosses = allQuick.filter(q => q.winner_team === 2).length;

    const wins = leagueWins + quickWins;
    const losses = leagueLosses + quickLosses;
    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

    // Streak corrente
    let currentStreak = 0;
    const sortedMatches = [...allMatches].sort((a, b) => 
      new Date(b.played_at).getTime() - new Date(a.played_at).getTime()
    );
    for (const m of sortedMatches) {
      const myTeam = [m.player1_id, m.player2_id].includes(user.id) ? 1 : 2;
      if (m.winner_team === myTeam) currentStreak++;
      else break;
    }

    // Partner e avversari stats
    const partnerStats: Record<string, { wins: number; total: number }> = {};
    const opponentStats: Record<string, { wins: number; total: number }> = {};

    const { data: profiles } = await supabase.from('profiles').select('id, full_name');
    const profileMap: Record<string, string> = {};
    profiles?.forEach(p => { profileMap[p.id] = p.full_name || 'Giocatore'; });

    allMatches.forEach(m => {
      const myTeam = [m.player1_id, m.player2_id].includes(user.id) ? 1 : 2;
      const iWon = m.winner_team === myTeam;
      
      const partners = myTeam === 1 
        ? [m.player1_id, m.player2_id].filter(id => id !== user.id)
        : [m.player3_id, m.player4_id].filter(id => id !== user.id);
      const opponents = myTeam === 1 
        ? [m.player3_id, m.player4_id]
        : [m.player1_id, m.player2_id];

      partners.forEach(id => {
        if (!id) return;
        if (!partnerStats[id]) partnerStats[id] = { wins: 0, total: 0 };
        partnerStats[id].total++;
        if (iWon) partnerStats[id].wins++;
      });

      opponents.forEach(id => {
        if (!id) return;
        if (!opponentStats[id]) opponentStats[id] = { wins: 0, total: 0 };
        opponentStats[id].total++;
        if (iWon) opponentStats[id].wins++;
      });
    });

    // Top partner
    let topPartner = null;
    let bestPartnerRate = 0;
    Object.entries(partnerStats).forEach(([id, s]) => {
      if (s.total >= 3) {
        const rate = Math.round((s.wins / s.total) * 100);
        if (rate > bestPartnerRate) {
          bestPartnerRate = rate;
          topPartner = { name: profileMap[id]?.split(' ')[0] || 'Partner', winRate: rate };
        }
      }
    });

    // Nemesis
    let nemesis = null;
    let worstRate = 100;
    Object.entries(opponentStats).forEach(([id, s]) => {
      if (s.total >= 3) {
        const rate = Math.round((s.wins / s.total) * 100);
        if (rate < worstRate && rate < 40) {
          worstRate = rate;
          nemesis = { name: profileMap[id]?.split(' ')[0] || 'Nemesi', winRate: rate };
        }
      }
    });

    // Titolo automatico
    let title = 'Rookie', titleEmoji = '🎾';
    if (totalMatches >= 50 && winRate >= 70) { title = 'Leggenda'; titleEmoji = '👑'; }
    else if (totalMatches >= 30 && winRate >= 60) { title = 'Campione'; titleEmoji = '🏆'; }
    else if (currentStreak >= 5) { title = 'Inarrestabile'; titleEmoji = '🔥'; }
    else if (winRate >= 55 && totalMatches >= 20) { title = 'Vincente'; titleEmoji = '💪'; }
    else if (totalMatches >= 20) { title = 'Veterano'; titleEmoji = '⭐'; }
    else if (totalMatches >= 10) { title = 'Giocatore'; titleEmoji = '🎾'; }
    else if (totalMatches >= 5) { title = 'Apprendista'; titleEmoji = '📚'; }

    // Badge
    const badges: { emoji: string; name: string; description: string }[] = [];
    if (totalMatches >= 10) badges.push({ emoji: '🎾', name: 'Debuttante', description: '10 partite' });
    if (totalMatches >= 25) badges.push({ emoji: '⭐', name: 'Assiduo', description: '25 partite' });
    if (totalMatches >= 50) badges.push({ emoji: '💎', name: 'Veterano', description: '50 partite' });
    if (totalMatches >= 100) badges.push({ emoji: '👑', name: 'Leggenda', description: '100 partite' });
    if (wins >= 5) badges.push({ emoji: '✌️', name: 'Vincitore', description: '5 vittorie' });
    if (wins >= 20) badges.push({ emoji: '🏆', name: 'Campione', description: '20 vittorie' });
    if (currentStreak >= 3) badges.push({ emoji: '🔥', name: 'On Fire', description: '3+ streak' });
    if (currentStreak >= 5) badges.push({ emoji: '💥', name: 'Inarrestabile', description: '5+ streak' });
    if (topPartner && topPartner.winRate >= 70) badges.push({ emoji: '🤝', name: "Coppia d'Oro", description: '70%+ con partner' });
    if (winRate >= 60 && totalMatches >= 10) badges.push({ emoji: '📈', name: 'Costante', description: '60%+ winrate' });

    setStats({ totalMatches, wins, losses, winRate, currentStreak, topPartner, nemesis, title, titleEmoji, badges });
    setLoading(false);
  };

  const shareCard = async () => {
    const text = `🎾 La mia Player Card su MyPadelog!\n\n${stats?.titleEmoji} ${stats?.title}\n📊 ${stats?.totalMatches} partite • ${stats?.winRate}% winrate\n🔥 Streak: ${stats?.currentStreak}\n\n👉 Scarica MyPadelog e sfidami!`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: 'La mia Player Card', text });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (e) {}
    } else {
      await navigator.clipboard.writeText(text);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0E5E4A' }}>
        <p style={{ color: 'rgba(255,255,255,0.7)' }}>Caricamento...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0E5E4A', padding: '20px', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Link href="/profile" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '14px' }}>
          ← Profilo
        </Link>
        <button onClick={shareCard} style={{
          padding: '10px 20px',
          background: shared ? '#22C55E' : 'rgba(255,255,255,0.2)',
          color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer'
        }}>
          {shared ? '✓ Copiato!' : '📤 Condividi'}
        </button>
      </div>

      {/* Card */}
      <div style={{
        background: 'linear-gradient(145deg, #111 0%, #1a1a1a 100%)',
        borderRadius: '24px', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
      }}>
        {/* Avatar + Nome */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '80px', height: '80px',
            background: 'linear-gradient(135deg, #0E5E4A 0%, #16A34A 100%)',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: '32px', fontWeight: 800, color: '#fff'
          }}>
            {profile?.full_name?.charAt(0).toUpperCase() || '?'}
          </div>
          <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>
            {profile?.full_name?.split(' ')[0] || 'Giocatore'}
          </h1>
          <p style={{ color: '#F4C430', fontSize: '16px', fontWeight: 600 }}>
            {stats?.titleEmoji} {stats?.title}
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
          <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '14px', padding: '16px' }}>
            <p style={{ color: '#fff', fontSize: '28px', fontWeight: 800 }}>{stats?.totalMatches}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', textTransform: 'uppercase' }}>Partite</p>
          </div>
          <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '14px', padding: '16px' }}>
            <p style={{ color: '#22C55E', fontSize: '28px', fontWeight: 800 }}>{stats?.winRate}%</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', textTransform: 'uppercase' }}>Winrate</p>
          </div>
          <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '14px', padding: '16px' }}>
            <p style={{ color: '#F46A25', fontSize: '28px', fontWeight: 800 }}>{stats?.currentStreak}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', textTransform: 'uppercase' }}>Streak</p>
          </div>
        </div>

        {/* Record */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '24px',
          padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#22C55E', fontSize: '20px', fontWeight: 700 }}>{stats?.wins}</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>Vittorie</p>
          </div>
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#EF4444', fontSize: '20px', fontWeight: 700 }}>{stats?.losses}</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>Sconfitte</p>
          </div>
        </div>

        {/* Badge */}
        {stats && stats.badges.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', textTransform: 'uppercase', marginBottom: '12px', textAlign: 'center' }}>
              Badge
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              {stats.badges.slice(0, 6).map((badge, i) => (
                <div key={i} title={badge.description} style={{
                  background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '8px 12px',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                  <span style={{ fontSize: '16px' }}>{badge.emoji}</span>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 500 }}>{badge.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Partner & Nemesis */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {stats?.topPartner && (
            <div style={{ flex: 1, background: 'rgba(34, 197, 94, 0.15)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#22C55E', marginBottom: '4px' }}>🤝 Top Partner</p>
              <p style={{ color: '#fff', fontWeight: 600, fontSize: '15px' }}>{stats.topPartner.name}</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{stats.topPartner.winRate}% insieme</p>
            </div>
          )}
          {stats?.nemesis && (
            <div style={{ flex: 1, background: 'rgba(239, 68, 68, 0.15)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#EF4444', marginBottom: '4px' }}>⚔️ Nemesi</p>
              <p style={{ color: '#fff', fontWeight: 600, fontSize: '15px' }}>{stats.nemesis.name}</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Solo {stats.nemesis.winRate}%</p>
            </div>
          )}
        </div>

        {/* Branding */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px' }}>MyPadelog</p>
        </div>
      </div>

      {/* CTA */}
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <button onClick={shareCard} style={{
          width: '100%', padding: '18px', background: '#fff', color: '#0E5E4A',
          border: 'none', borderRadius: '16px', fontSize: '17px', fontWeight: 700, cursor: 'pointer', marginBottom: '12px'
        }}>
          📤 Condividi su Instagram
        </button>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
          Fai uno screenshot e postalo nelle Stories!
        </p>
      </div>
    </div>
  );
}
