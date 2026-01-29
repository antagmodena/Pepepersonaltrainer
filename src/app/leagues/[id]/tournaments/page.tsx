'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Tournament {
  id: string;
  name: string;
  type: string;
  status: string;
  created_at: string;
  playerCount?: number;
  matchCount?: number;
  completedMatches?: number;
}

export default function TournamentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: leagueId } = use(params);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [league, setLeague] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: leagueData } = await supabase
      .from('leagues')
      .select('*')
      .eq('id', leagueId)
      .single();
    setLeague(leagueData);

    const { data: tournamentsData } = await supabase
      .from('tournaments')
      .select('*')
      .eq('league_id', leagueId)
      .order('created_at', { ascending: false });

    // Arricchisci con conteggi
    const enriched = await Promise.all((tournamentsData || []).map(async (t) => {
      const { count: playerCount } = await supabase
        .from('tournament_players')
        .select('*', { count: 'exact', head: true })
        .eq('tournament_id', t.id);

      const { count: matchCount } = await supabase
        .from('tournament_matches')
        .select('*', { count: 'exact', head: true })
        .eq('tournament_id', t.id);

      const { count: completedMatches } = await supabase
        .from('tournament_matches')
        .select('*', { count: 'exact', head: true })
        .eq('tournament_id', t.id)
        .eq('status', 'completed');

      return { ...t, playerCount, matchCount, completedMatches };
    }));

    setTournaments(enriched);
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return { text: '📝 Iscrizioni aperte', bg: '#DCFCE7', color: '#16A34A' };
      case 'active': return { text: '🎾 In corso', bg: '#FEF3C7', color: '#D97706' };
      case 'completed': return { text: '🏆 Completato', bg: '#E0E7FF', color: '#4F46E5' };
      default: return { text: status, bg: '#F1F5F9', color: '#64748B' };
    }
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
      <div style={{
        background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
        padding: '48px 24px 32px',
        borderRadius: '0 0 32px 32px',
        marginBottom: '24px'
      }}>
        <Link href={`/leagues/${leagueId}`} style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
          ← {league?.name}
        </Link>
        <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>
          🎲 Tornei
        </h1>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Crea Nuovo */}
        <Link href={`/leagues/${leagueId}/tournaments/new`} style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)'
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
              ➕
            </div>
            <div>
              <p style={{ color: '#fff', fontSize: '17px', fontWeight: 700 }}>Nuovo Torneo</p>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>Roulette o Classico</p>
            </div>
          </div>
        </Link>

        {/* Lista Tornei */}
        {tournaments.length === 0 ? (
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '60px 20px',
            textAlign: 'center',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
          }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>🎲</span>
            <p style={{ color: '#94A3B8', fontSize: '15px' }}>Nessun torneo ancora</p>
            <p style={{ color: '#94A3B8', fontSize: '13px' }}>Crea il primo torneo!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tournaments.map(t => {
              const badge = getStatusBadge(t.status);
              return (
                <Link key={t.id} href={`/leagues/${leagueId}/tournaments/${t.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: '#fff',
                    borderRadius: '20px',
                    padding: '20px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <h3 style={{ fontWeight: 700, fontSize: '17px', color: '#1a1a2e', marginBottom: '4px' }}>
                          {t.type === 'roulette' ? '🎲' : '🏆'} {t.name}
                        </h3>
                        <span style={{
                          display: 'inline-block',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: badge.color,
                          background: badge.bg,
                          padding: '4px 10px',
                          borderRadius: '10px'
                        }}>
                          {badge.text}
                        </span>
                      </div>
                      <span style={{ color: '#CBD5E1', fontSize: '20px' }}>›</span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <span style={{ fontSize: '13px', color: '#64748B' }}>
                        👥 {t.playerCount} giocatori
                      </span>
                      {t.status !== 'open' && (
                        <span style={{ fontSize: '13px', color: '#64748B' }}>
                          🎾 {t.completedMatches}/{t.matchCount} partite
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
