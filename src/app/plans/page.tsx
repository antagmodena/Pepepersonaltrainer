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

  const { data: plans } = await supabase
    .from('training_plans')
    .select('*, student:profiles!training_plans_student_id_fkey(full_name), coach:profiles!training_plans_coach_id_fkey(full_name)')
    .eq(isCoach ? 'coach_id' : 'student_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
      paddingBottom: '100px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #0066FF 0%, #00D4AA 100%)',
        padding: '48px 24px 32px',
        borderRadius: '0 0 32px 32px',
        marginBottom: '24px'
      }}>
        <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
          ← Dashboard
        </Link>
        <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>
          📋 Piani Allenamento
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginTop: '4px' }}>
          {isCoach ? 'I piani che hai creato' : 'I piani del tuo maestro'}
        </p>
      </div>

      <div style={{ padding: '0 20px' }}>
        {isCoach && (
          <Link href="/plans/new" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'linear-gradient(135deg, #0066FF 0%, #0052CC 100%)',
              borderRadius: '16px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '20px',
              boxShadow: '0 8px 32px rgba(0, 102, 255, 0.3)'
            }}>
              <span style={{ fontSize: '20px' }}>➕</span>
              <span style={{ color: '#fff', fontSize: '16px', fontWeight: 700 }}>Crea Nuovo Piano</span>
            </div>
          </Link>
        )}

        <div style={{
          background: '#fff',
          borderRadius: '24px',
          padding: '20px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
        }}>
          {!plans || plans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>📋</span>
              <p style={{ color: '#94A3B8', fontSize: '15px' }}>
                {isCoach ? 'Nessun piano creato ancora' : 'Nessun piano assegnato'}
              </p>
              {isCoach && (
                <p style={{ color: '#94A3B8', fontSize: '14px' }}>Crea il primo piano per i tuoi allievi!</p>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {plans.map(plan => (
                <Link key={plan.id} href={`/plans/${plan.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    padding: '16px',
                    background: '#F8FAFC',
                    borderRadius: '16px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '15px', color: '#1a1a2e' }}>{plan.title}</p>
                        <p style={{ fontSize: '13px', color: '#64748B' }}>
                          {isCoach ? `👤 ${plan.student?.full_name}` : `👨‍🏫 ${plan.coach?.full_name}`}
                        </p>
                      </div>
                      <span style={{
                        background: plan.status === 'active' ? '#DCFCE7' : '#F1F5F9',
                        color: plan.status === 'active' ? '#16A34A' : '#64748B',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 600
                      }}>
                        {plan.status === 'active' ? '✅ Attivo' : '📁 Completato'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#94A3B8' }}>
                      <span>📅 {new Date(plan.start_date).toLocaleDateString('it-IT')}</span>
                      {plan.exercises && <span>🏋️ {Array.isArray(plan.exercises) ? plan.exercises.length : 0} esercizi</span>}
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
