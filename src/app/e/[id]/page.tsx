import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import EventClient from './EventClient';

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  // Load event + organizer name
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (!event) notFound();

  // Load organizer separately (safer than FK join)
  const { data: organizer } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('id', event.user_id)
    .single();

  // Load participants
  const { data: participants } = await supabase
    .from('event_participants')
    .select('*')
    .eq('event_id', id)
    .order('slot_position');

  // Load participant profiles separately
  const userIds = (participants || []).map(p => p.user_id).filter(Boolean);
  let profiles: Record<string, { id: string; full_name: string }> = {};
  
  if (userIds.length > 0) {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);
    
    (profilesData || []).forEach(p => {
      profiles[p.id] = p;
    });
  }

  // Attach profiles to participants
  const participantsWithProfiles = (participants || []).map(p => ({
    ...p,
    user: p.user_id ? profiles[p.user_id] || null : null
  }));

  return (
    <EventClient 
      event={{ ...event, organizer: organizer || null }} 
      participants={participantsWithProfiles} 
      currentUserId={user?.id || null}
    />
  );
}
