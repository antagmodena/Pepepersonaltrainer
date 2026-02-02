'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Participant {
  id: string;
  event_id: string;
  user_id: string | null;
  guest_name: string | null;
  slot_position: number;
  team: number;
  status: string;
  confirmed_at: string | null;
  user?: { id: string; full_name: string } | null;
}

interface Event {
  id: string;
  user_id: string;
  title: string;
  event_date: string;
  start_time: string;
  location: string | null;
  status: string;
  organizer?: { id: string; full_name: string } | null;
}

interface Props {
  event: Event;
  participants: Participant[];
  currentUserId: string | null;
}

export default function EventClient({ event, participants: initialParticipants, currentUserId }: Props) {
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants);
  const [joining, setJoining] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [animatingSlot, setAnimatingSlot] = useState<number | null>(null);
  
  const supabase = createClient();
  const router = useRouter();

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel(`event-${event.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_participants',
          filter: `event_id=eq.${event.id}`
        },
        async () => {
          // Reload participants
          const { data } = await supabase
            .from('event_participants')
            .select('*')
            .eq('event_id', event.id)
            .order('slot_position');
          
          if (data) {
            // Load profiles
            const uids = data.map(p => p.user_id).filter(Boolean);
            let profiles: Record<string, any> = {};
            if (uids.length > 0) {
              const { data: profs } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', uids);
              (profs || []).forEach(p => { profiles[p.id] = p; });
            }

            const updated = data.map(p => ({
              ...p,
              user: p.user_id ? profiles[p.user_id] || null : null
            }));

            // Find new confirmed
            const newConfirmed = updated.find(p => 
              p.status === 'confirmed' && 
              !participants.find(old => old.id === p.id && old.status === 'confirmed')
            );
            
            if (newConfirmed && newConfirmed.user_id !== currentUserId) {
              setAnimatingSlot(newConfirmed.slot_position);
              const name = newConfirmed.user?.full_name?.split(' ')[0] || newConfirmed.guest_name || 'Qualcuno';
              setShowToast(`${name} si è unito! 🎾`);
              if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
              setTimeout(() => { setAnimatingSlot(null); setShowToast(null); }, 3000);
            }
            
            setParticipants(updated);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [event.id]);

  // Slot logic
  const slots = [1, 2, 3, 4].map(pos => {
    const participant = participants.find(p => p.slot_position === pos);
    return {
      position: pos,
      team: pos <= 2 ? 1 : 2,
      participant,
      isEmpty: !participant || participant.status === 'declined',
      isConfirmed: participant?.status === 'confirmed',
      isInvited: participant?.status === 'invited'
    };
  });

  const confirmedCount = slots.filter(s => s.isConfirmed).length;
  const emptySlots = slots.filter(s => s.isEmpty);
  const isFull = confirmedCount >= 4;
  
  const isOrganizer = currentUserId === event.user_id;
  const myParticipation = participants.find(p => p.user_id === currentUserId);
  const alreadyJoined = myParticipation?.status === 'confirmed';

  const dateFormatted = new Date(event.event_date + 'T12:00:00').toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  const joinEvent = async () => {
    if (!currentUserId) {
      router.push(`/login?redirect=/e/${event.id}`);
      return;
    }

    if (isFull || alreadyJoined) return;
    setJoining(true);

    if (myParticipation) {
      // Already invited → just confirm MY existing slot
      const { error } = await supabase
        .from('event_participants')
        .update({ 
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        })
        .eq('id', myParticipation.id);

      if (!error) {
        if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
        setAnimatingSlot(myParticipation.slot_position);
        setShowToast('Hai confermato! 🎾');
        setTimeout(() => { setAnimatingSlot(null); setShowToast(null); }, 3000);
      }
    } else {
      // New player → find empty slot
      const emptySlot = emptySlots[0];
      if (!emptySlot) {
        alert('Nessun posto disponibile');
        setJoining(false);
        return;
      }

      const { error } = await supabase
        .from('event_participants')
        .insert({
          event_id: event.id,
          user_id: currentUserId,
          slot_position: emptySlot.position,
          team: emptySlot.team,
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        });

      if (!error) {
        if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
        setAnimatingSlot(emptySlot.position);
        setShowToast('Ti sei unito! 🎾');
        setTimeout(() => { setAnimatingSlot(null); setShowToast(null); }, 3000);
      }
    }

    setJoining(false);
    router.refresh();
  };

  const declineEvent = async () => {
    if (!currentUserId) return;

    if (myParticipation) {
      await supabase
        .from('event_participants')
        .update({ status: 'declined' })
        .eq('id', myParticipation.id);
    }

    router.refresh();
  };

  const shareWhatsApp = () => {
    const url = `${window.location.origin}/e/${event.id}`;
    const emptyCount = emptySlots.length;
    const needMore = emptyCount > 0 
      ? `\n👥 ${emptyCount === 1 ? 'Manca 1 giocatore!' : 'Mancano ' + emptyCount + ' giocatori!'}`
      : '\n✅ Partita al completo!';
    
    const playerNames = participants
      .filter(p => p.status === 'confirmed')
      .map(p => p.user?.full_name?.split(' ')[0] || p.guest_name || '?')
      .join(', ');

    const message = [
      '🎾 Partita di Padel!',
      '',
      `📅 ${dateFormatted} ore ${event.start_time?.slice(0,5)}`,
      event.location ? `📍 ${event.location}` : '',
      playerNames ? `👥 ${playerNames}` : '',
      needMore,
      '',
      'Conferma qui 👇',
      url
    ].filter(Boolean).join('\n');

    const waUrl = 'https://wa.me/?text=' + encodeURIComponent(message);
    window.open(waUrl, '_blank');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF7' }}>
      {/* Toast */}
      {showToast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#22C55E',
          color: '#fff',
          padding: '14px 24px',
          borderRadius: '30px',
          fontWeight: 700,
          fontSize: '15px',
          zIndex: 1000,
          boxShadow: '0 4px 20px rgba(34, 197, 94, 0.4)',
          animation: 'slideDown 0.3s ease'
        }}>
          {showToast}
        </div>
      )}

      {/* Header */}
      <div style={{
        background: isFull 
          ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)'
          : 'linear-gradient(135deg, #1A8CD8 0%, #1565C0 100%)',
        padding: '48px 20px 24px',
        borderRadius: '0 0 24px 24px'
      }}>
        <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '14px' }}>
          ← Home
        </Link>
        <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 800, marginTop: '8px' }}>
          🎾 {event.title}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px', marginTop: '8px' }}>
          📅 {dateFormatted} • {event.start_time?.slice(0, 5)}
        </p>
        {event.location && (
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginTop: '4px' }}>
            📍 {event.location}
          </p>
        )}
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginTop: '8px' }}>
          Organizzata da {event.organizer?.full_name || 'Anonimo'}
        </p>
      </div>

      <div style={{ padding: '20px' }}>
        
        {/* Status */}
        {isFull ? (
          <div style={{
            background: '#DCFCE7', border: '2px solid #22C55E', borderRadius: '14px',
            padding: '16px', marginBottom: '20px', textAlign: 'center'
          }}>
            <p style={{ fontSize: '16px', fontWeight: 700, color: '#16A34A' }}>✅ Partita al completo!</p>
            <p style={{ fontSize: '13px', color: '#16A34A', marginTop: '4px' }}>Ci vediamo in campo!</p>
          </div>
        ) : emptySlots.length > 0 ? (
          <div style={{
            background: '#FEF3C7', border: '2px solid #F59E0B', borderRadius: '14px',
            padding: '16px', marginBottom: '20px', textAlign: 'center'
          }}>
            <p style={{ fontSize: '16px', fontWeight: 700, color: '#D97706' }}>
              ⏳ {emptySlots.length === 1 ? 'Manca 1 giocatore!' : `Mancano ${emptySlots.length} giocatori!`}
            </p>
          </div>
        ) : (
          <div style={{
            background: '#E8F4FC', border: '2px solid #1A8CD8', borderRadius: '14px',
            padding: '16px', marginBottom: '20px', textAlign: 'center'
          }}>
            <p style={{ fontSize: '16px', fontWeight: 700, color: '#1A8CD8' }}>
              ⏳ In attesa di conferme ({confirmedCount}/4)
            </p>
          </div>
        )}

        {/* Campo */}
        <div style={{
          background: 'linear-gradient(180deg, #2E7D32 0%, #1B5E20 100%)',
          borderRadius: '20px', padding: '24px 20px', marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
            {slots.filter(s => s.team === 1).map(slot => (
              <SlotDisplay key={slot.position} slot={slot} isAnimating={animatingSlot === slot.position} />
            ))}
          </div>

          <div style={{
            height: '4px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px',
            margin: '8px 0', position: 'relative'
          }}>
            <div style={{
              position: 'absolute', left: '50%', top: '-10px', transform: 'translateX(-50%)',
              background: '#fff', padding: '4px 16px', borderRadius: '12px',
              fontSize: '11px', fontWeight: 700, color: '#1B5E20'
            }}>RETE</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
            {slots.filter(s => s.team === 2).map(slot => (
              <SlotDisplay key={slot.position} slot={slot} isAnimating={animatingSlot === slot.position} />
            ))}
          </div>
        </div>

        {/* Actions */}
        {!alreadyJoined && !isOrganizer && !isFull && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <button onClick={joinEvent} disabled={joining} style={{
              flex: 2, padding: '18px', background: '#22C55E', color: '#fff',
              border: 'none', borderRadius: '14px', fontSize: '17px', fontWeight: 700,
              cursor: 'pointer', opacity: joining ? 0.6 : 1
            }}>
              {joining ? 'Un momento...' : '✓ Ci sono!'}
            </button>
            {myParticipation && (
              <button onClick={declineEvent} style={{
                flex: 1, padding: '18px', background: '#FEE2E2', color: '#DC2626',
                border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: 600, cursor: 'pointer'
              }}>
                ✗ Non posso
              </button>
            )}
          </div>
        )}

        {alreadyJoined && (
          <div style={{
            background: '#DCFCE7', borderRadius: '14px', padding: '18px', textAlign: 'center', marginBottom: '16px'
          }}>
            <p style={{ fontSize: '16px', fontWeight: 700, color: '#16A34A' }}>✅ Hai confermato!</p>
            <button onClick={declineEvent} style={{
              marginTop: '12px', padding: '10px 20px', background: 'transparent',
              color: '#DC2626', border: 'none', fontSize: '14px', cursor: 'pointer'
            }}>
              Annulla partecipazione
            </button>
          </div>
        )}

        {/* Organizer: share again */}
        {isOrganizer && (
          <div style={{
            background: '#E8F4FC', borderRadius: '14px', padding: '18px', textAlign: 'center'
          }}>
            <p style={{ fontSize: '14px', color: '#1A8CD8', fontWeight: 600, marginBottom: '12px' }}>
              👑 Sei l'organizzatore
            </p>
            <button onClick={shareWhatsApp} style={{
              padding: '14px 24px', background: '#25D366', color: '#fff',
              border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '8px', width: '100%'
            }}>
              📲 Condividi su WhatsApp
            </button>
          </div>
        )}

        {/* Not logged in */}
        {!currentUserId && !isFull && (
          <div style={{
            background: '#fff', borderRadius: '14px', padding: '24px', textAlign: 'center', marginTop: '16px'
          }}>
            <p style={{ fontSize: '15px', color: '#666', marginBottom: '16px' }}>
              Accedi per confermare la tua partecipazione
            </p>
            <Link href={`/login?redirect=/e/${event.id}`} style={{
              display: 'inline-block', padding: '14px 32px', background: '#1A8CD8',
              color: '#fff', borderRadius: '12px', fontSize: '16px', fontWeight: 700, textDecoration: 'none'
            }}>
              Accedi
            </Link>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes slideDown {
          from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        @keyframes slotPop {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        @keyframes checkPop {
          0% { transform: scale(0) rotate(-180deg); opacity: 0; }
          70% { transform: scale(1.2) rotate(10deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

function SlotDisplay({ slot, isAnimating }: { 
  slot: { position: number; team: number; participant?: Participant; isEmpty: boolean; isConfirmed: boolean; isInvited: boolean };
  isAnimating: boolean;
}) {
  const name = slot.participant?.user?.full_name || slot.participant?.guest_name;
  const firstName = name?.split(' ')[0] || '';
  
  return (
    <div style={{
      width: '120px', height: '90px',
      background: slot.isEmpty 
        ? 'rgba(255,255,255,0.15)' 
        : 'rgba(255,255,255,0.95)',
      borderRadius: '16px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      border: slot.isEmpty ? '2px dashed rgba(255,255,255,0.4)' : 'none',
      animation: isAnimating ? 'slotPop 0.4s ease' : undefined,
      boxShadow: slot.isConfirmed ? '0 4px 12px rgba(34, 197, 94, 0.3)' : undefined
    }}>
      {slot.isEmpty ? (
        <>
          <span style={{ fontSize: '32px', color: 'rgba(255,255,255,0.5)' }}>+</span>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>Libero</span>
        </>
      ) : (
        <>
          <div style={{
            width: '40px', height: '40px',
            background: slot.isConfirmed ? '#22C55E' : '#F59E0B',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: '18px', marginBottom: '6px',
            animation: isAnimating ? 'checkPop 0.5s ease' : (slot.isInvited ? 'pulse 2s infinite' : undefined)
          }}>
            {slot.isConfirmed ? '✓' : '?'}
          </div>
          <p style={{ 
            fontSize: '13px', fontWeight: 600, color: '#111',
            maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>{firstName}</p>
          <p style={{ fontSize: '10px', color: '#666' }}>
            {slot.isConfirmed ? '✓ Confermato' : '⏳ Invitato'}
          </p>
        </>
      )}
    </div>
  );
}
