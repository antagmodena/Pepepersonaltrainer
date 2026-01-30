'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface PartnerStats {
  name: string;
  total: number;
  winRate: number;
}

interface Badge {
  emoji: string;
  name: string;
  description: string;
}

interface Stats {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  currentStreak: number;
  topPartner: PartnerStats | null;
  nemesis: PartnerStats | null;
  title: string;
  titleEmoji: string;
  badges: Badge[];
}

export default function PlayerCardPage() {
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    setProfile(profileData);

    // Carica partite da leghe
    const { data: leagueMatches } = await supabase
      .from('matches')
      .select('*')
      .or(`player1_id.eq.${user.id},player2_id.eq.${user.id},player3_id.eq.${user.id},player4_id.eq.${user.id}`)
      .order('played_at', { ascending: false });

    // Carica quick matches
    const { data: quickMatches } = await supabase
      .from('quick_matches')
      .select('*')
      .eq('user_id', user.id)
      .order('played_at', { ascending: false });

    // Calcola stats
    const allMatches = leagueMatches || [];
    const allQuickMatches = quickMatches || [];

    let wins = 0;
    let losses = 0;
    let currentStreak = 0;
    let streakCounting = true;

    // Partner tracking
    const partnerStats: Record<string, { name: string; wins: number; total: number }> = {};

    // League matches
    allMatches.forEach(match => {
      const inTeam1 = [match.player1_id, match.player2_id].includes(user.id);
      const won = (inTeam1 && match.winner_team === 1) || (!inTeam1 && match.winner_team === 2);

      if (won) {
        wins++;
        if (streakCounting) currentStreak++;
      } else {
        losses++;
        streakCounting = false;
      }

      // Track partner
      const partnerId = inTeam1
        ? (match.player1_id === user.id ? match.player2_id : match.player1_id)
        : (match.player3_id === user.id ? match.player4_id : match.player3_id);

      if (partnerId) {
        if (!partnerStats[partnerId]) {
          partnerStats[partnerId] = { name: partnerId, wins: 0, total: 0 };
        }
        partnerStats[partnerId].total++;
        if (won) partnerStats[partnerId].wins++;
      }
    });

    // Quick matches
    allQuickMatches.forEach(match => {
      const won = match.winner_team === 1;
      if (won) wins++;
      else losses++;
    });

    const totalMatches = wins + losses;
    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

    // Carica nomi partner
    const partnerIds = Object.keys(partnerStats);
    const partnerNames: Record<string, string> = {};

    if (partnerIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', partnerIds);

      profiles?.forEach(p => {
        partnerNames[p.id] = p.full_name?.split(' ')[0] || 'Giocatore';
      });
    }

    // Trova top partner e nemesis (minimo 3 partite insieme)
    const eligiblePartners: PartnerStats[] = [];
    
    Object.entries(partnerStats).forEach(([id, pStats]) => {
      if (pStats.total >= 3) {
        const wr = Math.round((pStats.wins / pStats.total) * 100);
        eligiblePartners.push({
          name: partnerNames[id] || 'Giocatore',
          total: pStats.total,
          winRate: wr
        });
      }
    });

    // Sort to find top partner (highest winrate >= 50%) and nemesis (lowest winrate < 40%)
    const topPartner = eligiblePartners
      .filter(p => p.winRate >= 50)
      .sort((a, b) => b.winRate - a.winRate)[0] || null;
    
    const nemesis = eligiblePartners
      .filter(p => p.winRate < 40)
      .sort((a, b) => a.winRate - b.winRate)[0] || null;

    // Calcola titolo
    let title = 'Rookie';
    let titleEmoji = '🎾';

    if (totalMatches >= 50 && winRate >= 70) {
      title = 'Leggenda'; titleEmoji = '👑';
    } else if (totalMatches >= 30 && winRate >= 60) {
      title = 'Campione'; titleEmoji = '🏆';
    } else if (currentStreak >= 5) {
      title = 'Inarrestabile'; titleEmoji = '🔥';
    } else if (totalMatches >= 20 && winRate >= 55) {
      title = 'Vincente'; titleEmoji = '💪';
    } else if (totalMatches >= 20) {
      title = 'Veterano'; titleEmoji = '⭐';
    } else if (totalMatches >= 10) {
      title = 'Giocatore'; titleEmoji = '🎾';
    } else if (totalMatches >= 5) {
      title = 'Apprendista'; titleEmoji = '📚';
    }

    // Calcola badge
    const badges: Badge[] = [];
    if (totalMatches >= 10) badges.push({ emoji: '🎾', name: 'Debuttante', description: '10 partite' });
    if (totalMatches >= 25) badges.push({ emoji: '⭐', name: 'Assiduo', description: '25 partite' });
    if (totalMatches >= 50) badges.push({ emoji: '💎', name: 'Veterano', description: '50 partite' });
    if (totalMatches >= 100) badges.push({ emoji: '👑', name: 'Leggenda', description: '100 partite' });
    if (wins >= 5) badges.push({ emoji: '✌️', name: 'Vincitore', description: '5 vittorie' });
    if (wins >= 20) badges.push({ emoji: '🏆', name: 'Campione', description: '20 vittorie' });
    if (wins >= 50) badges.push({ emoji: '🥇', name: 'Dominatore', description: '50 vittorie' });
    if (currentStreak >= 3) badges.push({ emoji: '🔥', name: 'On Fire', description: '3+ streak' });
    if (currentStreak >= 5) badges.push({ emoji: '💥', name: 'Inarrestabile', description: '5+ streak' });
    if (topPartner && topPartner.winRate >= 70) badges.push({ emoji: '🤝', name: "Coppia d'Oro", description: '70%+ con partner' });
    if (winRate >= 60 && totalMatches >= 10) badges.push({ emoji: '📈', name: 'Costante', description: '60%+ winrate' });

    setStats({ totalMatches, wins, losses, winRate, currentStreak, topPartner, nemesis, title, titleEmoji, badges });
    setLoading(false);
  };

  const handleShare = async () => {
    const name = profile?.full_name?.split(' ')[0] || 'Giocatore';
    const text = `🎾 ${name} - ${stats?.titleEmoji} ${stats?.title}\n\n📊 ${stats?.totalMatches} partite | ${stats?.winRate}% winrate\n🔥 Streak: ${stats?.currentStreak}\n\nScopri le tue stats su MyPadelog!`;

    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch (e) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
        <p style={{ color: '#fff' }}>Caricamento...</p>
      </div>
    );
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'Giocatore';

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #111 0%, #1a1a1a 100%)', padding: '24px', paddingBottom: '120px' }}>
      {/* Card */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #252525 100%)',
        borderRadius: '24px',
        padding: '32px 24px',
        border: '1px solid #333',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
      }}>
        {/* Avatar */}
        <div style={{
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, #0E5E4A 0%, #0A4A3A 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          fontSize: '32px',
          fontWeight: 700,
          color: '#fff'
        }}>
          {firstName.charAt(0).toUpperCase()}
        </div>

        {/* Nome e Titolo */}
        <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, textAlign: 'center', marginBottom: '4px' }}>
          {firstName}
        </h1>
        <p style={{ color: '#0E5E4A', fontSize: '16px', fontWeight: 600, textAlign: 'center', marginBottom: '24px' }}>
          {stats?.titleEmoji} {stats?.title}
        </p>

        {/* Stats Grid */}
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#fff', fontSize: '28px', fontWeight: 800 }}>{stats?.totalMatches}</p>
            <p style={{ color: '#666', fontSize: '12px' }}>Partite</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#0E5E4A', fontSize: '28px', fontWeight: 800 }}>{stats?.winRate}%</p>
            <p style={{ color: '#666', fontSize: '12px' }}>Winrate</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#F46A25', fontSize: '28px', fontWeight: 800 }}>{stats?.currentStreak}</p>
            <p style={{ color: '#666', fontSize: '12px' }}>Streak</p>
          </div>
        </div>

        {/* W-L Record */}
        <div style={{
          background: '#111',
          borderRadius: '12px',
          padding: '12px',
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          marginBottom: '24px'
        }}>
          <p style={{ color: '#22C55E', fontSize: '14px', fontWeight: 600 }}>✓ {stats?.wins} vinte</p>
          <p style={{ color: '#EF4444', fontSize: '14px', fontWeight: 600 }}>✗ {stats?.losses} perse</p>
        </div>

        {/* Badges */}
        {stats?.badges && stats.badges.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <p style={{ color: '#666', fontSize: '11px', fontWeight: 600, marginBottom: '10px', textAlign: 'center' }}>BADGE</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              {stats.badges.slice(0, 6).map((badge, i) => (
                <div key={i} style={{
                  background: '#252525',
                  borderRadius: '20px',
                  padding: '6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span>{badge.emoji}</span>
                  <span style={{ color: '#fff', fontSize: '12px', fontWeight: 500 }}>{badge.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Partner & Nemesis */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          {stats?.topPartner && (
            <div style={{ flex: 1, background: '#0E5E4A20', borderRadius: '12px', padding: '12px', border: '1px solid #0E5E4A40' }}>
              <p style={{ color: '#0E5E4A', fontSize: '10px', fontWeight: 600, marginBottom: '4px' }}>🤝 TOP PARTNER</p>
              <p style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>{stats.topPartner.name}</p>
              <p style={{ color: '#666', fontSize: '11px' }}>{stats.topPartner.winRate}% insieme</p>
            </div>
          )}
          {stats?.nemesis && (
            <div style={{ flex: 1, background: '#EF444420', borderRadius: '12px', padding: '12px', border: '1px solid #EF444440' }}>
              <p style={{ color: '#EF4444', fontSize: '10px', fontWeight: 600, marginBottom: '4px' }}>⚔️ NEMESI</p>
              <p style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>{stats.nemesis.name}</p>
              <p style={{ color: '#666', fontSize: '11px' }}>{stats.nemesis.winRate}% vs</p>
            </div>
          )}
        </div>

        {/* Branding */}
        <p style={{ color: '#444', fontSize: '11px', textAlign: 'center' }}>MyPadelog • Allenamenti & Partite</p>
      </div>

      {/* Share Button */}
      <button
        onClick={handleShare}
        style={{
          width: '100%',
          marginTop: '24px',
          padding: '18px',
          background: '#0E5E4A',
          color: '#fff',
          border: 'none',
          borderRadius: '14px',
          fontSize: '16px',
          fontWeight: 700,
          cursor: 'pointer'
        }}
      >
        {copied ? '✓ Copiato!' : '📤 Condividi la tua Card'}
      </button>

      <p style={{ color: '#666', fontSize: '13px', textAlign: 'center', marginTop: '12px' }}>
        Fai screenshot e posta nelle Stories! 📸
      </p>
    </div>
  );
}
