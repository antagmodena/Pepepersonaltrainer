'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Companion {
  id: string;
  name: string;
  matchCount: number;
}

interface Slot {
  position: number;
  team: number;
  userId?: string;
  name?: string;
  isMe?: boolean;
  status: 'empty' | 'filled' | 'confirmed';
}

export default function OrganizePage() {
  const [step, setStep] = useState(1);
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');
  
  // Event data
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('19:00');
  const [location, setLocation] = useState('');
  const [recentLocations, setRecentLocations] = useState<string[]>([]);
  
  // Slots (4 giocatori)
  const [slots, setSlots] = useState<Slot[]>([
    { position: 1, team: 1, status: 'empty' },
    { position: 2, team: 1, status: 'empty' },
    { position: 3, team: 2, status: 'empty' },
    { position: 4, team: 2, status: 'empty' },
  ]);
  
  // UI state
  const [showCompanionPicker, setShowCompanionPicker] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [creating, setCreating] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadData();
    // Default: domani
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setEventDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    setCurrentUserId(user.id);

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();
    
    const userName = profile?.full_name || 'Tu';
    setCurrentUserName(userName);
    
    // Set slot 1 as current user
    setSlots(prev => prev.map(s => 
      s.position === 1 
        ? { ...s, userId: user.id, name: userName, isMe: true, status: 'confirmed' as const }
        : s
    ));

    // Load companions
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

    // Match frequency
    const { data: matches } = await supabase
      .from('matches')
      .select('player1_id, player2_id, player3_id, player4_id, location')
      .or(`player1_id.eq.${user.id},player2_id.eq.${user.id},player3_id.eq.${user.id},player4_id.eq.${user.id}`);

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

    // Recent locations
    const locations = [...new Set((matches || []).map(m => m.location).filter(Boolean))].slice(0, 5);
    setRecentLocations(locations as string[]);

    // Load events locations too
    const { data: events } = await supabase
      .from('events')
      .select('location')
      .eq('user_id', user.id)
      .not('location', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);
    
    const eventLocations = [...new Set((events || []).map(e => e.location).filter(Boolean))];
    setRecentLocations(prev => [...new Set([...prev, ...eventLocations])].slice(0, 5) as string[]);

    const allIds = [...new Set([...allMemberIds, ...matchPlayerIds])];
    
    if (allIds.length > 0) {
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
    }

    setLoading(false);
  };

  const selectSlot = (position: number) => {
    if (slots.find(s => s.position === position)?.isMe) return;
    setShowCompanionPicker(position);
    setSearchQuery('');
  };

  const assignToSlot = (position: number, companion?: Companion, guestName?: string) => {
    setSlots(prev => prev.map(s => {
      if (s.position === position) {
        if (companion) {
          return { ...s, userId: companion.id, name: companion.name, status: 'filled' as const };
        } else if (guestName) {
          return { ...s, userId: undefined, name: guestName, status: 'filled' as const };
        }
      }
      return s;
    }));
    
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
    
    setShowCompanionPicker(null);
    setSearchQuery('');
  };

  const clearSlot = (position: number) => {
    setSlots(prev => prev.map(s => 
      s.position === position && !s.isMe
        ? { ...s, userId: undefined, name: undefined, status: 'empty' as const }
        : s
    ));
  };

  const filledSlots = slots.filter(s => s.status !== 'empty').length;
  const isLastSlot = filledSlots === 3;

  const createEvent = async () => {
    if (!eventDate || !eventTime) {
      alert('Seleziona data e ora');
      return;
    }

    setCreating(true);

    // Create event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        user_id: currentUserId,
        title: 'Partita di Padel',
        event_type: 'match',
        event_date: eventDate,
        start_time: eventTime,
        location: location || null,
        status: filledSlots >= 4 ? 'full' : 'open'
      })
      .select()
      .single();

    if (eventError || !event) {
      alert('Errore: ' + eventError?.message);
      setCreating(false);
      return;
    }

    // Add participants
    const participants = slots
      .filter(s => s.name)
      .map(s => ({
        event_id: event.id,
        user_id: s.userId || null,
        guest_name: s.userId ? null : s.name,
        slot_position: s.position,
        team: s.team,
        status: s.isMe ? 'confirmed' : 'invited'
      }));

    await supabase.from('event_participants').insert(participants);

    // Generate WhatsApp message
    const dateFormatted = new Date(eventDate).toLocaleDateString('it-IT', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
    
    const playerNames = slots.filter(s => s.name && !s.isMe).map(s => s.name).join(', ');
    const emptySlots = 4 - filledSlots;
    const needMore = emptySlots > 0 ? `\n👥 ${emptySlots === 1 ? 'Manca 1 giocatore!' : `Mancano ${emptySlots} giocatori!`}` : '';
    
    const eventUrl = `${window.location.origin}/e/${event.id}`;
    
    const message = `🎾 Partita di Padel!

📅 ${dateFormatted} ore ${eventTime}
📍 ${location || 'Da definire'}
👥 ${currentUserName}${playerNames ? ', ' + playerNames : ''}${needMore}

Conferma qui 👇
${eventUrl}`;

    // Open WhatsApp
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    
    // Redirect to event page
    router.push(`/e/${event.id}`);
  };

  const generateDateOptions = () => {
    const options = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      options.push({
        value: date.toISOString().split('T')[0],
        label: i === 0 ? 'Oggi' : i === 1 ? 'Domani' : date.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' })
      });
    }
    return options;
  };

  const timeOptions = ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'];

  const filteredCompanions = companions.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !slots.some(s => s.userId === c.id)
  );

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAF7' }}>
        <p style={{ color: '#999' }}>Caricamento...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF7', paddingBottom: '120px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1A8CD8 0%, #1565C0 100%)',
        padding: '48px 20px 24px',
        borderRadius: '0 0 24px 24px'
      }}>
        <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '14px' }}>
          ← Home
        </Link>
        <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 800, marginTop: '8px' }}>
          🎾 Organizza Partita
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginTop: '4px' }}>
          Invita gli amici e giocate!
        </p>
      </div>

      <div style={{ padding: '20px' }}>
        
        {/* Data e Ora */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: '20px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#666', marginBottom: '12px' }}>📅 QUANDO?</h2>
          
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px' }}>
            {generateDateOptions().slice(0, 7).map(opt => (
              <button
                key={opt.value}
                onClick={() => setEventDate(opt.value)}
                style={{
                  padding: '12px 16px',
                  background: eventDate === opt.value ? '#1A8CD8' : '#F5F5F3',
                  color: eventDate === opt.value ? '#fff' : '#666',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {timeOptions.map(time => (
              <button
                key={time}
                onClick={() => setEventTime(time)}
                style={{
                  padding: '10px 16px',
                  background: eventTime === time ? '#1A8CD8' : '#F5F5F3',
                  color: eventTime === time ? '#fff' : '#666',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        {/* Luogo */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: '20px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#666', marginBottom: '12px' }}>📍 DOVE?</h2>
          
          {recentLocations.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {recentLocations.map((loc, i) => (
                <button
                  key={i}
                  onClick={() => setLocation(loc)}
                  style={{
                    padding: '8px 14px',
                    background: location === loc ? '#E8F4FC' : '#F5F5F3',
                    border: location === loc ? '2px solid #1A8CD8' : '2px solid transparent',
                    color: location === loc ? '#1A8CD8' : '#666',
                    borderRadius: '20px',
                    fontSize: '13px',
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
              padding: '14px 16px',
              fontSize: '15px',
              border: '2px solid #E5E5E5',
              borderRadius: '12px',
              outline: 'none'
            }}
          />
        </div>

        {/* Campo Visuale */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: '20px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#666', marginBottom: '16px' }}>👥 CHI GIOCA?</h2>
          
          <div style={{
            background: 'linear-gradient(180deg, #2E7D32 0%, #1B5E20 100%)',
            borderRadius: '16px',
            padding: '20px',
            position: 'relative'
          }}>
            {/* Team 1 */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '16px' }}>
              {slots.filter(s => s.team === 1).map(slot => (
                <SlotCard
                  key={slot.position}
                  slot={slot}
                  isLastSlot={isLastSlot && slot.status === 'empty'}
                  onClick={() => slot.status === 'empty' ? selectSlot(slot.position) : null}
                  onClear={() => clearSlot(slot.position)}
                />
              ))}
            </div>

            {/* Rete */}
            <div style={{
              height: '4px',
              background: 'rgba(255,255,255,0.3)',
              borderRadius: '2px',
              margin: '8px 0',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                left: '50%',
                top: '-8px',
                transform: 'translateX(-50%)',
                background: '#fff',
                padding: '2px 12px',
                borderRadius: '10px',
                fontSize: '10px',
                fontWeight: 700,
                color: '#1B5E20'
              }}>
                RETE
              </div>
            </div>

            {/* Team 2 */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px' }}>
              {slots.filter(s => s.team === 2).map(slot => (
                <SlotCard
                  key={slot.position}
                  slot={slot}
                  isLastSlot={isLastSlot && slot.status === 'empty'}
                  onClick={() => slot.status === 'empty' ? selectSlot(slot.position) : null}
                  onClear={() => clearSlot(slot.position)}
                />
              ))}
            </div>
          </div>

          <p style={{ fontSize: '13px', color: '#999', textAlign: 'center', marginTop: '12px' }}>
            Tap su uno slot per aggiungere un giocatore
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={createEvent}
          disabled={creating || !eventDate || !eventTime}
          style={{
            width: '100%',
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
            gap: '10px',
            opacity: creating ? 0.6 : 1
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          {creating ? 'Creazione...' : 'Invia Inviti su WhatsApp'}
        </button>
      </div>

      {/* Companion Picker Modal */}
      {showCompanionPicker !== null && (
        <div
          onClick={() => setShowCompanionPicker(null)}
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
              👥 Aggiungi Giocatore
            </h2>

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

            {/* Nome manuale */}
            {searchQuery.trim() && !filteredCompanions.some(c => c.name.toLowerCase() === searchQuery.toLowerCase()) && (
              <button
                onClick={() => assignToSlot(showCompanionPicker, undefined, searchQuery.trim())}
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
                <p style={{ fontWeight: 600, color: '#1A8CD8' }}>✏️ Invita "{searchQuery.trim()}"</p>
                <p style={{ fontSize: '12px', color: '#666' }}>Nuovo giocatore</p>
              </button>
            )}

            {/* Lista compagni */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredCompanions.length === 0 && !searchQuery.trim() ? (
                <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
                  Scrivi un nome per invitare qualcuno
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredCompanions.slice(0, 15).map(c => (
                    <button
                      key={c.id}
                      onClick={() => assignToSlot(showCompanionPicker, c)}
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
                        width: '44px',
                        height: '44px',
                        background: c.matchCount > 0 ? '#1A8CD8' : '#E5E5E5',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: c.matchCount > 0 ? '#fff' : '#666',
                        fontWeight: 700,
                        fontSize: '18px'
                      }}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, color: '#111', fontSize: '16px' }}>{c.name}</p>
                        {c.matchCount > 0 && (
                          <p style={{ fontSize: '12px', color: '#666' }}>{c.matchCount} partite insieme</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Slot Card Component
function SlotCard({ 
  slot, 
  isLastSlot, 
  onClick, 
  onClear 
}: { 
  slot: Slot; 
  isLastSlot: boolean;
  onClick: () => void; 
  onClear: () => void;
}) {
  const isEmpty = slot.status === 'empty';
  
  return (
    <div
      onClick={isEmpty ? onClick : undefined}
      style={{
        width: '120px',
        height: '80px',
        background: isEmpty 
          ? (isLastSlot ? 'rgba(249, 115, 22, 0.3)' : 'rgba(255,255,255,0.15)')
          : 'rgba(255,255,255,0.95)',
        borderRadius: '14px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isEmpty ? 'pointer' : 'default',
        border: isLastSlot && isEmpty ? '2px dashed #F97316' : '2px solid transparent',
        position: 'relative',
        transition: 'all 0.2s ease',
        animation: slot.status === 'filled' ? 'slotFill 0.4s ease' : undefined
      }}
    >
      {isEmpty ? (
        <>
          <span style={{ 
            fontSize: '28px', 
            color: isLastSlot ? '#F97316' : 'rgba(255,255,255,0.6)',
            marginBottom: '4px'
          }}>
            +
          </span>
          {isLastSlot && (
            <span style={{ fontSize: '10px', color: '#F97316', fontWeight: 700 }}>
              ULTIMO!
            </span>
          )}
        </>
      ) : (
        <>
          <div style={{
            width: '36px',
            height: '36px',
            background: slot.isMe ? '#1A8CD8' : '#22C55E',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: '16px',
            marginBottom: '4px'
          }}>
            {slot.isMe ? '👤' : slot.name?.charAt(0).toUpperCase()}
          </div>
          <p style={{ 
            fontSize: '12px', 
            fontWeight: 600, 
            color: '#111',
            maxWidth: '100px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {slot.isMe ? 'Tu' : slot.name?.split(' ')[0]}
          </p>
          {!slot.isMe && (
            <button
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                width: '24px',
                height: '24px',
                background: '#EF4444',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          )}
        </>
      )}

      <style jsx>{`
        @keyframes slotFill {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); background: rgba(34, 197, 94, 0.3); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
