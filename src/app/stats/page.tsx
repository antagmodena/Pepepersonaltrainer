import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function StatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Prendi tutte le schede
  const { data: cards } = await supabase
    .from('training_cards')
    .select('*')
    .eq('user_id', user.id);

  // Prendi errori comuni
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

  // Calcola percentuali cose fatte bene
  const calcPercent = (field: string) => {
    if (!cards || cards.length === 0) return 0;
    const count = cards.filter(c => c[field]).length;
    return Math.round((count / cards.length) * 100);
  };

  const doneWellStats = [
    { label: 'Intensità', percent: calcPercent('done_well_intensity'), color: 'bg-green-500' },
    { label: 'Concentrazione', percent: calcPercent('done_well_concentration'), color: 'bg-blue-500' },
    { label: 'Attitudine', percent: calcPercent('done_well_attitude'), color: 'bg-purple-500' },
  ];

  const improveStats = [
    { label: 'Posizione', percent: calcPercent('improve_position'), color: 'bg-amber-500' },
    { label: 'Decisioni', percent: calcPercent('improve_decision_making'), color: 'bg-orange-500' },
    { label: 'Comunicazione', percent: calcPercent('improve_partner_communication'), color: 'bg-red-500' },
    { label: 'Gestione errori', percent: calcPercent('improve_error_management'), color: 'bg-pink-500' },
  ];

  // Errori comuni attivi
  const activeErrors = [];
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

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-lg mx-auto">
        
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard" className="text-[var(--color-blue)] font-medium">
            ← Indietro
          </Link>
          <h1 className="text-xl font-bold text-[var(--color-dark-blue)]">Statistiche</h1>
          <div className="w-16"></div>
        </div>

        {/* Riepilogo */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="card text-center">
            <div className="text-3xl font-bold text-[var(--color-blue)]">{totalCards}</div>
            <div className="text-sm text-[var(--color-gray)]">Schede totali</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-green-500">{withFeedback}</div>
            <div className="text-sm text-[var(--color-gray)]">Con feedback</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-[var(--color-azure)]">{trainings}</div>
            <div className="text-sm text-[var(--color-gray)]">🏋️ Allenamenti</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-pink-500">{matches}</div>
            <div className="text-sm text-[var(--color-gray)]">🎮 Partite</div>
          </div>
        </div>

        {/* Cose fatte bene */}
        <div className="card mb-4">
          <h2 className="section-title">✅ Cose fatte bene</h2>
          {totalCards === 0 ? (
            <p className="text-[var(--color-gray)] text-center py-4">Nessun dato</p>
          ) : (
            <div className="space-y-4">
              {doneWellStats.map(stat => (
                <div key={stat.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{stat.label}</span>
                    <span className="font-semibold">{stat.percent}%</span>
                  </div>
                  <div className="h-3 bg-[var(--color-light)] rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${stat.color} rounded-full transition-all`}
                      style={{ width: `${stat.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Aspetti da migliorare */}
        <div className="card mb-4">
          <h2 className="section-title">⚠️ Aspetti da migliorare</h2>
          {totalCards === 0 ? (
            <p className="text-[var(--color-gray)] text-center py-4">Nessun dato</p>
          ) : (
            <div className="space-y-4">
              {improveStats.map(stat => (
                <div key={stat.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{stat.label}</span>
                    <span className="font-semibold">{stat.percent}%</span>
                  </div>
                  <div className="h-3 bg-[var(--color-light)] rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${stat.color} rounded-full transition-all`}
                      style={{ width: `${stat.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Errori comuni */}
        <div className="card">
          <h2 className="section-title">🎯 Errori su cui lavorare</h2>
          {activeErrors.length === 0 ? (
            <p className="text-[var(--color-gray)] text-center py-4">Nessun errore segnalato</p>
          ) : (
            <div className="space-y-2">
              {activeErrors.map((err, i) => (
                <div 
                  key={i}
                  className={`px-3 py-2 rounded-lg text-sm ${
                    err.type === 'tech' ? 'bg-red-50 text-red-700' :
                    err.type === 'tact' ? 'bg-orange-50 text-orange-700' :
                    'bg-purple-50 text-purple-700'
                  }`}
                >
                  {err.type === 'tech' ? '🎾' : err.type === 'tact' ? '🧠' : '💭'} {err.label}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
