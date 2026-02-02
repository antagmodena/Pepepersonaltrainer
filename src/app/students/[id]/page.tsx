import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login');

  // Verifica che sia un coach collegato a questo studente
  const { data: connection } = await supabase
    .from('coach_student_connections')
    .select('*')
    .eq('coach_id', user.id)
    .eq('student_id', id)
    .eq('status', 'accepted')
    .single();

  if (!connection) redirect('/connections');

  const { data: student } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  const { data: trainingCards } = await supabase
    .from('training_cards')
    .select('*')
    .eq('user_id', id)
    .order('training_date', { ascending: false })
    .limit(10);

  const { count: totalCards } = await supabase
    .from('training_cards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', id);

  const { data: goals } = await supabase
    .from('season_goals')
    .select('*')
    .eq('user_id', id)
    .order('season_year', { ascending: false })
    .limit(1)
    .single();

  const { data: activePlans } = await supabase
    .from('training_plans')
    .select('*')
    .eq('student_id', id)
    .eq('coach_id', user.id)
    .eq('status', 'active');

  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('*')
    .eq('user_id', id)
    .order('date', { ascending: false })
    .limit(5);

  const { data: evaluations } = await supabase
    .from('student_evaluations')
    .select('*')
    .eq('student_id', id)
    .eq('coach_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: completedPlans } = await supabase
    .from('training_plans')
    .select('*')
    .eq('student_id', id)
    .eq('coach_id', user.id)
    .eq('status', 'completed')
    .order('updated_at', { ascending: false })
    .limit(5);

  const colors = { 
    gradient: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)', 
    primary: '#22C55E', 
    shadow: 'rgba(34, 197, 94, 0.3)' 
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
      paddingBottom: '100px'
    }}>
      {/* Header */}
      <div style={{
        background: colors.gradient,
        padding: '48px 24px 32px',
        borderRadius: '0 0 32px 32px',
        marginBottom: '24px',
        textAlign: 'center'
      }}>
        <Link href="/connections" style={{ 
          color: 'rgba(255,255,255,0.8)', 
          textDecoration: 'none', 
          fontSize: '14px', 
          fontWeight: 500,
          position: 'absolute',
          left: '24px',
          top: '52px'
        }}>
          ← Allievi
        </Link>
        
        <div style={{
          width: '80px',
          height: '80px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '50%',
          margin: '0 auto 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '36px',
          color: '#fff',
          fontWeight: 700
        }}>
          {student?.full_name?.charAt(0).toUpperCase() || '?'}
        </div>
        <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 800 }}>
          {student?.full_name || 'Allievo'}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginTop: '4px' }}>
          {student?.email}
        </p>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Quick Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '16px',
            textAlign: 'center',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
          }}>
            <p style={{ fontSize: '24px', fontWeight: 800, color: colors.primary }}>{totalCards || 0}</p>
            <p style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' }}>Schede</p>
          </div>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '16px',
            textAlign: 'center',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
          }}>
            <p style={{ fontSize: '24px', fontWeight: 800, color: '#3B82F6' }}>{activePlans?.length || 0}</p>
            <p style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' }}>Piani Attivi</p>
          </div>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '16px',
            textAlign: 'center',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
          }}>
            <p style={{ fontSize: '24px', fontWeight: 800, color: '#F59E0B' }}>{tournaments?.length || 0}</p>
            <p style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' }}>Tornei</p>
          </div>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '16px',
            textAlign: 'center',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
          }}>
            <p style={{ fontSize: '24px', fontWeight: 800, color: '#8B5CF6' }}>{evaluations?.length || 0}</p>
            <p style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' }}>Valutazioni</p>
          </div>
        </div>

        {/* Azioni Rapide */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <Link href={`/plans/new?student=${id}`} style={{ textDecoration: 'none' }}>
            <div style={{
              background: colors.gradient,
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'center',
              boxShadow: `0 4px 16px ${colors.shadow}`
            }}>
              <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>📋</span>
              <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>Nuovo Piano</span>
            </div>
          </Link>
          <Link href={`/evaluations/new?student=${id}`} style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'center',
              boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)'
            }}>
              <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>📊</span>
              <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>Valutazione</span>
            </div>
          </Link>
        </div>

        {/* Obiettivi Stagione */}
        {goals && (
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '16px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '16px' }}>
              🎯 Obiettivi {goals.season_year}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {goals.technical_goal && (
                <div style={{ padding: '12px', background: '#EFF6FF', borderRadius: '10px' }}>
                  <p style={{ fontSize: '11px', color: '#3B82F6', fontWeight: 600, marginBottom: '4px' }}>🎾 TECNICO</p>
                  <p style={{ fontSize: '14px', color: '#1a1a2e' }}>{goals.technical_goal}</p>
                </div>
              )}
              {goals.sports_goal && (
                <div style={{ padding: '12px', background: '#F0FDF4', borderRadius: '10px' }}>
                  <p style={{ fontSize: '11px', color: '#22C55E', fontWeight: 600, marginBottom: '4px' }}>🏆 SPORTIVO</p>
                  <p style={{ fontSize: '14px', color: '#1a1a2e' }}>{goals.sports_goal}</p>
                </div>
              )}
              {goals.mental_goal && (
                <div style={{ padding: '12px', background: '#FAF5FF', borderRadius: '10px' }}>
                  <p style={{ fontSize: '11px', color: '#8B5CF6', fontWeight: 600, marginBottom: '4px' }}>🧠 MENTALE</p>
                  <p style={{ fontSize: '14px', color: '#1a1a2e' }}>{goals.mental_goal}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Piani Attivi */}
        {activePlans && activePlans.length > 0 && (
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '16px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '16px' }}>
              📋 Piani Attivi
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activePlans.map(plan => (
                <Link key={plan.id} href={`/plans/${plan.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    padding: '14px',
                    background: '#F0FDF4',
                    borderRadius: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <p style={{ fontWeight: 600, color: '#1a1a2e', fontSize: '14px' }}>{plan.title}</p>
                      <p style={{ fontSize: '12px', color: '#64748B' }}>
                        {plan.exercises?.length || 0} esercizi
                      </p>
                    </div>
                    <span style={{ color: '#22C55E' }}>›</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Valutazioni */}
        {evaluations && evaluations.length > 0 && (
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '16px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e' }}>📊 Valutazioni</h2>
              <Link href={'/evaluations/new?student=' + id} style={{ fontSize: '13px', color: '#3B82F6', fontWeight: 600, textDecoration: 'none' }}>+ Nuova</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {evaluations.map((ev: any) => {
                const avgTech = ((ev.tech_volee||0)+(ev.tech_bandeja||0)+(ev.tech_smash||0)+(ev.tech_servizio||0)+(ev.tech_difesa||0))/5;
                const avgTact = ((ev.tact_posizione||0)+(ev.tact_lettura_gioco||0)+(ev.tact_scelta_colpi||0))/3;
                const avgPhys = ((ev.phys_velocita||0)+(ev.phys_resistenza||0))/2;
                const avgMental = ((ev.mental_concentrazione||0)+(ev.mental_gestione_pressione||0))/2;
                const avg = Math.round((avgTech + avgTact + avgPhys + avgMental) / 4 * 10);
                return (
                  <Link key={ev.id} href={'/evaluations/' + ev.id} style={{ textDecoration: 'none' }}>
                    <div style={{ padding: '14px', background: '#EFF6FF', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontWeight: 600, color: '#1a1a2e', fontSize: '14px' }}>
                          {new Date(ev.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                          <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '6px', background: '#DBEAFE', color: '#1D4ED8' }}>Tec {Math.round(avgTech*10)/10}</span>
                          <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '6px', background: '#DCFCE7', color: '#16A34A' }}>Tat {Math.round(avgTact*10)/10}</span>
                          <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '6px', background: '#FEF3C7', color: '#D97706' }}>Fis {Math.round(avgPhys*10)/10}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '22px', fontWeight: 800, color: avg >= 70 ? '#16A34A' : avg >= 50 ? '#F59E0B' : '#EF4444' }}>{avg}%</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Piani Completati */}
        {completedPlans && completedPlans.length > 0 && (
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '16px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '16px' }}>
              ✅ Piani Completati
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {completedPlans.map((plan: any) => (
                <Link key={plan.id} href={'/plans/' + plan.id} style={{ textDecoration: 'none' }}>
                  <div style={{ padding: '14px', background: '#F0FDF4', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontWeight: 600, color: '#1a1a2e', fontSize: '14px' }}>{plan.title}</p>
                      <p style={{ fontSize: '12px', color: '#64748B' }}>
                        Completato il {new Date(plan.updated_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <span style={{ color: '#22C55E', fontSize: '18px' }}>✓</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Ultime Schede */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '16px' }}>
            📝 Ultime Schede
          </h2>
          {!trainingCards || trainingCards.length === 0 ? (
            <p style={{ color: '#94A3B8', textAlign: 'center', padding: '20px' }}>Nessuna scheda</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {trainingCards.map(card => (
                <Link key={card.id} href={`/students/${id}/training/${card.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    padding: '14px',
                    background: '#F8FAFC',
                    borderRadius: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <p style={{ fontWeight: 600, color: '#1a1a2e', fontSize: '14px' }}>
                        {card.session_type === 'training' ? '🏋️ Allenamento' : '🎮 Partita'}
                      </p>
                      <p style={{ fontSize: '12px', color: '#64748B' }}>
                        {new Date(card.training_date).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {card.coach_feedback && (
                        <span style={{ background: '#DCFCE7', color: '#16A34A', fontSize: '10px', padding: '4px 8px', borderRadius: '10px', fontWeight: 600 }}>
                          ✓ Feedback
                        </span>
                      )}
                      <span style={{ color: '#CBD5E1' }}>›</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Tornei */}
        {tournaments && tournaments.length > 0 && (
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '20px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '16px' }}>
              🏆 Tornei Recenti
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {tournaments.map(t => (
                <div key={t.id} style={{
                  padding: '14px',
                  background: '#FEF3C7',
                  borderRadius: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontWeight: 600, color: '#1a1a2e', fontSize: '14px' }}>{t.name}</p>
                    {t.result && (
                      <span style={{ background: '#FDE68A', color: '#92400E', fontSize: '11px', padding: '4px 8px', borderRadius: '10px', fontWeight: 600 }}>
                        {t.result}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                    📅 {new Date(t.date).toLocaleDateString('it-IT')}
                    {t.partner && ` • 👥 ${t.partner}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
