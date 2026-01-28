import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function TrainingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const { data: card } = await supabase
    .from('training_cards')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!card) {
    redirect('/training');
  }

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-lg mx-auto">
        
        <div className="flex items-center justify-between mb-6">
          <Link href="/training" className="text-[var(--color-blue)] font-medium">
            ← Indietro
          </Link>
          <h1 className="text-xl font-bold text-[var(--color-dark-blue)]">Scheda</h1>
          <div className="w-16"></div>
        </div>

        <div className="header-gradient mb-6">
          <h2 className="text-xl font-bold">
            {card.session_type === 'training' ? '🏋️ Allenamento' : '🎮 Partita'}
          </h2>
          <p className="text-blue-100">
            {new Date(card.training_date).toLocaleDateString('it-IT', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </p>
          {card.partners && card.partners.length > 0 && (
            <p className="text-blue-100 text-sm mt-1">Con: {card.partners.join(', ')}</p>
          )}
        </div>

        {card.objective && (
          <div className="card mb-4">
            <h3 className="section-title">🎯 Obiettivo</h3>
            <p>{card.objective}</p>
          </div>
        )}

        <div className="card mb-4">
          <h3 className="section-title">✅ Cose fatte bene</h3>
          <div className="flex flex-wrap gap-2">
            {card.done_well_intensity && <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">Intensità</span>}
            {card.done_well_concentration && <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">Concentrazione</span>}
            {card.done_well_attitude && <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">Attitudine</span>}
            {card.done_well_other && <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">{card.done_well_other}</span>}
            {!card.done_well_intensity && !card.done_well_concentration && !card.done_well_attitude && !card.done_well_other && (
              <span className="text-[var(--color-gray)]">Nessuno selezionato</span>
            )}
          </div>
        </div>

        <div className="card mb-4">
          <h3 className="section-title">⚠️ Da migliorare</h3>
          <div className="flex flex-wrap gap-2">
            {card.improve_position && <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm">Posizione</span>}
            {card.improve_decision_making && <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm">Decisioni</span>}
            {card.improve_partner_communication && <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm">Comunicazione</span>}
            {card.improve_error_management && <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm">Gestione errori</span>}
            {card.improve_other && <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm">{card.improve_other}</span>}
            {!card.improve_position && !card.improve_decision_making && !card.improve_partner_communication && !card.improve_error_management && !card.improve_other && (
              <span className="text-[var(--color-gray)]">Nessuno selezionato</span>
            )}
          </div>
        </div>

        {card.personal_notes && (
          <div className="card mb-4">
            <h3 className="section-title">📝 Note personali</h3>
            <p className="text-[var(--color-gray)]">{card.personal_notes}</p>
          </div>
        )}

        {card.student_feedback && (
          <div className="card mb-4">
            <h3 className="section-title">💬 Il mio feedback</h3>
            <p className="text-[var(--color-gray)]">{card.student_feedback}</p>
          </div>
        )}

        {card.coach_feedback ? (
          <div className="card mb-4 border-2 border-[var(--color-azure)]">
            <h3 className="section-title">👨‍🏫 Feedback del Maestro</h3>
            <p className="text-[var(--color-dark-blue)]">{card.coach_feedback}</p>
            {card.coach_feedback_at && (
              <p className="text-xs text-[var(--color-gray)] mt-2">
                Ricevuto il {new Date(card.coach_feedback_at).toLocaleDateString('it-IT')}
              </p>
            )}
          </div>
        ) : (
          <div className="card mb-4 bg-[var(--color-light)]">
            <div className="text-center py-4 text-[var(--color-gray)]">
              <span className="text-2xl mb-2 block">👨‍🏫</span>
              <p>Nessun feedback del maestro ancora</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
