import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function EvaluationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login');

  const { data: ev } = await supabase
    .from('student_evaluations')
    .select('*, student:profiles!student_evaluations_student_id_fkey(full_name), coach:profiles!student_evaluations_coach_id_fkey(full_name)')
    .eq('id', id)
    .single();

  if (!ev) redirect('/evaluations');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isCoach = profile?.role === 'coach';

  const RatingBar = ({ label, value }: { label: string; value: number }) => (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="text-sm">{label}</span>
        <span className="font-bold text-[var(--color-blue)]">{value}/10</span>
      </div>
      <div className="h-3 bg-[var(--color-light)] rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[var(--color-azure)] to-[var(--color-blue)] rounded-full"
          style={{ width: `${value * 10}%` }}
        />
      </div>
    </div>
  );

  const avgTech = Math.round(((ev.tech_volee || 0) + (ev.tech_bandeja || 0) + (ev.tech_smash || 0) + (ev.tech_servizio || 0) + (ev.tech_difesa || 0)) / 5);
  const avgTact = Math.round(((ev.tact_posizione || 0) + (ev.tact_lettura_gioco || 0) + (ev.tact_scelta_colpi || 0)) / 3);
  const avgPhys = Math.round(((ev.phys_velocita || 0) + (ev.phys_resistenza || 0)) / 2);
  const avgMental = Math.round(((ev.mental_concentrazione || 0) + (ev.mental_gestione_pressione || 0)) / 2);
  const overall = Math.round((avgTech + avgTact + avgPhys + avgMental) / 4);

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-lg mx-auto">
        
        <div className="flex items-center justify-between mb-6">
          <Link href="/evaluations" className="text-[var(--color-blue)] font-medium">
            ← Indietro
          </Link>
          <h1 className="text-xl font-bold text-[var(--color-dark-blue)]">Valutazione</h1>
          <div className="w-16"></div>
        </div>

        <div className="header-gradient mb-6">
          <h2 className="text-xl font-bold">{isCoach ? ev.student?.full_name : ev.coach?.full_name}</h2>
          <p className="text-blue-100">
            {new Date(ev.evaluation_date).toLocaleDateString('it-IT', { 
              day: 'numeric', month: 'long', year: 'numeric' 
            })}
          </p>
          <div className="mt-3 bg-white/20 rounded-xl p-3 inline-block">
            <span className="text-3xl font-bold">{overall}</span>
            <span className="text-blue-100">/10 Media</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-6">
          <div className="card text-center p-3">
            <div className="text-2xl font-bold text-blue-600">{avgTech}</div>
            <div className="text-xs text-[var(--color-gray)]">Tecnica</div>
          </div>
          <div className="card text-center p-3">
            <div className="text-2xl font-bold text-green-600">{avgTact}</div>
            <div className="text-xs text-[var(--color-gray)]">Tattica</div>
          </div>
          <div className="card text-center p-3">
            <div className="text-2xl font-bold text-orange-600">{avgPhys}</div>
            <div className="text-xs text-[var(--color-gray)]">Fisico</div>
          </div>
          <div className="card text-center p-3">
            <div className="text-2xl font-bold text-purple-600">{avgMental}</div>
            <div className="text-xs text-[var(--color-gray)]">Mentale</div>
          </div>
        </div>

        <div className="card mb-4">
          <h3 className="section-title">🎾 Tecnica</h3>
          <RatingBar label="Volée" value={ev.tech_volee || 0} />
          <RatingBar label="Bandeja" value={ev.tech_bandeja || 0} />
          <RatingBar label="Smash" value={ev.tech_smash || 0} />
          <RatingBar label="Servizio" value={ev.tech_servizio || 0} />
          <RatingBar label="Difesa" value={ev.tech_difesa || 0} />
        </div>

        <div className="card mb-4">
          <h3 className="section-title">🧠 Tattica</h3>
          <RatingBar label="Posizione in campo" value={ev.tact_posizione || 0} />
          <RatingBar label="Lettura del gioco" value={ev.tact_lettura_gioco || 0} />
          <RatingBar label="Scelta dei colpi" value={ev.tact_scelta_colpi || 0} />
        </div>

        <div className="card mb-4">
          <h3 className="section-title">💪 Fisico</h3>
          <RatingBar label="Velocità" value={ev.phys_velocita || 0} />
          <RatingBar label="Resistenza" value={ev.phys_resistenza || 0} />
        </div>

        <div className="card mb-4">
          <h3 className="section-title">💭 Mentale</h3>
          <RatingBar label="Concentrazione" value={ev.mental_concentrazione || 0} />
          <RatingBar label="Gestione pressione" value={ev.mental_gestione_pressione || 0} />
        </div>

        {ev.notes && (
          <div className="card">
            <h3 className="section-title">📝 Note</h3>
            <p className="text-[var(--color-gray)]">{ev.notes}</p>
          </div>
        )}

      </div>
    </div>
  );
}
