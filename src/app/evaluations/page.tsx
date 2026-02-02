import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function EvaluationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('active_role')
    .eq('id', user.id)
    .single();

  const isCoach = profile?.active_role === 'coach';

  const { data: evaluations } = await supabase
    .from('student_evaluations')
    .select('*, student:profiles!student_evaluations_student_id_fkey(full_name), coach:profiles!student_evaluations_coach_id_fkey(full_name)')
    .eq(isCoach ? 'coach_id' : 'student_id', user.id)
    .order('evaluation_date', { ascending: false });

  const accent = isCoach ? '#059669' : '#1A8CD8';

  return (
    <div style={{ minHeight: '100vh', background: '#fff', paddingBottom: '100px' }}>
      
      {/* Header */}
      <div style={{
        background: isCoach 
          ? 'linear-gradient(135deg, #059669 0%, #047857 50%, #064E3B 100%)'
          : 'linear-gradient(135deg, #1A8CD8 0%, #1570B0 100%)',
        padding: '48px 20px 24px',
        borderRadius: '0 0 28px 28px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '15px' }}>← Indietro</Link>
          {isCoach && (
            <Link href="/evaluations/new" style={{
              background: 'rgba(255,255,255,0.2)', color: '#fff', textDecoration: 'none',
              padding: '8px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: 700
            }}>+ Nuova</Link>
          )}
        </div>
        <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, marginTop: '12px' }}>📊 Valutazioni</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginTop: '4px' }}>
          {isCoach ? `${evaluations?.length || 0} valutazioni create` : 'Le tue valutazioni dal coach'}
        </p>
      </div>

      <div style={{ padding: '20px' }}>
        {!evaluations || evaluations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', background: '#fff', borderRadius: '20px', border: '1px solid #E5E7EB' }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>📊</span>
            <p style={{ color: '#6B7280', fontSize: '16px', fontWeight: 600 }}>
              {isCoach ? 'Nessuna valutazione creata' : 'Nessuna valutazione ricevuta'}
            </p>
            {isCoach && (
              <Link href="/evaluations/new" style={{ textDecoration: 'none' }}>
                <span style={{
                  display: 'inline-block', marginTop: '16px',
                  padding: '12px 24px', background: accent, color: '#fff',
                  borderRadius: '12px', fontWeight: 700, fontSize: '14px'
                }}>Crea prima valutazione →</span>
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {evaluations.map(ev => {
              const avgTech = Math.round(((ev.tech_volee || 0) + (ev.tech_bandeja || 0) + (ev.tech_smash || 0) + (ev.tech_servizio || 0) + (ev.tech_difesa || 0)) / 5);
              const avgTact = Math.round(((ev.tact_posizione || 0) + (ev.tact_lettura_gioco || 0) + (ev.tact_scelta_colpi || 0)) / 3);
              const avgPhys = Math.round(((ev.phys_velocita || 0) + (ev.phys_resistenza || 0)) / 2);
              const avgMental = Math.round(((ev.mental_concentrazione || 0) + (ev.mental_gestione_pressione || 0)) / 2);
              const overall = Math.round((avgTech + avgTact + avgPhys + avgMental) / 4);

              const areas = [
                { label: 'Tecnica', value: avgTech, color: '#3B82F6', bg: '#DBEAFE' },
                { label: 'Tattica', value: avgTact, color: '#059669', bg: '#D1FAE5' },
                { label: 'Fisico', value: avgPhys, color: '#F59E0B', bg: '#FEF3C7' },
                { label: 'Mentale', value: avgMental, color: '#8B5CF6', bg: '#EDE9FE' },
              ];

              return (
                <Link key={ev.id} href={`/evaluations/${ev.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: '#fff', borderRadius: '16px', padding: '16px',
                    border: '1px solid #E5E7EB', transition: 'box-shadow 0.15s'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '16px', color: '#111827' }}>
                          {isCoach ? ev.student?.full_name : ev.coach?.full_name}
                        </p>
                        <p style={{ fontSize: '13px', color: '#6B7280' }}>
                          {new Date(ev.evaluation_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '50%',
                        background: `linear-gradient(135deg, ${accent}, ${isCoach ? '#0D9488' : '#5BA4D9'})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 800, fontSize: '16px'
                      }}>
                        {overall}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                      {areas.map((area, i) => (
                        <div key={i} style={{ background: area.bg, padding: '8px 4px', borderRadius: '10px', textAlign: 'center' }}>
                          <p style={{ fontWeight: 800, fontSize: '18px', color: area.color }}>{area.value}</p>
                          <p style={{ fontSize: '10px', color: '#6B7280', marginTop: '2px' }}>{area.label}</p>
                        </div>
                      ))}
                    </div>

                    {ev.notes && (
                      <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '10px', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        📝 {ev.notes}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
