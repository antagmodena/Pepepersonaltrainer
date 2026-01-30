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
  const [currentUserId, setCurrentUserId] = useState('');
  const [team1, setTeam1] = useState<string[]>([]);
  const [team2, setTeam2] = useState<string[]>([]);
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
    setTeam1([user.id]); // Tu già selezionato!

    // Carica membri
    const { data: membersData } = await supabase
      .from('league_members')
      .select('user_id, handicap, points, wins, losses, profile:profiles(full_name)')
      .eq('league_id', leagueId);

    // Carica partite per ordinare per frequenza
    const { data: matchesData } = await supabase
      .from('matches')
      .select('player1_id, player2_id, player3_id, player4_id')
      .eq('league_id', leagueId);

    // Conta quante volte hai giocato con ciascuno
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

    // Formatta e ordina per frequenza
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
        if (playerId !== currentUserId) { // Non puoi togliere te stesso
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

  const getScoreString = (team: 'team1' | 'team2') => {
    return scores.slice(0, sets).map(s => s[team]).join('-');
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
        pointsWinner = 5; // Giant killer bonus!
        pointsLoser = 1;
      }
    }

    // Crea stringhe punteggio
    const score1 = scores.slice(0, sets).map(s => `${s.team1}-${s.team2}`).join(' ');
    const score2 = scores.slice(0, sets).map(s => `${s.team2}-${s.team1}`).join(' ');

    // Registra partita
    const { error } = await supabase.from('matches').insert({
      league_id: leagueId,
      player1_id: team1[0],
      player2_id: team1[1],
      player3_id: team2[0],
      player4_id: team2[1],
      score_team1: score1,
      score_team2: score2,
      winner_team: winner,
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <p style={{ color: '#94A3B8' }}>Caricamento...</p>
      </div>
    );
  }

  const canProceed = step === 1 ? team1.length === 2 : step === 2 ? team2.length === 2 : getWinner() !== 0;
  const otherMembers = members.filter(m => m.user_id !== currentUserId);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
      paddingBottom: '120px'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
        padding: '48px 24px 32px',
        borderRadius: '0 0 32px 32px',
        marginBottom: '24px'
      }}>
        <Link href={`/leagues/${leagueId}`} style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
          ← Annulla
        </Link>
        <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>
          🎾 Nuova Partita
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
            padding: '20px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
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
                <p style={{ fontWeight: 700, color: '#1a1a2e' }}>Tu</p>
                <p style={{ fontSize: '12px', color: '#22C55E' }}>✓ Già in squadra</p>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '12px' }}>
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
                      background: isSelected ? 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' : isInTeam2 ? '#E2E8F0' : '#F1F5F9',
                      color: isSelected ? '#fff' : isInTeam2 ? '#94A3B8' : '#1a1a2e',
                      fontSize: '15px',
                      fontWeight: 600,
                      cursor: isInTeam2 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
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
                background: '#EFF6FF',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '15px', color: '#1D4ED8', fontWeight: 600 }}>
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
            padding: '20px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
          }}>
            <div style={{
              marginBottom: '20px',
              padding: '16px',
              background: '#EFF6FF',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '13px', color: '#64748B' }}>La tua coppia</p>
              <p style={{ fontSize: '17px', color: '#1D4ED8', fontWeight: 700 }}>
                🔵 {getName(team1[0])} + {getName(team1[1])}
              </p>
            </div>

            <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '12px' }}>
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
                      background: isSelected ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' : isInTeam1 ? '#E2E8F0' : '#F1F5F9',
                      color: isSelected ? '#fff' : isInTeam1 ? '#94A3B8' : '#1a1a2e',
                      fontSize: '15px',
                      fontWeight: 600,
                      cursor: isInTeam1 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
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
                background: '#FEF2F2',
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

        {/* STEP 3: Score */}
        {step === 3 && (
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '20px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
          }}>
            {/* Teams recap */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>🔵 NOI</p>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#1D4ED8' }}>
                  {getName(team1[0])}<br/>{getName(team1[1])}
                </p>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#94A3B8', alignSelf: 'center' }}>VS</div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>🔴 LORO</p>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#DC2626' }}>
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
                    background: sets === n ? '#1a1a2e' : '#F1F5F9',
                    color: sets === n ? '#fff' : '#64748B',
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
                background: '#F8FAFC',
                borderRadius: '16px'
              }}>
                <p style={{ fontSize: '13px', color: '#64748B', width: '50px' }}>Set {i + 1}</p>
                
                {/* Team 1 score */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => updateScore(i, 'team1', -1)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      border: 'none',
                      background: '#E2E8F0',
                      fontSize: '20px',
                      cursor: 'pointer',
                      color: '#64748B'
                    }}
                  >−</button>
                  <span style={{
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#3B82F6',
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
                      background: '#3B82F6',
                      fontSize: '20px',
                      cursor: 'pointer',
                      color: '#fff'
                    }}
                  >+</button>
                </div>

                <span style={{ fontSize: '20px', fontWeight: 700, color: '#94A3B8' }}>-</span>

                {/* Team 2 score */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => updateScore(i, 'team2', -1)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      border: 'none',
                      background: '#E2E8F0',
                      fontSize: '20px',
                      cursor: 'pointer',
                      color: '#64748B'
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
                background: getWinner() === 1 ? '#EFF6FF' : '#FEF2F2',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '13px', color: '#64748B' }}>Vincitore</p>
                <p style={{ 
                  fontSize: '18px', 
                  fontWeight: 700, 
                  color: getWinner() === 1 ? '#1D4ED8' : '#DC2626',
                  marginTop: '4px'
                }}>
                  {getWinner() === 1 ? '🏆 ' : ''}
                  {getWinner() === 1 ? `${getName(team1[0])} + ${getName(team1[1])}` : `${getName(team2[0])} + ${getName(team2[1])}`}
                  {getWinner() === 2 ? ' 🏆' : ''}
                </p>
              </div>
            )}
          </div>
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
        background: 'linear-gradient(180deg, rgba(248,250,252,0) 0%, #F8FAFC 20%)',
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
              border: '2px solid #E2E8F0',
              borderRadius: '14px',
              fontSize: '16px',
              fontWeight: 600,
              color: '#64748B',
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
              background: canProceed ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : '#E2E8F0',
              border: 'none',
              borderRadius: '14px',
              fontSize: '16px',
              fontWeight: 700,
              color: canProceed ? '#fff' : '#94A3B8',
              cursor: canProceed ? 'pointer' : 'not-allowed',
              boxShadow: canProceed ? '0 8px 32px rgba(245, 158, 11, 0.3)' : 'none'
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
              background: canProceed ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)' : '#E2E8F0',
              border: 'none',
              borderRadius: '14px',
              fontSize: '16px',
              fontWeight: 700,
              color: canProceed ? '#fff' : '#94A3B8',
              cursor: canProceed ? 'pointer' : 'not-allowed',
              boxShadow: canProceed ? '0 8px 32px rgba(34, 197, 94, 0.3)' : 'none'
            }}
          >
            {saving ? 'Salvo...' : '✓ Registra'}
          </button>
        )}
      </div>
    </div>
  );
}
