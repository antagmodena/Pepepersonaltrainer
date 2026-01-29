import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function StatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const { data: cards } = await supabase
    .from('training_cards')
    .select('*')
    .eq('user_id', user.id);

  const { data: errors } = await supabase
    .from('common_errors')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const totalCards = cards?.length || 0;
  const trainings = cards?.filter(c => c.session_type === 'training').length || 0;
  const matches = cards?.filter(c => c.session_type === 'match').length || 0;
  const withFeedback = cards?.filter(c => c.coach_feedback).length || 0;

  const calcPercent = (field: string) => {
    if (!cards || cards.length === 0) return 0;
    const count = cards.filter(c => c[field]).length;
    return Math.round((count / cards.length) * 100);
  };

  const doneWellStats = [
    { label: 'Intensità', percent: calcPercent('done_well_intensity'), color: '#22C55E' },
    { label: 'Concentrazione', percent: calcPercent('done_well_concentration'), color: '#3B82F6' },
    { label: 'Attitudine', percent: calcPercent('done_well_attitude'), color: '#A855F7' },
  ];

  const improveStats = [
    { label: 'Posizione', percent: calcPercent('improve_position'), color: '#F59E0B' },
    { label: 'Decisioni', percent: calcPercent('improve_decision_making'), color: '#F97316' },
    { label: 'Comunicazione', percent: calcPercent('improve_partner_communication'), color: '#EF4444' },
    { label: 'Gestione errori', percent: calcPercent('improve_error_management'), color: '#EC4899' },
  ];

  const activeErrors: { label: string; type: string }[] = [];
  if (errors?.tech_simple_volley) activeErrors.push({ label: 'Volée semplici', type: 'tech' });
  if (errors?.tech_late_hit) activeErrors.push({ label: 'Colpisco in ritardo', type: 'tech' });
  if (errors?.tech_bandeja_bounce) activeErrors.push({ label: 'Bandeja rimbalzo', type: 'tech' });
  if (errors?.tech_smash_ineffective) activeErrors.push({ label: 'Smash poco efficace', type: 'tech' });
  if (errors?.tact_unclear_decisions) activeErrors.push({ label: 'Decisioni poco lucide', type: 'tact' });
  if (errors?.tact_wrong_timing_attack) activeErrors.push({ label: 'Attacco sbagliato', type: 'tact' });
  if (errors?.tact_lose_position) activeErrors.push({ label: 'Perdo posizione', type: 'tact' });
  if (errors?.tact_misread_opponent) activeErrors.push({ label: 'Leggo male avversario', type: 'tact' });
  if (errors?.mental_get_nervous) activeErrors.push({ label: 'Mi innervosisco', type: 'mental' });
  if (errors?.mental_lose_focus_after_error) activeErrors.push({ label: 'Perdo concentrazione', type: 'mental' });
  if (errors?.mental_hesitate_key_points) activeErrors.push({ label: 'Esito punti chiave', type: 'mental' });
  if (errors?.mental_drop_tension_when_ahead) activeErrors.push({ label: 'Calo in vantaggio', type: 'mental' });

  const StatCard = ({ value, label, color }: { value: number; label: string; color: string }) => (
    <div style={{
      background: '#fff',
      borderRadius: '20px',
      padding: '20px 16px',
      textAlign: 'center',
      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      border: '1px solid rgba(0,0,0,0.04)'
    }}>
      <p style={{ fontSize: '28px', fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '8px' }}>{label}</p>
    </div>
  );

  const ProgressBar = ({ label, percent, color }: { label: string; percent: number; color: string }) => (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '14px', color: '#1a1a2e' }}>{label}</span>
        <span style={{ fontSize: '14px', fontWeight: 600, color }}>{percent}%</span>
      </div>
      <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${percent}%`, background: color, borderRadius: '4px', transition: 'width 0.3s' }} />
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
      paddingBottom: '100px'
    }}>
      {/* Header */}
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
          📊 Statistiche
        </h1>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Summary Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
          <StatCard value={totalCards} label="Schede totali" color="#0066FF" />
          <StatCard value={withFeedback} label="Con feedback" color="#22C55E" />
          <StatCard value={trainings} label="🏋️ Allenamenti" color="#3B82F6" />
          <StatCard value={matches} label="🎮 Partite" color="#EC4899" />
        </div>

        {/* Done Well Section */}
        <div style={{
          background: '#fff',
          borderRadius: '24px',
          padding: '24px',
          marginBottom: '16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          border: '1px solid rgba(0,0,0,0.04)'
        }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#1a1a2e', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>✅</span> Cose fatte bene
          </h2>
          {totalCards === 0 ? (
            <p style={{ color: '#94A3B8', textAlign: 'center', padding: '20px' }}>Nessun dato disponibile</p>
          ) : (
            doneWellStats.map(stat => <ProgressBar key={stat.label} {...stat} />)
          )}
        </div>

        {/* Improve Section */}
        <div style={{
          background: '#fff',
          borderRadius: '24px',
          padding: '24px',
          marginBottom: '16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          border: '1px solid rgba(0,0,0,0.04)'
        }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#1a1a2e', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚠️</span> Aspetti da migliorare
          </h2>
          {totalCards === 0 ? (
            <p style={{ color: '#94A3B8', textAlign: 'center', padding: '20px' }}>Nessun dato disponibile</p>
          ) : (
            improveStats.map(stat => <ProgressBar key={stat.label} {...stat} />)
          )}
        </div>

        {/* Active Errors Section */}
        <div style={{
          background: '#fff',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          border: '1px solid rgba(0,0,0,0.04)'
        }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#1a1a2e', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🎯</span> Errori su cui lavorare
          </h2>
          {activeErrors.length === 0 ? (
            <p style={{ color: '#94A3B8', textAlign: 'center', padding: '20px' }}>Nessun errore segnalato</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {activeErrors.map((err, i) => (
                <span key={i} style={{
                  padding: '8px 14px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 500,
                  background: err.type === 'tech' ? '#FEF2F2' : err.type === 'tact' ? '#FFF7ED' : '#FAF5FF',
                  color: err.type === 'tech' ? '#DC2626' : err.type === 'tact' ? '#EA580C' : '#9333EA'
                }}>
                  {err.type === 'tech' ? '🎾' : err.type === 'tact' ? '🧠' : '💭'} {err.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
