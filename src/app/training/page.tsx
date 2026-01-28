import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function TrainingListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const { data: cards } = await supabase
    .from('training_cards')
    .select('*')
    .eq('user_id', user.id)
    .order('training_date', { ascending: false });

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-lg mx-auto">
        
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard" className="text-[var(--color-blue)] font-medium">
            ← Indietro
          </Link>
          <h1 className="text-xl font-bold text-[var(--color-dark-blue)]">Le mie Schede</h1>
          <Link href="/training/new" className="btn-primary text-sm py-2 px-4">
            + Nuova
          </Link>
        </div>

        <div className="card">
          {!cards || cards.length === 0 ? (
            <p className="text-[var(--color-gray)] text-center py-8">
              Nessuna scheda ancora. Crea la prima!
            </p>
          ) : (
            <div className="space-y-3">
              {cards.map(card => (
                <Link
                  key={card.id}
                  href={`/training/${card.id}`}
                  className="block p-4 bg-[var(--color-light)] rounded-xl hover:bg-blue-50 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-[var(--color-dark-blue)]">
                        {card.session_type === 'training' ? '🏋️ Allenamento' : '🎮 Partita'}
                      </div>
                      <div className="text-sm text-[var(--color-gray)]">
                        {new Date(card.training_date).toLocaleDateString('it-IT', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long'
                        })}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {card.coach_feedback && (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                          👨‍🏫 Feedback!
                        </span>
                      )}
                      <span className="text-[var(--color-azure)]">→</span>
                    </div>
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
