import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function EvaluationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('active_role')
    .eq('id', user.id)
    .single();

  const isCoach = profile?.active_role === 'coach';

  const { data: ev } = await supabase
    .from('student_evaluations')
    .select('*, student:profiles!student_evaluations_student_id_fkey(full_name), coach:profiles!student_evaluations_coach_id_fkey(full_name)')
    .eq('id', id)
    .single();

  if (!ev) redirect('/evaluations');

  // Previous evaluation for comparison
  const { data: prevEvals } = await supabase
    .from('student_evaluations')
    .select('*')
    .eq('student_id', ev.student_id)
    .eq('coach_id', ev.coach_id)
    .lt('evaluation_date', ev.evaluation_date)
    .order('evaluation_date', { ascending: false })
    .limit(1);

  const prev = prevEvals?.[0] || null;

  const accent = isCoach ? '#059669' : '#1A8CD8';

  const sections = [
    {
      title: '🎾 Tecnica', color: '#3B82F6', bg: '#DBEAFE',
      fields: [
        { label: 'Volée', key: 'tech_volee' },
        { label: 'Bandeja', key: 'tech_bandeja' },
        { label: 'Smash', key: 'tech_smash' },
        { label: 'Servizio', key: 'tech_servizio' },
        { label: 'Difesa', key: 'tech_difesa' },
      ]
    },
    {
      title: '🧠 Tattica', color: '#059669', bg: '#D1FAE5',
      fields: [
        { label: 'Posizione', key: 'tact_posizione' },
        { label: 'Lettura gioco', key: 'tact_lettura_gioco' },
        { label: 'Scelta colpi', key: 'tact_scelta_colpi' },
      ]
    },
    {
      title: '💪 Fisico', color: '#F59E0B', bg: '#FEF3C7',
      fields: [
        { label: 'Velocità', key: 'phys_velocita' },
        { label: 'Resistenza', key: 'phys_resistenza' },
      ]
    },
    {
      title: '💭 Mentale', color: '#8B5CF6', bg: '#EDE9FE',
      fields: [
        { label: 'Concentrazione', key: 'mental_concentrazione' },
        { label: 'Gestione pressione', key: 'mental_gestione_pressione' },
      ]
    },
  ];

  const avgTech = Math.round(((ev.tech_volee || 0) + (ev.tech_bandeja || 0) + (ev.tech_smash || 0) + (ev.tech_servizio || 0) + (ev.tech_difesa || 0)) / 5);
  const avgTact = Math.round(((ev.tact_posizione || 0) + (ev.tact_lettura_gioco || 0) + (ev.tact_scelta_colpi || 0)) / 3);
  const avgPhys = Math.round(((ev.phys_velocita || 0) + (ev.phys_resistenza || 0)) / 2);
  const avgMental = Math.round(((ev.mental_concentrazione || 0) + (ev.mental_gestione_pressione || 0)) / 2);
  const overall = Math.round((avgTech + avgTact + avgPhys + avgMental) / 4);

  const getDelta = (key: string) => {
    if (!prev) return null;
    const current = (ev as any)[key] || 0;
    const previous = (prev as any)[key] || 0;
    const diff = current - previous;
    if (diff === 0) return null;
    return diff;
  };

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
        <Link href="/evaluations" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '15px' }}>← Valutazioni</Link>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '12px' }}>
          <div>
            <h1 style={{ color: '#fff', fontSize: '26px', fontWeight: 800 }}>
              {isCoach ? ev.student?.full_name : ev.coach?.full_name}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginTop: '4px' }}>
              {new Date(ev.evaluation_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div style={{
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column'
          }}>
            <span style={{ color: '#fff', fontSize: '24px', fontWeight: 800 }}>{overall}</span>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '9px' }}>MEDIA</span>
          </div>
        </div>

        {/* Summary bars */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          {[
            { label: 'TEC', value: avgTech, color: '#3B82F6' },
            { label: 'TAT', value: avgTact, color: '#059669' },
            { label: 'FIS', value: avgPhys, color: '#F59E0B' },
            { label: 'MEN', value: avgMental, color: '#8B5CF6' },
          ].map((a, i) => (
            <div key={i} style={{ flex: 1, background: 'rgba(255,255,255,0.12)', borderRadius: '12px', padding: '10px 4px', textAlign: 'center' }}>
              <p style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>{a.value}</p>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>{a.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px' }}>

        {prev && (
          <div style={{
            background: '#F0FDF4', borderRadius: '14px', padding: '12px 16px',
            marginBottom: '20px', border: '1px solid #D1FAE530',
            display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <span style={{ fontSize: '16px' }}>📈</span>
            <p style={{ fontSize: '13px', color: '#059669', fontWeight: 600 }}>
              Confronto con valutazione del {new Date(prev.evaluation_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
            </p>
          </div>
        )}

        {/* Detail sections */}
        {sections.map((section, si) => (
          <div key={si} style={{
            background: '#fff', borderRadius: '16px', padding: '16px',
            border: '1px solid #E5E7EB', marginBottom: '14px'
          }}>
            <p style={{
              fontSize: '15px', fontWeight: 800, color: section.color,
              marginBottom: '14px', padding: '6px 12px',
              background: section.bg, borderRadius: '10px', display: 'inline-block'
            }}>
              {section.title}
            </p>

            {section.fields.map(field => {
              const val = (ev as any)[field.key] || 0;
              const delta = getDelta(field.key);

              return (
                <div key={field.key} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{field.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {delta !== null && (
                        <span style={{
                          fontSize: '12px', fontWeight: 700,
                          color: delta > 0 ? '#059669' : '#EF4444',
                          background: delta > 0 ? '#D1FAE5' : '#FEE2E2',
                          padding: '2px 6px', borderRadius: '6px'
                        }}>
                          {delta > 0 ? '+' : ''}{delta}
                        </span>
                      )}
                      <span style={{ fontSize: '16px', fontWeight: 800, color: section.color }}>{val}/10</span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: '8px', background: '#F3F4F6', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${val * 10}%`,
                      background: section.color, borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Notes */}
        {ev.notes && (
          <div style={{
            background: '#F9FAFB', borderRadius: '16px', padding: '16px',
            border: '1px solid #E5E7EB'
          }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>📝 Note del coach</p>
            <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>{ev.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
