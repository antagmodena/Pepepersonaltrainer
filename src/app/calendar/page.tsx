import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import CalendarView from './CalendarView';

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const { data: trainingCards } = await supabase
    .from('training_cards')
    .select('id, training_date, session_type, coach_feedback')
    .eq('user_id', user.id)
    .order('training_date', { ascending: false });

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-lg mx-auto">
        
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard" className="text-[var(--color-blue)] font-medium">
            ← Indietro
          </Link>
          <h1 className="text-xl font-bold text-[var(--color-dark-blue)]">Calendario</h1>
          <Link href="/training/new" className="btn-primary text-sm py-2 px-4">
            + Nuova
          </Link>
        </div>

        <CalendarView trainingCards={trainingCards || []} />

        <p className="text-center text-sm text-[var(--color-gray)] mt-4">
          Clicca su un giorno per vedere o creare una scheda
        </p>

      </div>
    </div>
  );
}
