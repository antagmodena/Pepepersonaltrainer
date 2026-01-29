import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login');

  const { data: plan } = await supabase
    .from('training_plans')
    .select('*, student:profiles!training_plans_student_id_fkey(full_name), coach:profiles!training_plans_coach_id_fkey(full_name)')
    .eq('id', id)
    .single();

  if (!plan) redirect('/plans');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isCoach = profile?.role === 'coach';
  const exercises = (plan.exercises as string[]) || [];

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-lg mx-auto">
        
        <div className="flex items-center justify-between mb-6">
          <Link href="/plans" className="text-[var(--color-blue)] font-medium">
            ← Indietro
          </Link>
          <h1 className="text-xl font-bold text-[var(--color-dark-blue)]">Piano</h1>
          <div className="w-16"></div>
        </div>

        <div className="header-gradient mb-6">
          <h2 className="text-xl font-bold">{plan.title}</h2>
          <p className="text-blue-100">
            {isCoach ? `Per: ${plan.student?.full_name}` : `Da: ${plan.coach?.full_name}`}
          </p>
          <p className="text-blue-100 text-sm mt-1">
            {new Date(plan.start_date).toLocaleDateString('it-IT')}
            {plan.end_date && ` - ${new Date(plan.end_date).toLocaleDateString('it-IT')}`}
          </p>
        </div>

        {plan.description && (
          <div className="card mb-4">
            <h3 className="section-title">📝 Descrizione</h3>
            <p className="text-[var(--color-gray)]">{plan.description}</p>
          </div>
        )}

        <div className="card mb-4">
          <h3 className="section-title">🏋️ Esercizi da fare</h3>
          {exercises.length === 0 ? (
            <p className="text-[var(--color-gray)]">Nessun esercizio</p>
          ) : (
            <div className="space-y-3">
              {exercises.map((ex, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-[var(--color-light)] rounded-xl">
                  <span className="w-6 h-6 bg-[var(--color-azure)] text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    {i + 1}
                  </span>
                  <span className="flex-1">{ex}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Stato:</span>
            <span className={`px-3 py-1 rounded-full text-sm ${
              plan.status === 'active' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-700'
            }`}>
              {plan.status === 'active' ? '✅ Attivo' : '✓ Completato'}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
