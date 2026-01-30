import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import EventClient from './EventClient';

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  
  // Get current user (may be null for non-logged users)
  const { data: { user } } = await supabase.auth.getUser();

  // Load event
  const { data: event } = await supabase
    .from('events')
    .select(`
      *,
      organizer:profiles!events_user_id_fkey(id, full_name)
    `)
    .eq('id', id)
    .single();

  if (!event) notFound();

  // Load participants
  const { data: participants } = await supabase
    .from('event_participants')
    .select(`
      *,
      user:profiles(id, full_name)
    `)
    .eq('event_id', id)
    .order('slot_position');

  return (
    <EventClient 
      event={event} 
      participants={participants || []} 
      currentUserId={user?.id || null}
    />
  );
}
