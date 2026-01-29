'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Member {
  user_id: string;
  profile: { full_name: string } | null;
}

export default function PlanMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: leagueId } = use(params);
  const [league, setLeague] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [location, setLocation] = useState('');
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');
  const [player3, setPlayer3] = useState('');
  const [player4, setPlayer4] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: leagueData } = await supabase
      .from('leagues')
      .select('*')
      .eq('id', leagueId)
      .single();
    setLeague(leagueData);

    const { data: membersData } = await supabase
      .from('league_members')
      .select('user_id, profile:profiles(full_name)')
      .eq('league_id', leagueId);
    
    const formatted = (membersData || []).map((d: any) => ({
      user_id: d.user_id,
      profile: d.profile
    }));
    setMembers(formatted);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!eventDate) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('league_events').insert({
      league_id: leagueId,
      event_date: eventDate,
      event_time: eventTime || null,
      location: location || null,
      created_by: user.id,
      player1_id: player1 || null,
      player2_id: player2 || null,
      player3_id: player3 || null,
      player4_id: player4 || null,
      status: 'planned'
    });

    if (error) {
      alert('Errore: ' + error.message);
      setSaving(false);
      return;
    }

    router.push(`/leagues/${leagueId}`);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    fontSize: '15px',
    border: '2px solid #E2E8F0',
    borderRadius: '12px',
    background: '#fff'
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
        background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
        padding: '48px 24px 32px',
        borderRadius: '0 0 32px 32px',
        marginBottom: '24px'
      }}>
        <Link href={`/leagues/${leagueId}`} style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
          ← {league?.name}
        </Link>
        <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>
          📅 Pianifica Partita
        </h1>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Data e Ora */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '16px' }}>
            📆 Quando
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#64748B' }}>Data *</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#64748B' }}>Ora</label>
              <input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#64748B' }}>📍 Dove (opzionale)</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Es: Padel Club Bologna"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Giocatori (opzionale) */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '8px' }}>
            👥 Giocatori (opzionale)
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>
            Puoi sceglierli dopo o lasciare aperto
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <select value={player1} onChange={(e) => setPlayer1(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Giocatore 1</option>
              {members.map(m => (
                <option key={m.user_id} value={m.user_id}>{m.profile?.full_name || 'Giocatore'}</option>
              ))}
            </select>
            <select value={player2} onChange={(e) => setPlayer2(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Giocatore 2</option>
              {members.map(m => (
                <option key={m.user_id} value={m.user_id}>{m.profile?.full_name || 'Giocatore'}</option>
              ))}
            </select>
            <select value={player3} onChange={(e) => setPlayer3(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Giocatore 3</option>
              {members.map(m => (
                <option key={m.user_id} value={m.user_id}>{m.profile?.full_name || 'Giocatore'}</option>
              ))}
            </select>
            <select value={player4} onChange={(e) => setPlayer4(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Giocatore 4</option>
              {members.map(m => (
                <option key={m.user_id} value={m.user_id}>{m.profile?.full_name || 'Giocatore'}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Info */}
        <div style={{
          background: '#EFF6FF',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <p style={{ fontSize: '14px', color: '#1D4ED8' }}>
            💡 Tutti i membri della lega vedranno questa partita nel loro calendario!
          </p>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving || !eventDate}
          style={{
            width: '100%',
            padding: '18px',
            background: !eventDate ? '#E2E8F0' : 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
            color: !eventDate ? '#94A3B8' : '#fff',
            border: 'none',
            borderRadius: '14px',
            fontSize: '17px',
            fontWeight: 700,
            cursor: !eventDate ? 'not-allowed' : 'pointer',
            boxShadow: !eventDate ? 'none' : '0 8px 32px rgba(59, 130, 246, 0.3)'
          }}
        >
          {saving ? 'Salvataggio...' : '📅 Pianifica Partita'}
        </button>
      </div>
    </div>
  );
}
