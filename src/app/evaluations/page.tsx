import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function EvaluationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isCoach = profile?.role === 'coach';

  const { data: evaluations } = await supabase
    .from('student_evaluations')
    .select('*, student:profiles!student_evaluations_student_id_fkey(full_name), coach:profiles!student_evaluations_coach_id_fkey(full_name)')
    .eq(isCoach ? 'coach_id' : 'student_id', user.id)
    .order('evaluation_date', { ascending: false });

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-lg mx-auto">
        
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard" className="text-[var(--color-blue)] font-medium">
            ← Indietro
          </Link>
          <h1 className="text-xl font-bold text-[var(--color-dark-blue)]">Valutazioni</h1>
          {isCoach ? (
            <Link href="/evaluations/new" className="btn-primary text-sm py-2 px-4">
              + Nuova
            </Link>
          ) : (
            <div className="w-16"></div>
          )}
        </div>

        {!evaluations || evaluations.length === 0 ? (
          <div className="card text-center py-8">
            <span className="text-4xl mb-4 block">📊</span>
            <p className="text-[var(--color-gray)]">
              {isCoach ? 'Nessuna valutazione creata' : 'Nessuna valutazione ricevuta'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {evaluations.map(ev => {
              const avgTech = Math.round(((ev.tech_volee || 0) + (ev.tech_bandeja || 0) + (ev.tech_smash || 0) + (ev.tech_servizio || 0) + (ev.tech_difesa || 0)) / 5);
              const avgTact = Math.round(((ev.tact_posizione || 0) + (ev.tact_lettura_gioco || 0) + (ev.tact_scelta_colpi || 0)) / 3);
              const avgPhys = Math.round(((ev.phys_velocita || 0) + (ev.phys_resistenza || 0)) / 2);
              const avgMental = Math.round(((ev.mental_concentrazione || 0) + (ev.mental_gestione_pressione || 0)) / 2);

              return (
                <Link key={ev.id} href={`/evaluations/${ev.id}`} className="card block hover:shadow-lg transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-[var(--color-dark-blue)]">
                        {isCoach ? ev.student?.full_name : ev.coach?.full_name}
                      </p>
                      <p className="text-sm text-[var(--color-gray)]">
                        {new Date(ev.evaluation_date).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-sm">
                    <div className="bg-blue-50 p-2 rounded-lg">
                      <div className="font-bold text-blue-600">{avgTech}</div>
                      <div className="text-xs text-[var(--color-gray)]">Tecnica</div>
                    </div>
                    <div className="bg-green-50 p-2 rounded-lg">
                      <div className="font-bold text-green-600">{avgTact}</div>
                      <div className="text-xs text-[var(--color-gray)]">Tattica</div>
                    </div>
                    <div className="bg-orange-50 p-2 rounded-lg">
                      <div className="font-bold text-orange-600">{avgPhys}</div>
                      <div className="text-xs text-[var(--color-gray)]">Fisico</div>
                    </div>
                    <div className="bg-purple-50 p-2 rounded-lg">
                      <div className="font-bold text-purple-600">{avgMental}</div>
                      <div className="text-xs text-[var(--color-gray)]">Mentale</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
