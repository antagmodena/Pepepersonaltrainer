import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import CoachFeedbackForm from './CoachFeedbackForm';

export default async function TrainingCardDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string; cardId: string }> 
}) {
  const { id, cardId } = await params;
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

  const { data: card } = await supabase
    .from('training_cards')
    .select('*')
    .eq('id', cardId)
    .eq('user_id', id)
    .single();

  if (!card) {
    redirect(`/students/${id}`);
  }

  const { data: student } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', id)
    .single();

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-lg mx-auto">
        
        <div className="flex items-center justify-between mb-6">
          <Link href={`/students/${id}`} className="text-[var(--color-blue)] font-medium">
            ← Indietro
          </Link>
          <h1 className="text-xl font-bold text-[var(--color-dark-blue)]">Scheda</h1>
          <div className="w-16"></div>
        </div>

        <div className="header-gradient mb-6">
          <div className="text-sm text-blue-100">{student?.full_name}</div>
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
          </div>
        </div>

        {card.personal_notes && (
          <div className="card mb-4">
            <h3 className="section-title">📝 Note allievo</h3>
            <p className="text-[var(--color-gray)]">{card.personal_notes}</p>
          </div>
        )}

        {card.student_feedback && (
          <div className="card mb-4">
            <h3 className="section-title">💬 Feedback allievo</h3>
            <p className="text-[var(--color-gray)]">{card.student_feedback}</p>
          </div>
        )}

        <CoachFeedbackForm cardId={cardId} currentFeedback={card.coach_feedback || ''} />

      </div>
    </div>
  );
}
