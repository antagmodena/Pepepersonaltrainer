'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { BADGES, TITLES } from '@/lib/badges/definitions';
import { checkBadges, calculateLeagueTitle } from '@/lib/badges/calculator';
import { BadgeCheckResult, LeagueTitle } from '@/lib/badges/types';

export default function PlayerCardPage() {
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  // Stats
  const [totalMatches, setTotalMatches] = useState(0);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [winRate, setWinRate] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  
  // Badge & Titoli
  const [badgeResults, setBadgeResults] = useState<BadgeCheckResult[]>([]);
  const [dominantTitle, setDominantTitle] = useState<LeagueTitle | null>(null);
  const [leagueTitles, setLeagueTitles] = useState<LeagueTitle[]>([]);

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Profilo
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();
    setProfile(profileData);

    // Partite da leghe
    const { data: leagueMatches } = await supabase
      .from('matches')
      .select('*')
      .or(`player1_id.eq.${user.id},player2_id.eq.${user.id},player3_id.eq.${user.id},player4_id.eq.${user.id}`)
      .order('played_at', { ascending: false });

    // Quick matches
    const { data: quickMatches } = await supabase
      .from('quick_matches')
      .select('*')
      .eq('user_id', user.id)
      .order('played_at', { ascending: false });

    // Leghe create
    const { count: leaguesCreated } = await supabase
      .from('leagues')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', user.id);

    // Calcola stats base
    const allLeagueMatches = leagueMatches || [];
    const allQuickMatches = quickMatches || [];
    
    let w = 0, l = 0, streak = 0;
    let streakCounting = true;

    // League matches
    allLeagueMatches.forEach(match => {
      const inTeam1 = [match.player1_id, match.player2_id].includes(user.id);
      const won = (inTeam1 && match.winner_team === 1) || (!inTeam1 && match.winner_team === 2);
      
      if (won) {
        w++;
        if (streakCounting) streak++;
      } else {
        l++;
        streakCounting = false;
      }
    });

    // Quick matches
    allQuickMatches.forEach(match => {
      if (match.winner_team === 1) w++;
      else l++;
    });

    const total = w + l;
    setTotalMatches(total);
    setWins(w);
    setLosses(l);
    setWinRate(total > 0 ? Math.round((w / total) * 100) : 0);
    setCurrentStreak(streak);

    // === NUOVO SISTEMA BADGE ===
    
    // Carica membri per lega
    const leagueIds = [...new Set(allLeagueMatches.map(m => m.league_id).filter(Boolean))];
    
    const membersByLeague: Record<string, any[]> = {};
    const leagueNames: Record<string, string> = {};

    for (const leagueId of leagueIds) {
      const { data: members } = await supabase
        .from('league_members')
        .select('user_id, points')
        .eq('league_id', leagueId);
      
      const { data: league } = await supabase
        .from('leagues')
        .select('name')
        .eq('id', leagueId)
        .single();

      membersByLeague[leagueId] = members || [];
      leagueNames[leagueId] = league?.name || 'Lega';
    }

    // Calcola badge
    const allMembers = Object.values(membersByLeague).flat();
    const badges = checkBadges(allLeagueMatches, user.id, allMembers, leaguesCreated || 0);
    setBadgeResults(badges);

    // Calcola titoli per lega
    const titles: LeagueTitle[] = leagueIds.map(leagueId => 
      calculateLeagueTitle(
        allLeagueMatches,
        user.id,
        membersByLeague[leagueId] || [],
        leagueId,
        leagueNames[leagueId]
      )
    );
    setLeagueTitles(titles);

    // Titolo dominante
    const activeTitles = titles.filter(t => t.titleKey !== 'novizio');
    if (activeTitles.length > 0) {
      setDominantTitle(activeTitles.sort((a, b) => b.score - a.score)[0]);
    } else if (titles.length > 0) {
      setDominantTitle(titles[0]);
    }

    setLoading(false);
  };

  const handleShare = async () => {
    const name = profile?.full_name?.split(' ')[0] || 'Giocatore';
    const titleText = dominantTitle ? `${dominantTitle.titleEmoji} ${dominantTitle.titleName}` : '🎾 Giocatore';
    const text = `🎾 ${name} - ${titleText}\n\n📊 ${totalMatches} partite | ${winRate}% winrate\n🔥 Streak: ${currentStreak}\n\nScopri le tue stats su MyPadelog!`;

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
  const unlockedBadges = badgeResults.filter(b => b.unlocked);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #111 0%, #1a1a1a 100%)', padding: '24px', paddingBottom: '120px' }}>
      
      {/* Back */}
      <Link href="/profile" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '14px' }}>
        ← Profilo
      </Link>

      {/* Card */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #252525 100%)',
        borderRadius: '24px',
        padding: '32px 24px',
        marginTop: '16px',
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

        {/* Nome */}
        <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, textAlign: 'center', marginBottom: '4px' }}>
          {firstName}
        </h1>
        
        {/* TITOLO DOMINANTE */}
        {dominantTitle && (
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <p style={{ fontSize: '20px', marginBottom: '4px' }}>
              {dominantTitle.titleEmoji}
            </p>
            <p style={{ color: '#0E5E4A', fontSize: '18px', fontWeight: 700 }}>
              {dominantTitle.titleName}
            </p>
            <p style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
              {TITLES.find(t => t.key === dominantTitle.titleKey)?.description}
            </p>
          </div>
        )}

        {/* Stats Grid */}
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#fff', fontSize: '28px', fontWeight: 800 }}>{totalMatches}</p>
            <p style={{ color: '#666', fontSize: '12px' }}>Partite</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#0E5E4A', fontSize: '28px', fontWeight: 800 }}>{winRate}%</p>
            <p style={{ color: '#666', fontSize: '12px' }}>Winrate</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#F46A25', fontSize: '28px', fontWeight: 800 }}>{currentStreak}</p>
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
          <p style={{ color: '#22C55E', fontSize: '14px', fontWeight: 600 }}>✓ {wins} vinte</p>
          <p style={{ color: '#EF4444', fontSize: '14px', fontWeight: 600 }}>✗ {losses} perse</p>
        </div>

        {/* BADGE */}
        {unlockedBadges.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <p style={{ color: '#666', fontSize: '11px', fontWeight: 600 }}>BADGE</p>
              <Link href="/profile/badges" style={{ color: '#0E5E4A', fontSize: '11px', fontWeight: 600, textDecoration: 'none' }}>
                {unlockedBadges.length}/{BADGES.length} →
              </Link>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              {unlockedBadges.slice(0, 6).map(result => {
                const badge = BADGES.find(b => b.key === result.key);
                if (!badge) return null;
                return (
                  <div key={badge.key} style={{
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
                );
              })}
            </div>
          </div>
        )}

        {/* Titoli per lega (se più di una) */}
        {leagueTitles.length > 1 && (
          <div style={{ marginBottom: '24px' }}>
            <p style={{ color: '#666', fontSize: '11px', fontWeight: 600, marginBottom: '10px', textAlign: 'center' }}>
              I TUOI TITOLI
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              {leagueTitles.map(lt => (
                <div key={lt.leagueId} style={{
                  background: lt.leagueId === dominantTitle?.leagueId ? '#0E5E4A20' : '#252525',
                  border: lt.leagueId === dominantTitle?.leagueId ? '1px solid #0E5E4A' : '1px solid transparent',
                  borderRadius: '12px',
                  padding: '8px 12px',
                  textAlign: 'center'
                }}>
                  <span style={{ fontSize: '20px' }}>{lt.titleEmoji}</span>
                  <p style={{ color: '#fff', fontSize: '11px', fontWeight: 600, marginTop: '2px' }}>{lt.leagueName}</p>
                </div>
              ))}
            </div>
          </div>
        )}

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

      {/* Link a guida badge */}
      <Link href="/profile/badges" style={{ textDecoration: 'none' }}>
        <p style={{ color: '#666', fontSize: '14px', textAlign: 'center', marginTop: '16px' }}>
          📖 Scopri tutti i badge e titoli →
        </p>
      </Link>
    </div>
  );
}
