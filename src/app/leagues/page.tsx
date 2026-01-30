'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface League {
  id: string;
  name: string;
  code: string;
  created_at: string;
  created_by: string;
  memberCount?: number;
  myPosition?: number;
  myPoints?: number;
}

export default function LeaguesPage() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');

  const supabase = createClient();

  useEffect(() => { loadLeagues(); }, []);

  const loadLeagues = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    const { data: memberships } = await supabase
      .from('league_members')
      .select('league_id, points, leagues(*)')
      .eq('user_id', user.id);

    if (memberships) {
      const enrichedLeagues = await Promise.all(
        memberships.map(async (m) => {
          const league = m.leagues as any;
          
          const { count } = await supabase
            .from('league_members')
            .select('*', { count: 'exact', head: true })
            .eq('league_id', m.league_id);

          const { data: allMembers } = await supabase
            .from('league_members')
            .select('user_id, points')
            .eq('league_id', m.league_id)
            .order('points', { ascending: false });

          const myPosition = allMembers?.findIndex(mem => mem.user_id === user.id) ?? -1;

          return {
            ...league,
            memberCount: count || 0,
            myPosition: myPosition + 1,
            myPoints: m.points
          };
        })
      );
      setLeagues(enrichedLeagues);
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    setMessage('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: league } = await supabase
      .from('leagues')
      .select('id')
      .eq('code', joinCode.toUpperCase())
      .single();

    if (!league) {
      setMessage('Codice non trovato');
      setJoining(false);
      return;
    }

    const { data: existing } = await supabase
      .from('league_members')
      .select('id')
      .eq('league_id', league.id)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      setMessage('Sei già in questa lega!');
      setJoining(false);
      return;
    }

    const { error } = await supabase.from('league_members').insert({
      league_id: league.id,
      user_id: user.id
    });

    if (error) {
      setMessage('Errore: ' + error.message);
    } else {
      setMessage('Unito alla lega! 🎉');
      setJoinCode('');
      loadLeagues();
    }
    setJoining(false);
  };

  const handleLeave = async (league: League, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Non puoi uscire se sei il creatore
    if (league.created_by === currentUserId) {
      alert('Non puoi uscire da una lega che hai creato. Puoi eliminarla dalle impostazioni della lega.');
      return;
    }

    if (!confirm(`Sei sicuro di voler uscire da "${league.name}"? Perderai tutti i tuoi punti e statistiche in questa lega.`)) return;
    
    setLeaving(league.id);

    const { error } = await supabase
      .from('league_members')
      .delete()
      .eq('league_id', league.id)
      .eq('user_id', currentUserId);

    if (!error) {
      setLeagues(leagues.filter(l => l.id !== league.id));
    }
    setLeaving(null);
  };

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
        background: 'linear-gradient(135deg, #0E5E4A 0%, #0A4A3A 100%)',
        padding: '48px 24px 32px',
        borderRadius: '0 0 32px 32px',
        marginBottom: '24px'
      }}>
        <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
          ← Dashboard
        </Link>
        <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>
          🏆 Le mie Leghe
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginTop: '4px' }}>
          Sfida i tuoi amici!
        </p>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Unisciti con codice */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '16px'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111', marginBottom: '12px' }}>
            🔗 Unisciti a una Lega
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Codice"
              maxLength={6}
              style={{
                flex: 1,
                padding: '14px 16px',
                fontSize: '18px',
                border: '2px solid #E5E5E5',
                borderRadius: '12px',
                textAlign: 'center',
                fontFamily: 'monospace',
                letterSpacing: '4px',
                textTransform: 'uppercase'
              }}
            />
            <button
              onClick={handleJoin}
              disabled={joining || !joinCode.trim()}
              style={{
                padding: '14px 20px',
                background: joinCode.trim() ? '#0E5E4A' : '#E5E5E5',
                color: joinCode.trim() ? '#fff' : '#999',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 700,
                cursor: joinCode.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              {joining ? '...' : 'Unisciti'}
            </button>
          </div>
          {message && (
            <p style={{
              marginTop: '12px',
              padding: '10px',
              borderRadius: '8px',
              fontSize: '14px',
              textAlign: 'center',
              background: message.includes('🎉') ? '#DCFCE7' : '#FEE2E2',
              color: message.includes('🎉') ? '#16A34A' : '#DC2626'
            }}>
              {message}
            </p>
          )}
        </div>

        {/* Crea Nuova Lega */}
        <Link href="/leagues/new" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'linear-gradient(135deg, #0E5E4A 0%, #0A4A3A 100%)',
            borderRadius: '16px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '20px'
          }}>
            <span style={{ fontSize: '20px' }}>➕</span>
            <span style={{ color: '#fff', fontSize: '16px', fontWeight: 700 }}>Crea Nuova Lega</span>
          </div>
        </Link>

        {/* Lista Leghe */}
        {leagues.length === 0 ? (
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '60px 20px',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>🏆</span>
            <p style={{ color: '#999', fontSize: '15px' }}>Nessuna lega ancora</p>
            <p style={{ color: '#999', fontSize: '13px' }}>Crea una lega o unisciti con un codice!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {leagues.map(league => (
              <div key={league.id} style={{ position: 'relative' }}>
                <Link href={`/leagues/${league.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: '#fff',
                    borderRadius: '20px',
                    padding: '20px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontWeight: 700, fontSize: '17px', color: '#111', marginBottom: '4px' }}>
                          🎾 {league.name}
                        </h3>
                        <p style={{ fontSize: '13px', color: '#666' }}>
                          👥 {league.memberCount} giocatori
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', marginRight: '40px' }}>
                        <p style={{
                          fontSize: '24px',
                          fontWeight: 800,
                          color: league.myPosition === 1 ? '#F4C430' : league.myPosition === 2 ? '#94A3B8' : league.myPosition === 3 ? '#CD7F32' : '#111'
                        }}>
                          {league.myPosition === 1 ? '🥇' : league.myPosition === 2 ? '🥈' : league.myPosition === 3 ? '🥉' : `#${league.myPosition}`}
                        </p>
                        <p style={{ fontSize: '12px', color: '#666' }}>{league.myPoints} pts</p>
                      </div>
                    </div>
                  </div>
                </Link>
                
                {/* Pulsante Esci */}
                <button
                  onClick={(e) => handleLeave(league, e)}
                  disabled={leaving === league.id}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '36px',
                    height: '36px',
                    background: '#FEE2E2',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px'
                  }}
                  title="Esci dalla lega"
                >
                  {leaving === league.id ? '...' : '🚪'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
