import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const firstName = profile?.full_name?.split(' ')[0] || 'Campione';

  // Leghe utente
  const { data: userLeagues } = await supabase
    .from('league_members')
    .select('league_id, points, wins, losses, league:leagues(id, name)')
    .eq('user_id', user.id);

  // Date
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const currentTime = now.toTimeString().slice(0, 5);

  // Prossimo evento (futuro)
  const { data: nextEvent } = await supabase
    .from('league_events')
    .select('*, league:leagues(id, name)')
    .eq('status', 'planned')
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .order('event_time', { ascending: true })
    .limit(1)
    .single();

  // Evento PASSATO oggi (per CTA "Com'è andata?")
  const { data: pastEventToday } = await supabase
    .from('league_events')
    .select('*, league:leagues(id, name)')
    .eq('event_date', today)
    .eq('status', 'planned')
    .lt('event_time', currentTime)
    .order('event_time', { ascending: false })
    .limit(1)
    .single();

  // Partita già registrata oggi?
  const { data: matchToday } = await supabase
    .from('matches')
    .select('id, score_team1, score_team2, winner_team, league_id')
    .or(`player1_id.eq.${user.id},player2_id.eq.${user.id},player3_id.eq.${user.id},player4_id.eq.${user.id}`)
    .gte('played_at', `${today}T00:00:00`)
    .lte('played_at', `${today}T23:59:59`)
    .order('played_at', { ascending: false })
    .limit(1)
    .single();

  const isEventToday = nextEvent?.event_date === today;
  const isEventTomorrow = nextEvent?.event_date === tomorrow;

  // Piano dal maestro
  const { data: newPlans } = await supabase
    .from('training_plans')
    .select('*, coach:profiles!training_plans_coach_id_fkey(full_name)')
    .eq('student_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1);

  // Partite recenti per streak
  const { data: recentMatches } = await supabase
    .from('matches')
    .select('*')
    .or(`player1_id.eq.${user.id},player2_id.eq.${user.id},player3_id.eq.${user.id},player4_id.eq.${user.id}`)
    .order('played_at', { ascending: false })
    .limit(20);

  let currentStreak = 0;
  for (const match of recentMatches || []) {
    const inTeam1 = [match.player1_id, match.player2_id].includes(user.id);
    const won = (inTeam1 && match.winner_team === 1) || (!inTeam1 && match.winner_team === 2);
    if (won) currentStreak++;
    else break;
  }

  // Stats settimana
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thisWeekMatches = recentMatches?.filter(m => new Date(m.played_at) >= oneWeekAgo) || [];
  const thisWeekWins = thisWeekMatches.filter(m => {
    const inTeam1 = [m.player1_id, m.player2_id].includes(user.id);
    return (inTeam1 && m.winner_team === 1) || (!inTeam1 && m.winner_team === 2);
  }).length;

  // Primary league - estrai id sicuro
  const primaryLeague = userLeagues?.[0];
  let primaryLeagueId: string | null = null;
  
  if (primaryLeague?.league) {
    // league può essere array o oggetto, gestiamo entrambi
    const leagueData = Array.isArray(primaryLeague.league) 
      ? primaryLeague.league[0] 
      : primaryLeague.league;
    primaryLeagueId = leagueData?.id || null;
  }

  return (
    <DashboardClient
      firstName={firstName}
      userLeagues={userLeagues || []}
      nextEvent={nextEvent}
      isEventToday={isEventToday}
      isEventTomorrow={isEventTomorrow}
      pastEventToday={pastEventToday}
      matchToday={matchToday}
      newPlan={newPlans?.[0] || null}
      currentStreak={currentStreak}
      thisWeekMatches={thisWeekMatches.length}
      thisWeekWins={thisWeekWins}
      primaryLeagueId={primaryLeagueId}
    />
  );
}
