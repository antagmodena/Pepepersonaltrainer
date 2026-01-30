'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Plan {
  id: string;
  title: string;
  status: string;
  start_date: string;
  exercises: any[];
  student?: { full_name: string };
  coach?: { full_name: string };
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isCoach, setIsCoach] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, active_role')
      .eq('id', user.id)
      .single();

    const coachMode = profile?.active_role === 'coach' || profile?.role === 'coach';
    setIsCoach(coachMode);

    const { data: plansData } = await supabase
      .from('training_plans')
      .select('*, student:profiles!training_plans_student_id_fkey(full_name), coach:profiles!training_plans_coach_id_fkey(full_name)')
      .eq(coachMode ? 'coach_id' : 'student_id', user.id)
      .order('created_at', { ascending: false });

    setPlans(plansData || []);
    setLoading(false);
  };

  const deletePlan = async (planId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo piano?')) return;
    
    setDeleting(planId);
    const { error } = await supabase
      .from('training_plans')
      .delete()
      .eq('id', planId);

    if (!error) {
      setPlans(plans.filter(p => p.id !== planId));
    }
    setDeleting(null);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAF7' }}>
        <p style={{ color: '#999' }}>Caricamento...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF7', paddingBottom: '100px' }}>
      <div style={{
        background: 'linear-gradient(135deg, #0E5E4A 0%, #0A4A3A 100%)',
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
              background: 'linear-gradient(135deg, #0E5E4A 0%, #0A4A3A 100%)',
              borderRadius: '16px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '20px'
            }}>
              <span style={{ fontSize: '20px' }}>➕</span>
              <span style={{ color: '#fff', fontSize: '16px', fontWeight: 700 }}>Crea Nuovo Piano</span>
            </div>
          </Link>
        )}

        <div style={{ background: '#fff', borderRadius: '24px', padding: '20px' }}>
          {plans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>📋</span>
              <p style={{ color: '#999', fontSize: '15px' }}>
                {isCoach ? 'Nessun piano creato ancora' : 'Nessun piano assegnato'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {plans.map(plan => (
                <div key={plan.id} style={{
                  padding: '16px',
                  background: '#F5F5F3',
                  borderRadius: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <Link href={`/plans/${plan.id}`} style={{ textDecoration: 'none', flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: '15px', color: '#111' }}>{plan.title}</p>
                      <p style={{ fontSize: '13px', color: '#666' }}>
                        {isCoach ? `👤 ${plan.student?.full_name}` : `👨‍🏫 ${plan.coach?.full_name}`}
                      </p>
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        background: plan.status === 'active' ? '#DCFCE7' : '#F1F5F9',
                        color: plan.status === 'active' ? '#16A34A' : '#666',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 600
                      }}>
                        {plan.status === 'active' ? '✅ Attivo' : '📁 Completato'}
                      </span>
                      <button
                        onClick={() => deletePlan(plan.id)}
                        disabled={deleting === plan.id}
                        style={{
                          width: '32px',
                          height: '32px',
                          background: '#FEE2E2',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {deleting === plan.id ? '...' : '🗑️'}
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#999' }}>
                    <span>📅 {new Date(plan.start_date).toLocaleDateString('it-IT')}</span>
                    {plan.exercises && <span>🏋️ {Array.isArray(plan.exercises) ? plan.exercises.length : 0} esercizi</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
