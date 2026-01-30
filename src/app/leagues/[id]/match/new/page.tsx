'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Member {
  user_id: string;
  handicap: number;
  points: number;
  wins: number;
  losses: number;
  profile: { full_name: string } | null;
  matchCount?: number;
}

export default function NewMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: leagueId } = use(params);
  const [members, setMembers] = useState<Member[]>([]);
  const [recentLocations, setRecentLocations] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [team1, setTeam1] = useState<string[]>([]);
  const [team2, setTeam2] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [scores, setScores] = useState([
    { team1: 0, team2: 0 },
    { team1: 0, team2: 0 },
    { team1: 0, team2: 0 }
  ]);
  const [sets, setSets] = useState(2);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1); // 1: team1, 2: team2, 3: score

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);
    setTeam1([user.id]);

    // Carica membri
    const { data: membersData } = await supabase
      .from('league_members')
      .select('user_id, handicap, points, wins, losses, profile:profiles(full_name)')
      .eq('league_id', leagueId);

    // Carica partite per frequenza
    const { data: matchesData } = await supabase
      .from('matches')
      .select('player1_id, player2_id, player3_id, player4_id, location')
      .eq('league_id', leagueId);

    // Conta frequenza giocatori
    const playCount: Record<string, number> = {};
    (matchesData || []).forEach(m => {
      const players = [m.player1_id, m.player2_id, m.player3_id, m.player4_id];
      if (players.includes(user.id)) {
        players.forEach(p => {
          if (p !== user.id) {
            playCount[p] = (playCount[p] || 0) + 1;
          }
        });
      }
    });

    // Luoghi recenti
    const locations = [...new Set(
      (matchesData || [])
        .map(m => m.location)
        .filter(Boolean)
    )].slice(0, 5);
    setRecentLocations(locations as string[]);

    // Formatta e ordina membri
    const formatted = (membersData || []).map((d: any) => ({
      user_id: d.user_id,
      handicap: d.handicap,
      points: d.points,
      wins: d.wins,
      losses: d.losses,
      profile: d.profile,
      matchCount: playCount[d.user_id] || 0
    })).sort((a, b) => b.matchCount - a.matchCount);

    setMembers(formatted);
    setLoading(false);
  };

  const togglePlayer = (playerId: string, team: 'team1' | 'team2') => {
    if (team === 'team1') {
      if (team1.includes(playerId)) {
        if (playerId !== currentUserId) {
          setTeam1(team1.filter(id => id !== playerId));
        }
      } else if (team1.length < 2 && !team2.includes(playerId)) {
        setTeam1([...team1, playerId]);
      }
    } else {
      if (team2.includes(playerId)) {
        setTeam2(team2.filter(id => id !== playerId));
      } else if (team2.length < 2 && !team1.includes(playerId)) {
        setTeam2([...team2, playerId]);
      }
    }
  };

  const updateScore = (setIndex: number, team: 'team1' | 'team2', delta: number) => {
    setScores(prev => {
      const newScores = [...prev];
      const newValue = newScores[setIndex][team] + delta;
      if (newValue >= 0 && newValue <= 7) {
        newScores[setIndex] = { ...newScores[setIndex], [team]: newValue };
      }
      return newScores;
    });
  };

  const getWinner = () => {
    let team1Sets = 0;
    let team2Sets = 0;
    scores.slice(0, sets).forEach(s => {
      if (s.team1 > s.team2) team1Sets++;
      else if (s.team2 > s.team1) team2Sets++;
    });
    if (team1Sets > team2Sets) return 1;
    if (team2Sets > team1Sets) return 2;
    return 0;
  };

  const handleSave = async () => {
    if (team1.length !== 2 || team2.length !== 2) return;
    const winner = getWinner();
    if (winner === 0) {
      alert('Risultato non valido - deve esserci un vincitore');
      return;
    }
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const getMember = (id: string) => members.find(m => m.user_id === id);

    // Calcola handicap
    const hc1 = (getMember(team1[0])?.handicap || 10) + (getMember(team1[1])?.handicap || 10);
    const hc2 = (getMember(team2[0])?.handicap || 10) + (getMember(team2[1])?.handicap || 10);
    const diff = Math.abs(hc1 - hc2);

    let pointsWinner = 3;
    let pointsLoser = 1;

    if (diff >= 5) {
      const favoritesWon = (winner === 1 && hc1 < hc2) || (winner === 2 && hc2 < hc1);
      if (favoritesWon) {
        pointsWinner = 2;
        pointsLoser = 1;
      } else {
        pointsWinner = 5;
        pointsLoser = 1;
      }
    }

    const score1 = scores.slice(0, sets).map(s => `${s.team1}-${s.team2}`).join(' ');
    const score2 = scores.slice(0, sets).map(s => `${s.team2}-${s.team1}`).join(' ');

    // Registra partita con location
    const { error } = await supabase.from('matches').insert({
      league_id: leagueId,
      player1_id: team1[0],
      player2_id: team1[1],
      player3_id: team2[0],
      player4_id: team2[1],
      score_team1: score1,
      score_team2: score2,
      winner_team: winner,
      location: location || null,
      registered_by: user.id
    });

    if (error) {
      alert('Errore: ' + error.message);
      setSaving(false);
      return;
    }

    // Aggiorna punti
    const winners = winner === 1 ? team1 : team2;
    const losers = winner === 1 ? team2 : team1;

    for (const playerId of winners) {
      const member = getMember(playerId);
      if (member) {
        await supabase
          .from('league_members')
          .update({
            points: member.points + pointsWinner,
            wins: member.wins + 1
          })
          .eq('league_id', leagueId)
          .eq('user_id', playerId);
      }
    }

    for (const playerId of losers) {
      const member = getMember(playerId);
      if (member) {
        await supabase
          .from('league_members')
          .update({
            points: member.points + pointsLoser,
            losses: member.losses + 1
          })
          .eq('league_id', leagueId)
          .eq('user_id', playerId);
      }
    }

    router.push(`/leagues/${leagueId}`);
  };

  const getName = (id: string) => {
    const m = members.find(m => m.user_id === id);
    return m?.profile?.full_name?.split(' ')[0] || 'Tu';
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAF7' }}>
        <p style={{ color: '#999' }}>Caricamento...</p>
      </div>
    );
  }

  const canProceed = step === 1 ? team1.length === 2 : step === 2 ? team2.length === 2 : getWinner() !== 0;
  const otherMembers = members.filter(m => m.user_id !== currentUserId);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAFAF7',
      paddingBottom: '120px'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1A8CD8 0%, #1565C0 100%)',
        padding: '48px 24px 32px',
        borderRadius: '0 0 32px 32px',
        marginBottom: '24px'
      }}>
        <Link href={`/leagues/${leagueId}`} style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
          ← Annulla
        </Link>
        <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>
          🎾 Registra Partita
        </h1>
        
        {/* Progress */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              flex: 1,
              height: '4px',
              borderRadius: '2px',
              background: step >= s ? '#fff' : 'rgba(255,255,255,0.3)'
            }} />
          ))}
        </div>
        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', marginTop: '8px' }}>
          {step === 1 ? '👥 Scegli il tuo compagno' : step === 2 ? '⚔️ Scegli gli avversari' : '📊 Inserisci il risultato'}
        </p>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* STEP 1: Team 1 */}
        {step === 1 && (
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: '#1A8CD8',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: '18px'
              }}>
                {getName(currentUserId).charAt(0)}
              </div>
              <div>
                <p style={{ fontWeight: 700, color: '#111' }}>Tu</p>
                <p style={{ fontSize: '12px', color: '#1A8CD8' }}>✓ Già in squadra</p>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
              Chi gioca con te?
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {otherMembers.map(m => {
                const isSelected = team1.includes(m.user_id);
                const isInTeam2 = team2.includes(m.user_id);
                return (
                  <button
                    key={m.user_id}
                    onClick={() => togglePlayer(m.user_id, 'team1')}
                    disabled={isInTeam2}
                    style={{
                      padding: '12px 20px',
                      borderRadius: '50px',
                      border: 'none',
                      background: isSelected ? '#1A8CD8' : isInTeam2 ? '#E5E5E5' : '#F5F5F3',
                      color: isSelected ? '#fff' : isInTeam2 ? '#999' : '#111',
                      fontSize: '15px',
                      fontWeight: 600,
                      cursor: isInTeam2 ? 'not-allowed' : 'pointer',
                      boxShadow: isSelected ? '0 4px 12px rgba(26, 140, 216, 0.3)' : 'none'
                    }}
                  >
                    {m.profile?.full_name?.split(' ')[0] || 'Giocatore'}
                    {m.matchCount && m.matchCount > 0 && (
                      <span style={{ marginLeft: '6px', opacity: 0.7, fontSize: '12px' }}>
                        ({m.matchCount})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {team1.length === 2 && (
              <div style={{
                marginTop: '20px',
                padding: '16px',
                background: '#E8F4FC',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '15px', color: '#1A8CD8', fontWeight: 600 }}>
                  🤝 Tu + {getName(team1[1])}
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Team 2 */}
        {step === 2 && (
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '20px'
          }}>
            <div style={{
              marginBottom: '20px',
              padding: '16px',
              background: '#E8F4FC',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '13px', color: '#666' }}>La tua coppia</p>
              <p style={{ fontSize: '17px', color: '#1A8CD8', fontWeight: 700 }}>
                🔵 {getName(team1[0])} + {getName(team1[1])}
              </p>
            </div>

            <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
              Chi avete sfidato?
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {otherMembers.map(m => {
                const isSelected = team2.includes(m.user_id);
                const isInTeam1 = team1.includes(m.user_id);
                return (
                  <button
                    key={m.user_id}
                    onClick={() => togglePlayer(m.user_id, 'team2')}
                    disabled={isInTeam1}
                    style={{
                      padding: '12px 20px',
                      borderRadius: '50px',
                      border: 'none',
                      background: isSelected ? '#EF4444' : isInTeam1 ? '#E5E5E5' : '#F5F5F3',
                      color: isSelected ? '#fff' : isInTeam1 ? '#999' : '#111',
                      fontSize: '15px',
                      fontWeight: 600,
                      cursor: isInTeam1 ? 'not-allowed' : 'pointer',
                      boxShadow: isSelected ? '0 4px 12px rgba(239, 68, 68, 0.3)' : 'none'
                    }}
                  >
                    {m.profile?.full_name?.split(' ')[0] || 'Giocatore'}
                  </button>
                );
              })}
            </div>

            {team2.length === 2 && (
              <div style={{
                marginTop: '20px',
                padding: '16px',
                background: '#FEE2E2',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '15px', color: '#DC2626', fontWeight: 600 }}>
                  ⚔️ {getName(team2[0])} + {getName(team2[1])}
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Score + Location */}
        {step === 3 && (
          <>
            <div style={{
              background: '#fff',
              borderRadius: '20px',
              padding: '20px',
              marginBottom: '16px'
            }}>
              {/* Teams recap */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>🔵 NOI</p>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#1A8CD8' }}>
                    {getName(team1[0])}<br/>{getName(team1[1])}
                  </p>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#999', alignSelf: 'center' }}>VS</div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>🔴 LORO</p>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#EF4444' }}>
                    {getName(team2[0])}<br/>{getName(team2[1])}
                  </p>
                </div>
              </div>

              {/* Set selector */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
                {[2, 3].map(n => (
                  <button
                    key={n}
                    onClick={() => setSets(n)}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '20px',
                      border: 'none',
                      background: sets === n ? '#111' : '#F5F5F3',
                      color: sets === n ? '#fff' : '#666',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {n} set
                  </button>
                ))}
              </div>

              {/* Score inputs */}
              {scores.slice(0, sets).map((score, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  marginBottom: '16px',
                  padding: '16px',
                  background: '#F5F5F3',
                  borderRadius: '16px'
                }}>
                  <p style={{ fontSize: '13px', color: '#666', width: '50px' }}>Set {i + 1}</p>
                  
                  {/* Team 1 score */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => updateScore(i, 'team1', -1)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        border: 'none',
                        background: '#E5E5E5',
                        fontSize: '20px',
                        cursor: 'pointer',
                        color: '#666'
                      }}
                    >−</button>
                    <span style={{
                      width: '44px',
                      height: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#1A8CD8',
                      color: '#fff',
                      borderRadius: '12px',
                      fontSize: '20px',
                      fontWeight: 700
                    }}>{score.team1}</span>
                    <button
                      onClick={() => updateScore(i, 'team1', 1)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        border: 'none',
                        background: '#1A8CD8',
                        fontSize: '20px',
                        cursor: 'pointer',
                        color: '#fff'
                      }}
                    >+</button>
                  </div>

                  <span style={{ fontSize: '20px', fontWeight: 700, color: '#999' }}>-</span>

                  {/* Team 2 score */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => updateScore(i, 'team2', -1)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        border: 'none',
                        background: '#E5E5E5',
                        fontSize: '20px',
                        cursor: 'pointer',
                        color: '#666'
                      }}
                    >−</button>
                    <span style={{
                      width: '44px',
                      height: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#EF4444',
                      color: '#fff',
                      borderRadius: '12px',
                      fontSize: '20px',
                      fontWeight: 700
                    }}>{score.team2}</span>
                    <button
                      onClick={() => updateScore(i, 'team2', 1)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        border: 'none',
                        background: '#EF4444',
                        fontSize: '20px',
                        cursor: 'pointer',
                        color: '#fff'
                      }}
                    >+</button>
                  </div>
                </div>
              ))}

              {/* Winner preview */}
              {getWinner() !== 0 && (
                <div style={{
                  marginTop: '16px',
                  padding: '16px',
                  background: getWinner() === 1 ? '#E8F4FC' : '#FEE2E2',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <p style={{ fontSize: '13px', color: '#666' }}>Vincitore</p>
                  <p style={{ 
                    fontSize: '18px', 
                    fontWeight: 700, 
                    color: getWinner() === 1 ? '#1A8CD8' : '#EF4444',
                    marginTop: '4px'
                  }}>
                    🏆 {getWinner() === 1 ? `${getName(team1[0])} + ${getName(team1[1])}` : `${getName(team2[0])} + ${getName(team2[1])}`}
                  </p>
                </div>
              )}
            </div>

            {/* Location (opzionale) */}
            <div style={{
              background: '#fff',
              borderRadius: '20px',
              padding: '20px'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#111', marginBottom: '12px' }}>
                📍 Dove avete giocato? <span style={{ color: '#999', fontWeight: 400 }}>(opzionale)</span>
              </h3>
              
              {/* Luoghi recenti */}
              {recentLocations.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {recentLocations.map((loc, i) => (
                      <button
                        key={i}
                        onClick={() => setLocation(loc)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '20px',
                          border: location === loc ? '2px solid #1A8CD8' : '2px solid #E5E5E5',
                          background: location === loc ? '#E8F4FC' : '#fff',
                          color: location === loc ? '#1A8CD8' : '#666',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Es: Padel Club Bologna"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '15px',
                  border: '2px solid #E5E5E5',
                  borderRadius: '12px',
                  background: '#fff',
                  outline: 'none'
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Bottom navigation */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '16px 20px',
        paddingBottom: '32px',
        background: 'linear-gradient(180deg, rgba(250,250,247,0) 0%, #FAFAF7 20%)',
        display: 'flex',
        gap: '12px'
      }}>
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            style={{
              flex: 1,
              padding: '16px',
              background: '#fff',
              border: '2px solid #E5E5E5',
              borderRadius: '14px',
              fontSize: '16px',
              fontWeight: 600,
              color: '#666',
              cursor: 'pointer'
            }}
          >
            ← Indietro
          </button>
        )}
        
        {step < 3 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed}
            style={{
              flex: 2,
              padding: '16px',
              background: canProceed ? '#1A8CD8' : '#E5E5E5',
              border: 'none',
              borderRadius: '14px',
              fontSize: '16px',
              fontWeight: 700,
              color: canProceed ? '#fff' : '#999',
              cursor: canProceed ? 'pointer' : 'not-allowed',
              boxShadow: canProceed ? '0 8px 24px rgba(26, 140, 216, 0.35)' : 'none'
            }}
          >
            Avanti →
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving || !canProceed}
            style={{
              flex: 2,
              padding: '16px',
              background: canProceed ? '#22C55E' : '#E5E5E5',
              border: 'none',
              borderRadius: '14px',
              fontSize: '16px',
              fontWeight: 700,
              color: canProceed ? '#fff' : '#999',
              cursor: canProceed ? 'pointer' : 'not-allowed',
              boxShadow: canProceed ? '0 8px 24px rgba(34, 197, 94, 0.35)' : 'none'
            }}
          >
            {saving ? 'Salvo...' : '✓ Registra'}
          </button>
        )}
      </div>
    </div>
  );
}
