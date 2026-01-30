'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { BADGES, TITLES, getBadgesByCategory } from '@/lib/badges/definitions';
import { checkBadges, calculateLeagueTitle } from '@/lib/badges/calculator';
import { BadgeCheckResult, LeagueTitle } from '@/lib/badges/types';

export default function BadgesGuidePage() {
  const [loading, setLoading] = useState(true);
  const [badgeResults, setBadgeResults] = useState<BadgeCheckResult[]>([]);
  const [leagueTitles, setLeagueTitles] = useState<LeagueTitle[]>([]);
  const [dominantTitle, setDominantTitle] = useState<LeagueTitle | null>(null);
  const [activeTab, setActiveTab] = useState<'badges' | 'titles'>('badges');

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Carica tutte le partite
    const { data: matches } = await supabase
      .from('matches')
      .select('*')
      .or(`player1_id.eq.${user.id},player2_id.eq.${user.id},player3_id.eq.${user.id},player4_id.eq.${user.id}`);

    // Carica leghe create
    const { count: leaguesCreated } = await supabase
      .from('leagues')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', user.id);

    // Carica membri per lega
    const leagueIds = [...new Set((matches || []).map(m => m.league_id).filter(Boolean))];
    
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
    const badges = checkBadges(matches || [], user.id, allMembers, leaguesCreated || 0);
    setBadgeResults(badges);

    // Calcola titoli per lega
    const titles: LeagueTitle[] = leagueIds.map(leagueId => 
      calculateLeagueTitle(
        matches || [],
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

  const unlockedCount = badgeResults.filter(b => b.unlocked).length;
  const totalBadges = BADGES.length;

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
        background: 'linear-gradient(135deg, #111 0%, #1a1a1a 100%)',
        padding: '48px 24px 32px',
        borderRadius: '0 0 32px 32px',
        marginBottom: '24px'
      }}>
        <Link href="/profile" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '14px' }}>
          ← Profilo
        </Link>
        <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 800, marginTop: '8px' }}>
          🏆 Badge & Titoli
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginTop: '4px' }}>
          La tua storia di padel
        </p>
      </div>

      <div style={{ padding: '0 20px' }}>
        
        {/* Titolo Dominante */}
        {dominantTitle && (
          <div style={{
            background: 'linear-gradient(135deg, #0E5E4A 0%, #0A4A3A 100%)',
            borderRadius: '20px',
            padding: '24px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
              IL TUO TITOLO
            </p>
            <p style={{ fontSize: '48px', marginBottom: '8px' }}>{dominantTitle.titleEmoji}</p>
            <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>
              {dominantTitle.titleName}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginBottom: '12px' }}>
              {TITLES.find(t => t.key === dominantTitle.titleKey)?.description}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
              Basato su {dominantTitle.matchesAnalyzed} partite in "{dominantTitle.leagueName}"
            </p>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('badges')}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'badges' ? '#111' : '#fff',
              color: activeTab === 'badges' ? '#fff' : '#666',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            🎖️ Badge ({unlockedCount}/{totalBadges})
          </button>
          <button
            onClick={() => setActiveTab('titles')}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === 'titles' ? '#111' : '#fff',
              color: activeTab === 'titles' ? '#fff' : '#666',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            👤 Titoli ({leagueTitles.length})
          </button>
        </div>

        {/* BADGE TAB */}
        {activeTab === 'badges' && (
          <>
            {/* Come funzionano */}
            <div style={{
              background: '#E8F5E9',
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <p style={{ fontSize: '13px', color: '#0E5E4A', lineHeight: 1.5 }}>
                <strong>I badge sono permanenti.</strong> Una volta sbloccati, sono tuoi per sempre. Raccontano cosa hai fatto nella tua storia di padel.
              </p>
            </div>

            {/* Badge per categoria */}
            {(['milestone', 'achievement', 'social'] as const).map(category => {
              const categoryBadges = getBadgesByCategory(category);
              const categoryNames = {
                milestone: '📊 Traguardi',
                achievement: '⚡ Imprese',
                social: '👥 Comunità'
              };

              return (
                <div key={category} style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#666', marginBottom: '12px' }}>
                    {categoryNames[category]}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {categoryBadges.map(badge => {
                      const result = badgeResults.find(b => b.key === badge.key);
                      const unlocked = result?.unlocked || false;
                      const progress = result?.progress;
                      const total = result?.total;

                      return (
                        <div key={badge.key} style={{
                          background: '#fff',
                          borderRadius: '16px',
                          padding: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          opacity: unlocked ? 1 : 0.6,
                          border: unlocked ? '2px solid #0E5E4A' : '2px solid transparent'
                        }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: unlocked ? '#E8F5E9' : '#F5F5F3',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px'
                          }}>
                            {unlocked ? badge.emoji : '🔒'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 700, color: '#111', fontSize: '15px' }}>
                              {badge.name}
                              {unlocked && <span style={{ color: '#0E5E4A', marginLeft: '8px' }}>✓</span>}
                            </p>
                            <p style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>
                              {badge.hint}
                            </p>
                            {!unlocked && progress !== undefined && total !== undefined && (
                              <div style={{ marginTop: '8px' }}>
                                <div style={{
                                  height: '4px',
                                  background: '#E5E5E5',
                                  borderRadius: '2px',
                                  overflow: 'hidden'
                                }}>
                                  <div style={{
                                    height: '100%',
                                    width: `${Math.min(100, (progress / total) * 100)}%`,
                                    background: '#0E5E4A',
                                    borderRadius: '2px'
                                  }} />
                                </div>
                                <p style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                                  {progress}/{total}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* TITLES TAB */}
        {activeTab === 'titles' && (
          <>
            {/* Come funzionano */}
            <div style={{
              background: '#FEF3C7',
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <p style={{ fontSize: '13px', color: '#92400E', lineHeight: 1.5 }}>
                <strong>I titoli cambiano.</strong> Raccontano chi sei <em>adesso</em> in base al tuo stile di gioco recente. Puoi avere un titolo diverso in ogni lega!
              </p>
            </div>

            {/* I tuoi titoli per lega */}
            {leagueTitles.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#666', marginBottom: '12px' }}>
                  🎾 I tuoi titoli per lega
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {leagueTitles.map(lt => (
                    <div key={lt.leagueId} style={{
                      background: '#fff',
                      borderRadius: '16px',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px'
                    }}>
                      <span style={{ fontSize: '32px' }}>{lt.titleEmoji}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 700, color: '#111', fontSize: '15px' }}>
                          {lt.titleName}
                        </p>
                        <p style={{ fontSize: '13px', color: '#666' }}>
                          {lt.leagueName} • {lt.matchesAnalyzed} partite
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tutti i titoli possibili */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#666', marginBottom: '12px' }}>
                📖 Tutti i titoli
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {TITLES.filter(t => t.key !== 'novizio').map(title => {
                  const hasTitle = leagueTitles.some(lt => lt.titleKey === title.key);
                  
                  return (
                    <div key={title.key} style={{
                      background: '#fff',
                      borderRadius: '16px',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      border: hasTitle ? '2px solid #F59E0B' : '2px solid transparent'
                    }}>
                      <span style={{ fontSize: '28px' }}>{title.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 700, color: '#111', fontSize: '15px' }}>
                          {title.name}
                          {hasTitle && <span style={{ color: '#F59E0B', marginLeft: '8px', fontSize: '12px' }}>ATTIVO</span>}
                        </p>
                        <p style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>
                          {title.description}
                        </p>
                        <p style={{ fontSize: '12px', color: '#999', marginTop: '6px', fontStyle: 'italic' }}>
                          💡 {title.howToEarn}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
