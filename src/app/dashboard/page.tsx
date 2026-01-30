import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

const colors = {
  primary: '#0E5E4A',
  black: '#111111',
  background: '#FAFAF7',
  blue: '#1E6AE1',
  orange: '#F46A25',
  yellow: '#F4C430',
  gray: '#999999',
  lightGray: '#F5F5F3'
};

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

  // Prossimo evento
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  
  const { data: nextEvent } = await supabase
    .from('league_events')
    .select('*, league:leagues(name)')
    .eq('status', 'planned')
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .limit(1)
    .single();

  const isEventToday = nextEvent?.event_date === today;
  const isEventTomorrow = nextEvent?.event_date === tomorrow;
  const hasUrgentEvent = isEventToday || isEventTomorrow;

  // Piani dal maestro
  const { data: newPlans } = await supabase
    .from('training_plans')
    .select('*, coach:profiles!training_plans_coach_id_fkey(full_name)')
    .eq('student_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1);

  const hasNewPlan = newPlans && newPlans.length > 0;

  // Partite recenti
  const { data: recentMatches } = await supabase
    .from('matches')
    .select('*')
    .or(`player1_id.eq.${user.id},player2_id.eq.${user.id},player3_id.eq.${user.id},player4_id.eq.${user.id}`)
    .order('played_at', { ascending: false })
    .limit(20);

  // Calcola streak
  let currentStreak = 0;
  for (const match of recentMatches || []) {
    const inTeam1 = [match.player1_id, match.player2_id].includes(user.id);
    const won = (inTeam1 && match.winner_team === 1) || (!inTeam1 && match.winner_team === 2);
    if (won) currentStreak++;
    else break;
  }

  // Posizione classifica
  let currentPosition = 0;
  if (userLeagues && userLeagues.length > 0) {
    const { data: leagueMembers } = await supabase
      .from('league_members')
      .select('user_id, points')
      .eq('league_id', userLeagues[0].league_id)
      .order('points', { ascending: false });
    
    currentPosition = (leagueMembers?.findIndex(m => m.user_id === user.id) ?? -1) + 1;
  }

  // HERO Priority Stack
  type HeroType = 'event' | 'plan' | 'streak' | 'default';
  let heroType: HeroType = 'default';
  let heroData: any = {};

  if (hasUrgentEvent && nextEvent) {
    heroType = 'event';
    heroData = {
      date: nextEvent.event_date,
      time: nextEvent.event_time,
      location: nextEvent.location,
      league: (nextEvent.league as any)?.name,
      isToday: isEventToday
    };
  } else if (hasNewPlan && newPlans[0]) {
    heroType = 'plan';
    heroData = {
      title: newPlans[0].title,
      coach: (newPlans[0].coach as any)?.full_name?.split(' ')[0],
      id: newPlans[0].id
    };
  } else if (currentStreak >= 3) {
    heroType = 'streak';
    heroData = { streak: currentStreak };
  }

  // Stats settimana
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thisWeekMatches = recentMatches?.filter(m => new Date(m.played_at) >= oneWeekAgo) || [];
  const thisWeekWins = thisWeekMatches.filter(m => {
    const inTeam1 = [m.player1_id, m.player2_id].includes(user.id);
    return (inTeam1 && m.winner_team === 1) || (!inTeam1 && m.winner_team === 2);
  }).length;

  const primaryLeague = userLeagues?.[0];
  const hasLeagues = userLeagues && userLeagues.length > 0;

  return (
    <div style={{ minHeight: '100vh', background: colors.background, paddingBottom: '100px' }}>
      
      {/* Header */}
      <div style={{ padding: '48px 20px 16px', background: colors.background }}>
        <p style={{ color: colors.gray, fontSize: '14px' }}>Ciao</p>
        <h1 style={{ color: colors.black, fontSize: '28px', fontWeight: 700 }}>{firstName}</h1>
      </div>

      {/* HERO DINAMICO */}
      <div style={{ padding: '0 20px', marginBottom: '24px' }}>
        {heroType === 'event' && (
          <Link href="/calendar" style={{ textDecoration: 'none' }}>
            <div style={{
              background: colors.primary,
              borderRadius: '20px',
              padding: '24px',
              color: '#fff'
            }}>
              <p style={{ fontSize: '13px', opacity: 0.8, marginBottom: '8px' }}>
                {heroData.isToday ? '📅 OGGI' : '📅 DOMANI'}
              </p>
              <p style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>
                Partita alle {heroData.time?.slice(0,5) || '—'}
              </p>
              {heroData.location && (
                <p style={{ fontSize: '14px', opacity: 0.8 }}>📍 {heroData.location}</p>
              )}
              <p style={{ fontSize: '13px', opacity: 0.7, marginTop: '8px' }}>{heroData.league}</p>
            </div>
          </Link>
        )}

        {heroType === 'plan' && (
          <Link href={`/plans/${heroData.id}`} style={{ textDecoration: 'none' }}>
            <div style={{
              background: `linear-gradient(135deg, ${colors.blue} 0%, #0052CC 100%)`,
              borderRadius: '20px',
              padding: '24px',
              color: '#fff'
            }}>
              <p style={{ fontSize: '13px', opacity: 0.8, marginBottom: '8px' }}>👨‍🏫 NUOVO PIANO</p>
              <p style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>
                {heroData.title}
              </p>
              <p style={{ fontSize: '14px', opacity: 0.8 }}>da Coach {heroData.coach}</p>
              <div style={{
                marginTop: '16px',
                padding: '10px 20px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '10px',
                display: 'inline-block',
                fontSize: '14px',
                fontWeight: 600
              }}>
                Inizia ora →
              </div>
            </div>
          </Link>
        )}

        {heroType === 'streak' && (
          <div style={{
            background: `linear-gradient(135deg, ${colors.orange} 0%, #D35400 100%)`,
            borderRadius: '20px',
            padding: '24px',
            color: '#fff'
          }}>
            <p style={{ fontSize: '13px', opacity: 0.8, marginBottom: '8px' }}>🔥 SEI ON FIRE</p>
            <p style={{ fontSize: '28px', fontWeight: 800 }}>
              {heroData.streak} vittorie di fila!
            </p>
            <p style={{ fontSize: '14px', opacity: 0.8, marginTop: '4px' }}>Non fermarti ora</p>
          </div>
        )}

        {heroType === 'default' && (
          <Link
            href={hasLeagues ? `/leagues/${(primaryLeague?.league as any)?.id}/match/new` : '/leagues'}
            style={{ textDecoration: 'none' }}
          >
            <div style={{
              background: colors.primary,
              borderRadius: '20px',
              padding: '24px',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <span style={{ fontSize: '36px' }}>🎾</span>
              <div>
                <p style={{ fontSize: '20px', fontWeight: 700 }}>Registra partita</p>
                <p style={{ fontSize: '14px', opacity: 0.8 }}>20 secondi</p>
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* FEED */}
      <div style={{ padding: '0 20px' }}>
        
        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
          <Link href="/quick-match" style={{ textDecoration: 'none', flex: 1 }}>
            <div style={{
              background: '#fff',
              borderRadius: '14px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '24px' }}>⚡</span>
              <p style={{ fontSize: '12px', fontWeight: 600, color: colors.black, marginTop: '6px' }}>Partita Veloce</p>
            </div>
          </Link>
          <Link href="/profile/player-card" style={{ textDecoration: 'none', flex: 1 }}>
            <div style={{
              background: '#fff',
              borderRadius: '14px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '24px' }}>🏆</span>
              <p style={{ fontSize: '12px', fontWeight: 600, color: colors.black, marginTop: '6px' }}>Player Card</p>
            </div>
          </Link>
          <Link href="/companions" style={{ textDecoration: 'none', flex: 1 }}>
            <div style={{
              background: '#fff',
              borderRadius: '14px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '24px' }}>👥</span>
              <p style={{ fontSize: '12px', fontWeight: 600, color: colors.black, marginTop: '6px' }}>Compagni</p>
            </div>
          </Link>
        </div>

        {/* Stats Settimana */}
        {thisWeekMatches.length > 0 && (
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '12px'
          }}>
            <p style={{ fontSize: '12px', color: colors.gray, fontWeight: 600, marginBottom: '12px' }}>
              QUESTA SETTIMANA
            </p>
            <div style={{ display: 'flex', gap: '24px' }}>
              <div>
                <p style={{ fontSize: '28px', fontWeight: 700, color: colors.black }}>
                  {thisWeekMatches.length}
                </p>
                <p style={{ fontSize: '12px', color: colors.gray }}>partite</p>
              </div>
              <div>
                <p style={{ fontSize: '28px', fontWeight: 700, color: colors.primary }}>
                  {thisWeekWins}
                </p>
                <p style={{ fontSize: '12px', color: colors.gray }}>vittorie</p>
              </div>
              {currentPosition > 0 && (
                <div>
                  <p style={{ fontSize: '28px', fontWeight: 700, color: colors.blue }}>
                    #{currentPosition}
                  </p>
                  <p style={{ fontSize: '12px', color: colors.gray }}>classifica</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Leghe */}
        {hasLeagues && (
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <p style={{ fontSize: '12px', color: colors.gray, fontWeight: 600 }}>LE TUE LEGHE</p>
              <Link href="/leagues" style={{ fontSize: '12px', color: colors.primary, fontWeight: 600, textDecoration: 'none' }}>
                Tutte →
              </Link>
            </div>
            {userLeagues.slice(0, 2).map((ul: any) => (
              <Link key={ul.league_id} href={`/leagues/${ul.league?.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px',
                  background: colors.lightGray,
                  borderRadius: '12px',
                  marginBottom: '8px'
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, color: colors.black, fontSize: '15px' }}>{ul.league?.name}</p>
                    <p style={{ fontSize: '12px', color: colors.gray }}>{ul.wins}V - {ul.losses}P</p>
                  </div>
                  <p style={{ fontSize: '22px', fontWeight: 700, color: colors.primary }}>{ul.points}</p>
                </div>
              </Link>
            ))}
            <Link href="/leagues/new" style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '14px',
                border: '2px dashed #E0E0E0',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '14px', color: colors.gray, fontWeight: 500 }}>+ Nuova lega</p>
              </div>
            </Link>
          </div>
        )}

        {/* Se non ha leghe */}
        {!hasLeagues && (
          <Link href="/leagues/new" style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '12px',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>🏆</span>
              <p style={{ fontWeight: 700, color: colors.black, fontSize: '17px', marginBottom: '4px' }}>Crea la tua prima lega</p>
              <p style={{ fontSize: '14px', color: colors.gray }}>Invita amici e inizia a giocare!</p>
            </div>
          </Link>
        )}

        {/* Allenamento */}
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '12px'
        }}>
          <p style={{ fontSize: '12px', color: colors.gray, fontWeight: 600, marginBottom: '14px' }}>
            ALLENAMENTO
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            <Link href="/training" style={{ textDecoration: 'none' }}>
              <div style={{ textAlign: 'center', padding: '14px', background: colors.lightGray, borderRadius: '12px' }}>
                <span style={{ fontSize: '22px' }}>📝</span>
                <p style={{ fontSize: '12px', fontWeight: 600, color: colors.black, marginTop: '6px' }}>Schede</p>
              </div>
            </Link>
            <Link href="/plans" style={{ textDecoration: 'none' }}>
              <div style={{ textAlign: 'center', padding: '14px', background: colors.lightGray, borderRadius: '12px' }}>
                <span style={{ fontSize: '22px' }}>📋</span>
                <p style={{ fontSize: '12px', fontWeight: 600, color: colors.black, marginTop: '6px' }}>Piani</p>
              </div>
            </Link>
            <Link href="/connections" style={{ textDecoration: 'none' }}>
              <div style={{ textAlign: 'center', padding: '14px', background: colors.lightGray, borderRadius: '12px' }}>
                <span style={{ fontSize: '22px' }}>👨‍🏫</span>
                <p style={{ fontSize: '12px', fontWeight: 600, color: colors.black, marginTop: '6px' }}>Maestro</p>
              </div>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
