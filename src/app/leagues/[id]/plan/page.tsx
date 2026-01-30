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
  const [recentLocations, setRecentLocations] = useState<string[]>([]);
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [location, setLocation] = useState('');
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');
  const [player3, setPlayer3] = useState('');
  const [player4, setPlayer4] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
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

    // Carica luoghi recenti
    const { data: eventsData } = await supabase
      .from('league_events')
      .select('location')
      .eq('league_id', leagueId)
      .not('location', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);

    // Estrai luoghi unici
    const locations = [...new Set(
      (eventsData || [])
        .map(e => e.location)
        .filter(Boolean)
    )].slice(0, 5);
    
    setRecentLocations(locations as string[]);
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

    setSaving(false);
    setSaved(true);
  };

  const formatDateForWhatsApp = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  const shareWhatsApp = () => {
    const dateText = formatDateForWhatsApp(eventDate);
    const timeText = eventTime ? ` ore ${eventTime}` : '';
    const locationText = location ? `\n📍 ${location}` : '';
    
    const selectedPlayers = [player1, player2, player3, player4]
      .filter(Boolean)
      .map(id => members.find(m => m.user_id === id)?.profile?.full_name?.split(' ')[0])
      .filter(Boolean);
    
    const playersText = selectedPlayers.length > 0 
      ? `\n👥 ${selectedPlayers.join(', ')}` 
      : '';

    const text = `🎾 Partita di Padel!

📅 ${dateText}${timeText}${locationText}${playersText}

Ci sei? 💪`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    fontSize: '15px',
    border: '2px solid #E2E8F0',
    borderRadius: '12px',
    background: '#fff',
    outline: 'none'
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAF7' }}>
        <p style={{ color: '#999' }}>Caricamento...</p>
      </div>
    );
  }

  // Schermata post-salvataggio
  if (saved) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1A8CD8 0%, #1565C0 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center'
      }}>
        <span style={{ fontSize: '64px', marginBottom: '20px' }}>📅</span>
        <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
          Partita pianificata!
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '15px', marginBottom: '32px' }}>
          {formatDateForWhatsApp(eventDate)}{eventTime ? ` alle ${eventTime}` : ''}
        </p>

        {/* WhatsApp CTA */}
        <button
          onClick={shareWhatsApp}
          style={{
            width: '100%',
            maxWidth: '320px',
            padding: '18px',
            background: '#25D366',
            color: '#fff',
            border: 'none',
            borderRadius: '14px',
            fontSize: '17px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '12px',
            boxShadow: '0 8px 24px rgba(37, 211, 102, 0.3)'
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Invita su WhatsApp
        </button>

        <button
          onClick={() => router.push(`/leagues/${leagueId}`)}
          style={{
            width: '100%',
            maxWidth: '320px',
            padding: '16px',
            background: 'rgba(255,255,255,0.2)',
            color: '#fff',
            border: 'none',
            borderRadius: '14px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Torna alla lega
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAFAF7',
      paddingBottom: '100px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1A8CD8 0%, #1565C0 100%)',
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
          marginBottom: '16px'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111', marginBottom: '16px' }}>
            📆 Quando
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#666' }}>Data *</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#666' }}>Ora</label>
              <input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Location con suggerimenti */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '16px'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111', marginBottom: '16px' }}>
            📍 Dove
          </h2>
          
          {/* Luoghi recenti */}
          {recentLocations.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>Luoghi recenti</p>
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
            style={inputStyle}
          />
        </div>

        {/* Giocatori */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '16px'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111', marginBottom: '8px' }}>
            👥 Giocatori
          </h2>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
            Opzionale - puoi sceglierli dopo
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { value: player1, setter: setPlayer1, label: 'Giocatore 1' },
              { value: player2, setter: setPlayer2, label: 'Giocatore 2' },
              { value: player3, setter: setPlayer3, label: 'Giocatore 3' },
              { value: player4, setter: setPlayer4, label: 'Giocatore 4' },
            ].map((p, i) => (
              <select
                key={i}
                value={p.value}
                onChange={(e) => p.setter(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="">{p.label}</option>
                {members.map(m => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.profile?.full_name || 'Giocatore'}
                  </option>
                ))}
              </select>
            ))}
          </div>
        </div>

        {/* Info */}
        <div style={{
          background: '#E8F4FC',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <p style={{ fontSize: '14px', color: '#1A8CD8' }}>
            💡 Dopo aver salvato potrai invitare gli amici su WhatsApp!
          </p>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving || !eventDate}
          style={{
            width: '100%',
            padding: '18px',
            background: !eventDate ? '#E5E5E5' : '#1A8CD8',
            color: !eventDate ? '#999' : '#fff',
            border: 'none',
            borderRadius: '14px',
            fontSize: '17px',
            fontWeight: 700,
            cursor: !eventDate ? 'not-allowed' : 'pointer',
            boxShadow: !eventDate ? 'none' : '0 8px 24px rgba(26, 140, 216, 0.35)'
          }}
        >
          {saving ? 'Salvataggio...' : '📅 Pianifica Partita'}
        </button>
      </div>
    </div>
  );
}
