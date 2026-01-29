import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function TournamentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isCoach = profile?.role === 'coach';

  // Allievo vede i suoi tornei + quelli assegnati dal coach
  // Coach vede i tornei che ha assegnato
  const { data: tournaments } = await supabase
    .from('events')
    .select('*, created_for:profiles!events_created_for_user_id_fkey(full_name), created_by:profiles!events_created_by_coach_id_fkey(full_name)')
    .eq('is_tournament', true)
    .or(isCoach 
      ? `created_by_coach_id.eq.${user.id}` 
      : `user_id.eq.${user.id},created_for_user_id.eq.${user.id}`
    )
    .order('event_date', { ascending: true });

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-lg mx-auto">
        
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard" className="text-[var(--color-blue)] font-medium">
            ← Indietro
          </Link>
          <h1 className="text-xl font-bold text-[var(--color-dark-blue)]">Tornei</h1>
          <Link href="/tournaments/new" className="btn-primary text-sm py-2 px-4">
            + Nuovo
          </Link>
        </div>

        {!tournaments || tournaments.length === 0 ? (
          <div className="card text-center py-8">
            <span className="text-4xl mb-4 block">🏆</span>
            <p className="text-[var(--color-gray)]">Nessun torneo in programma</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tournaments.map(t => {
              const isPast = new Date(t.event_date) < new Date();
              const isAssignedByCoach = t.created_by_coach_id && !isCoach;

              return (
                <div key={t.id} className={`card ${isPast ? 'opacity-60' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-[var(--color-dark-blue)]">
                        🏆 {t.title}
                      </h3>
                      <p className="text-sm text-[var(--color-gray)]">
                        {new Date(t.event_date).toLocaleDateString('it-IT', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                      {t.location && (
                        <p className="text-sm text-[var(--color-gray)]">📍 {t.location}</p>
                      )}
                      {t.tournament_category && (
                        <span className="inline-block mt-2 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                          {t.tournament_category}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      {isAssignedByCoach && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          👨‍🏫 Assegnato
                        </span>
                      )}
                      {isCoach && t.created_for?.full_name && (
                        <p className="text-sm text-[var(--color-gray)] mt-1">
                          Per: {t.created_for.full_name}
                        </p>
                      )}
                    </div>
                  </div>
                  {t.notes && (
                    <p className="mt-3 text-sm text-[var(--color-gray)] border-t pt-3">
                      {t.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
