'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface Companion {
  id: string;
  name: string;
  matchCount: number;
}

function QuickMatchContent() {
  const [step, setStep] = useState(1);
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [loadingCompanions, setLoadingCompanions] = useState(true);
  
  // Players
  const [myPartner, setMyPartner] = useState('');
  const [opponent1, setOpponent1] = useState('');
  const [opponent2, setOpponent2] = useState('');
  
  // Selector modal
  const [showSelector, setShowSelector] = useState<'partner' | 'opp1' | 'opp2' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Score
  const [score, setScore] = useState({ team1: [0, 0, 0], team2: [0, 0, 0] });
  const [sets, setSets] = useState(2);
  const [location, setLocation] = useState('');
  const [recentLocations, setRecentLocations] = useState<string[]>([]);
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => { 
    loadCompanions();
    // Pre-fill from URL params
    const partnerParam = searchParams.get('partner');
    if (partnerParam) setMyPartner(partnerParam);
  }, [searchParams]);

  const loadCompanions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Carica membri delle leghe
    const { data: myMemberships } = await supabase
      .from('league_members')
      .select('league_id')
      .eq('user_id', user.id);

    const leagueIds = myMemberships?.map(m => m.league_id) || [];

    let allMemberIds: string[] = [];
    if (leagueIds.length > 0) {
      const { data: members } = await supabase
        .from('league_members')
        .select('user_id')
        .in('league_id', leagueIds)
        .neq('user_id', user.id);
      
      allMemberIds = [...new Set((members || []).map(m => m.user_id))];
    }

    // Carica partite per frequenza
    const { data: matches } = await supabase
      .from('matches')
      .select('player1_id, player2_id, player3_id, player4_id, location')
      .or(`player1_id.eq.${user.id},player2_id.eq.${user.id},player3_id.eq.${user.id},player4_id.eq.${user.id}`);

    // Conta frequenza
    const playCount: Record<string, number> = {};
    const matchPlayerIds = new Set<string>();
    
    (matches || []).forEach(m => {
      [m.player1_id, m.player2_id, m.player3_id, m.player4_id].forEach(id => {
        if (id && id !== user.id) {
          matchPlayerIds.add(id);
          playCount[id] = (playCount[id] || 0) + 1;
        }
      });
    });

    // Luoghi recenti
    const locations = [...new Set((matches || []).map(m => m.location).filter(Boolean))].slice(0, 5);
    setRecentLocations(locations as string[]);

    // Combina tutti
    const allIds = [...new Set([...allMemberIds, ...matchPlayerIds])];
    
    if (allIds.length === 0) {
      setLoadingCompanions(false);
      return;
    }

    // Carica profili
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', allIds);

    const companionList: Companion[] = (profiles || [])
      .map(p => ({
        id: p.id,
        name: p.full_name || 'Giocatore',
        matchCount: playCount[p.id] || 0
      }))
      .sort((a, b) => b.matchCount - a.matchCount);

    setCompanions(companionList);
    setLoadingCompanions(false);
  };

  const updateScore = (team: 1 | 2, setIndex: number, delta: number) => {
    setScore(prev => {
      const key = team === 1 ? 'team1' : 'team2';
      const newScores = [...prev[key]];
      newScores[setIndex] = Math.max(0, Math.min(7, newScores[setIndex] + delta));
      return { ...prev, [key]: newScores };
    });
  };

  const calculateWinner = () => {
    let team1Sets = 0;
    let team2Sets = 0;
    for (let i = 0; i < sets; i++) {
      if (score.team1[i] > score.team2[i]) team1Sets++;
      else if (score.team2[i] > score.team1[i]) team2Sets++;
    }
    return team1Sets > team2Sets ? 1 : team2Sets > team1Sets ? 2 : null;
  };

  const saveMatch = async () => {
    const calculatedWinner = calculateWinner();
    if (!calculatedWinner) {
      alert('Il punteggio deve avere un vincitore!');
      return;
    }

    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const scoreTeam1 = score.team1.slice(0, sets).join('-');
    const scoreTeam2 = score.team2.slice(0, sets).join('-');

    await supabase.from('quick_matches').insert({
      user_id: user.id,
      my_partner_name: myPartner.trim() || null,
      opponent1_name: opponent1.trim(),
      opponent2_name: opponent2.trim() || null,
      score_team1: scoreTeam1,
      score_team2: scoreTeam2,
      winner_team: calculatedWinner,
      location: location || null,
      played_at: new Date().toISOString()
    });

    setSaving(false);
    setSaved(true);
  };

  const shareWhatsApp = () => {
    const winner = calculateWinner();
    const myTeam = myPartner ? `io + ${myPartner}` : 'io';
    const theirTeam = opponent2 ? `${opponent1} + ${opponent2}` : opponent1;
    const scoreText = score.team1.slice(0, sets).map((s, i) => `${s}-${score.team2[i]}`).join(' ');
    const result = winner === 1 ? '🏆 Vittoria!' : '😤 Prossima volta!';
    const locationText = location ? `\n📍 ${location}` : '';
    
    const text = `🎾 Partita di Padel!\n\n${myTeam} vs ${theirTeam}\n📊 ${scoreText}\n${result}${locationText}`;
    const waUrl = 'https://wa.me/?text=' + encodeURIComponent(text);
    window.open(waUrl, '_blank');
  };

  const selectPlayer = (name: string) => {
    if (showSelector === 'partner') setMyPartner(name);
    else if (showSelector === 'opp1') setOpponent1(name);
    else if (showSelector === 'opp2') setOpponent2(name);
    setShowSelector(null);
    setSearchQuery('');
  };

  const filteredCompanions = companions.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    c.name !== myPartner && c.name !== opponent1 && c.name !== opponent2
  );

  // Saved screen
  if (saved) {
    const winner = calculateWinner();
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1A8CD8 0%, #1565C0 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '64px', marginBottom: '20px' }}>🎉</p>
        <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>
          Partita salvata!
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '15px', marginBottom: '32px' }}>
          {winner === 1 ? 'Hai vinto! 🏆' : 'Peccato, la prossima!'}
        </p>

        <button
          onClick={shareWhatsApp}
          style={{
            width: '100%',
            maxWidth: '300px',
            padding: '16px',
            background: '#25D366',
            color: '#fff',
            border: 'none',
            borderRadius: '14px',
            fontSize: '16px',
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Condividi su WhatsApp
        </button>

        <button
          onClick={() => router.push('/dashboard')}
          style={{
            width: '100%',
            maxWidth: '300px',
            padding: '16px',
            background: '#fff',
            color: '#1A8CD8',
            border: 'none',
            borderRadius: '14px',
            fontSize: '16px',
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: '12px'
          }}
        >
          Torna alla Home
        </button>

        <button
          onClick={() => {
            setSaved(false);
            setStep(1);
            setMyPartner('');
            setOpponent1('');
            setOpponent2('');
            setScore({ team1: [0, 0, 0], team2: [0, 0, 0] });
            setLocation('');
          }}
          style={{
            padding: '14px 40px',
            background: 'rgba(255,255,255,0.2)',
            color: '#fff',
            border: 'none',
            borderRadius: '14px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Registra un'altra
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF7', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1A8CD8 0%, #1565C0 100%)',
        padding: '48px 24px 32px',
        borderRadius: '0 0 32px 32px'
      }}>
        <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '14px' }}>
          ← Home
        </Link>
        <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 800, marginTop: '8px' }}>
          ⚡ Partita Veloce
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginTop: '4px' }}>
          Registra senza lega
        </p>
      </div>

      <div style={{ padding: '20px' }}>
        {/* Step 1: Giocatori */}
        {step === 1 && (
          <div style={{ background: '#fff', borderRadius: '20px', padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111', marginBottom: '20px' }}>
              Chi ha giocato?
            </h2>

            {/* La tua squadra */}
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#1A8CD8', marginBottom: '8px' }}>
                🔵 LA TUA SQUADRA
              </p>
              <p style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>Tu + compagno (opzionale)</p>
              <div
                onClick={() => setShowSelector('partner')}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '15px',
                  border: '2px solid #E5E5E5',
                  borderRadius: '12px',
                  background: '#fff',
                  cursor: 'pointer',
                  color: myPartner ? '#111' : '#999'
                }}
              >
                {myPartner || 'Tap per scegliere compagno'}
              </div>
            </div>

            {/* Avversari */}
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#EF4444', marginBottom: '8px' }}>
                🔴 AVVERSARI
              </p>
              <div
                onClick={() => setShowSelector('opp1')}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '15px',
                  border: '2px solid #E5E5E5',
                  borderRadius: '12px',
                  background: '#fff',
                  cursor: 'pointer',
                  marginBottom: '10px',
                  color: opponent1 ? '#111' : '#999'
                }}
              >
                {opponent1 || 'Avversario 1 *'}
              </div>
              <div
                onClick={() => setShowSelector('opp2')}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '15px',
                  border: '2px solid #E5E5E5',
                  borderRadius: '12px',
                  background: '#fff',
                  cursor: 'pointer',
                  color: opponent2 ? '#111' : '#999'
                }}
              >
                {opponent2 || 'Avversario 2 (opzionale)'}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!opponent1.trim()}
              style={{
                width: '100%',
                padding: '16px',
                background: opponent1.trim() ? '#1A8CD8' : '#E5E5E5',
                color: opponent1.trim() ? '#fff' : '#999',
                border: 'none',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: 700,
                cursor: opponent1.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              Continua →
            </button>
          </div>
        )}

        {/* Step 2: Punteggio */}
        {step === 2 && (
          <div style={{ background: '#fff', borderRadius: '20px', padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111', marginBottom: '20px' }}>
              Punteggio
            </h2>

            {/* Set selector */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', justifyContent: 'center' }}>
              {[2, 3].map(s => (
                <button
                  key={s}
                  onClick={() => setSets(s)}
                  style={{
                    padding: '10px 24px',
                    background: sets === s ? '#1A8CD8' : '#F5F5F3',
                    color: sets === s ? '#fff' : '#666',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {s} set
                </button>
              ))}
            </div>

            {/* Score inputs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              {Array.from({ length: sets }).map((_, setIndex) => (
                <div key={setIndex} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <p style={{ width: '50px', fontSize: '13px', color: '#666', fontWeight: 600 }}>
                    Set {setIndex + 1}
                  </p>
                  
                  {/* Team 1 */}
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <button
                      onClick={() => updateScore(1, setIndex, -1)}
                      style={{ width: '36px', height: '36px', background: '#F5F5F3', border: 'none', borderRadius: '8px', fontSize: '18px', cursor: 'pointer' }}
                    >-</button>
                    <span style={{ width: '40px', textAlign: 'center', fontSize: '24px', fontWeight: 700, color: '#1A8CD8' }}>
                      {score.team1[setIndex]}
                    </span>
                    <button
                      onClick={() => updateScore(1, setIndex, 1)}
                      style={{ width: '36px', height: '36px', background: '#E8F4FC', border: 'none', borderRadius: '8px', fontSize: '18px', cursor: 'pointer' }}
                    >+</button>
                  </div>

                  <span style={{ color: '#999' }}>-</span>

                  {/* Team 2 */}
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <button
                      onClick={() => updateScore(2, setIndex, -1)}
                      style={{ width: '36px', height: '36px', background: '#F5F5F3', border: 'none', borderRadius: '8px', fontSize: '18px', cursor: 'pointer' }}
                    >-</button>
                    <span style={{ width: '40px', textAlign: 'center', fontSize: '24px', fontWeight: 700, color: '#EF4444' }}>
                      {score.team2[setIndex]}
                    </span>
                    <button
                      onClick={() => updateScore(2, setIndex, 1)}
                      style={{ width: '36px', height: '36px', background: '#FEE2E2', border: 'none', borderRadius: '8px', fontSize: '18px', cursor: 'pointer' }}
                    >+</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Location */}
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#666', marginBottom: '8px' }}>
                📍 Dove? <span style={{ fontWeight: 400, color: '#999' }}>(opzionale)</span>
              </p>
              {recentLocations.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                  {recentLocations.map((loc, i) => (
                    <button
                      key={i}
                      onClick={() => setLocation(loc)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '20px',
                        border: location === loc ? '2px solid #1A8CD8' : '2px solid #E5E5E5',
                        background: location === loc ? '#E8F4FC' : '#fff',
                        color: location === loc ? '#1A8CD8' : '#666',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              )}
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Es: Padel Club Bologna"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: '14px',
                  border: '2px solid #E5E5E5',
                  borderRadius: '10px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Preview */}
            <div style={{ background: '#F5F5F3', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: '14px', fontWeight: 600, color: calculateWinner() === 1 ? '#1A8CD8' : '#666' }}>
                  {calculateWinner() === 1 && '🏆 '}Tu{myPartner ? ` + ${myPartner}` : ''}
                </p>
                <p style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                  {score.team1.slice(0, sets).join('-')}
                </p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <p style={{ fontSize: '14px', fontWeight: 600, color: calculateWinner() === 2 ? '#EF4444' : '#666' }}>
                  {calculateWinner() === 2 && '🏆 '}{opponent1}{opponent2 ? ` + ${opponent2}` : ''}
                </p>
                <p style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                  {score.team2.slice(0, sets).join('-')}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  flex: 1,
                  padding: '16px',
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
              <button
                onClick={saveMatch}
                disabled={!calculateWinner() || saving}
                style={{
                  flex: 2,
                  padding: '16px',
                  background: calculateWinner() ? '#22C55E' : '#E5E5E5',
                  color: calculateWinner() ? '#fff' : '#999',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: calculateWinner() ? 'pointer' : 'not-allowed'
                }}
              >
                {saving ? 'Salvataggio...' : '✓ Salva partita'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Player Selector Modal */}
      {showSelector && (
        <div
          onClick={() => { setShowSelector(null); setSearchQuery(''); }}
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
              maxHeight: '70vh',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111', marginBottom: '16px', textAlign: 'center' }}>
              {showSelector === 'partner' ? '🤝 Scegli compagno' : '⚔️ Scegli avversario'}
            </h2>

            {/* Search/Manual input */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca o scrivi nome..."
              autoFocus
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: '15px',
                border: '2px solid #E5E5E5',
                borderRadius: '12px',
                outline: 'none',
                marginBottom: '16px'
              }}
            />

            {/* Manual option */}
            {searchQuery.trim() && !filteredCompanions.some(c => c.name.toLowerCase() === searchQuery.toLowerCase()) && (
              <button
                onClick={() => selectPlayer(searchQuery.trim())}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: '#E8F4FC',
                  border: '2px solid #1A8CD8',
                  borderRadius: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  marginBottom: '12px'
                }}
              >
                <p style={{ fontWeight: 600, color: '#1A8CD8' }}>✏️ Usa "{searchQuery.trim()}"</p>
                <p style={{ fontSize: '12px', color: '#666' }}>Nuovo giocatore</p>
              </button>
            )}

            {/* Companions list */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loadingCompanions ? (
                <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>Caricamento...</p>
              ) : filteredCompanions.length === 0 ? (
                <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
                  {companions.length === 0 ? 'Nessun compagno salvato' : 'Nessun risultato'}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredCompanions.slice(0, 15).map(c => (
                    <button
                      key={c.id}
                      onClick={() => selectPlayer(c.name)}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        background: '#F5F5F3',
                        border: 'none',
                        borderRadius: '12px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      <div style={{
                        width: '40px',
                        height: '40px',
                        background: c.matchCount > 0 ? '#1A8CD8' : '#E5E5E5',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: c.matchCount > 0 ? '#fff' : '#666',
                        fontWeight: 700
                      }}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, color: '#111' }}>{c.name.split(' ')[0]}</p>
                        {c.matchCount > 0 && (
                          <p style={{ fontSize: '12px', color: '#666' }}>{c.matchCount} partite insieme</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Skip button for partner */}
            {showSelector === 'partner' && (
              <button
                onClick={() => { setMyPartner(''); setShowSelector(null); }}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'transparent',
                  border: 'none',
                  color: '#999',
                  fontSize: '14px',
                  cursor: 'pointer',
                  marginTop: '12px'
                }}
              >
                Salta (gioco da solo)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuickMatchPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAF7' }}>
        <p style={{ color: '#999' }}>Caricamento...</p>
      </div>
    }>
      <QuickMatchContent />
    </Suspense>
  );
}
