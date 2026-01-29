import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login');

  // Training cards
  const { data: trainings } = await supabase
    .from('training_cards')
    .select('id, training_date, session_type')
    .eq('user_id', user.id)
    .order('training_date', { ascending: false });

  // Eventi delle leghe a cui partecipo
  const { data: myLeagues } = await supabase
    .from('league_members')
    .select('league_id')
    .eq('user_id', user.id);

  const leagueIds = myLeagues?.map(l => l.league_id) || [];

  let leagueEvents: any[] = [];
  if (leagueIds.length > 0) {
    const { data: events } = await supabase
      .from('league_events')
      .select('*, league:leagues(name)')
      .in('league_id', leagueIds)
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date', { ascending: true });
    leagueEvents = events || [];
  }

  // Raggruppa per data
  const eventsByDate: Record<string, any[]> = {};
  
  trainings?.forEach(t => {
    const date = t.training_date;
    if (!eventsByDate[date]) eventsByDate[date] = [];
    eventsByDate[date].push({ type: 'training', ...t });
  });

  leagueEvents.forEach(e => {
    const date = e.event_date;
    if (!eventsByDate[date]) eventsByDate[date] = [];
    eventsByDate[date].push({ type: 'league_event', ...e });
  });

  const sortedDates = Object.keys(eventsByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
      paddingBottom: '100px'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
        padding: '48px 24px 32px',
        borderRadius: '0 0 32px 32px',
        marginBottom: '24px'
      }}>
        <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
          ← Dashboard
        </Link>
        <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>
          📅 Calendario
        </h1>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Prossimi Eventi Lega */}
        {leagueEvents.length > 0 && (
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '16px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '16px' }}>
              🎾 Prossime Partite
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {leagueEvents.slice(0, 5).map(event => (
                <Link key={event.id} href={`/leagues/${event.league_id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    padding: '14px',
                    background: '#F5F3FF',
                    borderRadius: '12px',
                    border: '1px solid #DDD6FE'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a2e' }}>
                          {event.league?.name || 'Partita'}
                        </p>
                        <p style={{ fontSize: '12px', color: '#64748B' }}>
                          {event.location || 'Luogo da definire'}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontWeight: 700, fontSize: '14px', color: '#8B5CF6' }}>
                          {new Date(event.event_date).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </p>
                        {event.event_time && (
                          <p style={{ fontSize: '12px', color: '#64748B' }}>{event.event_time.slice(0, 5)}</p>
                        )}
                      </div>
                    </div>
                    {event.status === 'planned' && (
                      <div style={{
                        marginTop: '8px',
                        padding: '6px 10px',
                        background: '#FEF3C7',
                        borderRadius: '8px',
                        fontSize: '11px',
                        color: '#92400E',
                        textAlign: 'center'
                      }}>
                        ⏳ In attesa di risultato
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Storico */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '16px' }}>
            📝 Storico Attività
          </h2>
          {sortedDates.length === 0 ? (
            <p style={{ color: '#94A3B8', textAlign: 'center', padding: '20px' }}>
              Nessuna attività registrata
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sortedDates.slice(0, 20).map(date => (
                <div key={date}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '8px' }}>
                    {new Date(date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  {eventsByDate[date].map((event, i) => (
                    <div key={i} style={{
                      padding: '12px',
                      background: event.type === 'training' ? '#F0FDF4' : '#F5F3FF',
                      borderRadius: '10px',
                      marginBottom: '6px'
                    }}>
                      {event.type === 'training' ? (
                        <Link href={`/training/${event.id}`} style={{ textDecoration: 'none' }}>
                          <p style={{ fontWeight: 600, fontSize: '14px', color: '#16A34A' }}>
                            {event.session_type === 'training' ? '🏋️ Allenamento' : '🎮 Partita'}
                          </p>
                        </Link>
                      ) : (
                        <Link href={`/leagues/${event.league_id}`} style={{ textDecoration: 'none' }}>
                          <p style={{ fontWeight: 600, fontSize: '14px', color: '#8B5CF6' }}>
                            🎾 {event.league?.name}
                          </p>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
