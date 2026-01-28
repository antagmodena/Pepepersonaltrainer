import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const { data: link } = await supabase
    .from('student_coach_links')
    .select('*')
    .eq('coach_id', user.id)
    .eq('student_id', id)
    .eq('status', 'accepted')
    .single();

  if (!link) {
    redirect('/connections');
  }

  const { data: student } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  const { data: trainingCards } = await supabase
    .from('training_cards')
    .select('*')
    .eq('user_id', id)
    .order('training_date', { ascending: false });

  const { data: goals } = await supabase
    .from('season_goals')
    .select('*')
    .eq('user_id', id)
    .order('season_year', { ascending: false })
    .limit(1)
    .single();

  const { data: errors } = await supabase
    .from('common_errors')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-lg mx-auto">
        
        <div className="flex items-center justify-between mb-6">
          <Link href="/connections" className="text-[var(--color-blue)] font-medium">
            ← Indietro
          </Link>
          <h1 className="text-xl font-bold text-[var(--color-dark-blue)]">Allievo</h1>
          <div className="w-16"></div>
        </div>

        <div className="header-gradient mb-6">
          <h2 className="text-2xl font-bold">{student?.full_name || 'Allievo'}</h2>
          <p className="text-blue-100">{student?.email}</p>
        </div>

        {goals && (
          <div className="card mb-4">
            <h3 className="section-title">🎯 Obiettivi {goals.season_year}</h3>
            <div className="space-y-3 text-sm">
              {goals.technical_goal && <div><span className="font-semibold">Tecnico:</span> {goals.technical_goal}</div>}
              {goals.sports_goal && <div><span className="font-semibold">Sportivo:</span> {goals.sports_goal}</div>}
              {goals.mental_goal && <div><span className="font-semibold">Mentale:</span> {goals.mental_goal}</div>}
            </div>
          </div>
        )}

        {errors && (
          <div className="card mb-4">
            <h3 className="section-title">⚠️ Errori Comuni</h3>
            <div className="flex flex-wrap gap-2 text-sm">
              {errors.tech_simple_volley && <span className="bg-red-100 text-red-700 px-2 py-1 rounded">Volée semplici</span>}
              {errors.tech_late_hit && <span className="bg-red-100 text-red-700 px-2 py-1 rounded">Colpisco in ritardo</span>}
              {errors.tech_bandeja_bounce && <span className="bg-red-100 text-red-700 px-2 py-1 rounded">Bandeja rimbalzo</span>}
              {errors.tact_unclear_decisions && <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">Decisioni poco lucide</span>}
              {errors.mental_get_nervous && <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">Si innervosisce</span>}
              {errors.mental_lose_focus_after_error && <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">Perde concentrazione</span>}
            </div>
          </div>
        )}

        <div className="card">
          <h3 className="section-title">📝 Schede Allenamento</h3>
          {!trainingCards || trainingCards.length === 0 ? (
            <p className="text-[var(--color-gray)] text-center py-4">Nessuna scheda</p>
          ) : (
            <div className="space-y-3">
              {trainingCards.map(card => (
                <Link
                  key={card.id}
                  href={`/students/${id}/training/${card.id}`}
                  className="block p-3 bg-[var(--color-light)] rounded-xl hover:bg-blue-50 transition-all"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">
                        {card.session_type === 'training' ? '🏋️ Allenamento' : '🎮 Partita'}
                      </div>
                      <div className="text-sm text-[var(--color-gray)]">
                        {new Date(card.training_date).toLocaleDateString('it-IT')}
                      </div>
                    </div>
                    <div className="text-[var(--color-azure)]">→</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
