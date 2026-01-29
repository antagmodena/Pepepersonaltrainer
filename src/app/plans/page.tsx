import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function PlansPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isCoach = profile?.role === 'coach';

  // Coach vede i piani che ha creato, allievo vede i piani assegnati a lui
  const { data: plans } = await supabase
    .from('training_plans')
    .select('*, student:profiles!training_plans_student_id_fkey(full_name), coach:profiles!training_plans_coach_id_fkey(full_name)')
    .eq(isCoach ? 'coach_id' : 'student_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-lg mx-auto">
        
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard" className="text-[var(--color-blue)] font-medium">
            ← Indietro
          </Link>
          <h1 className="text-xl font-bold text-[var(--color-dark-blue)]">
            Piani Allenamento
          </h1>
          {isCoach ? (
            <Link href="/plans/new" className="btn-primary text-sm py-2 px-4">
              + Nuovo
            </Link>
          ) : (
            <div className="w-16"></div>
          )}
        </div>

        {!plans || plans.length === 0 ? (
          <div className="card text-center py-8">
            <span className="text-4xl mb-4 block">📋</span>
            <p className="text-[var(--color-gray)]">
              {isCoach ? 'Nessun piano creato ancora' : 'Nessun piano assegnato'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map(plan => (
              <Link key={plan.id} href={`/plans/${plan.id}`} className="card block hover:shadow-lg transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-[var(--color-dark-blue)]">{plan.title}</h3>
                    <p className="text-sm text-[var(--color-gray)]">
                      {isCoach ? `Per: ${plan.student?.full_name}` : `Da: ${plan.coach?.full_name}`}
                    </p>
                    <p className="text-sm text-[var(--color-gray)]">
                      {new Date(plan.start_date).toLocaleDateString('it-IT')} 
                      {plan.end_date && ` - ${new Date(plan.end_date).toLocaleDateString('it-IT')}`}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    plan.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {plan.status === 'active' ? 'Attivo' : 'Completato'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
