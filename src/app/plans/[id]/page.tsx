import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ExerciseFeedback from './ExerciseFeedback';
import DeletePlanButton from './DeletePlanButton';

interface Exercise {
  id: string;
  name: string;
  category: string;
  duration: string;
  description: string;
  videoUrl?: string;
  notes?: string;
}

interface Video {
  title: string;
  url: string;
}

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
  const isStudent = !isCoach && plan.student_id === user.id;
  
  const exercises: Exercise[] = Array.isArray(plan.exercises) 
    ? plan.exercises.map((ex: string | Exercise, i: number) => 
        typeof ex === 'string' 
          ? { id: `ex-${i}`, name: ex, category: 'tecnica', duration: '', description: '', videoUrl: '', notes: '' }
          : ex
      )
    : [];
  
  const videos: Video[] = Array.isArray(plan.videos) ? plan.videos : [];

  const categoryColors: Record<string, { color: string; bgColor: string; label: string }> = {
    tecnica: { color: '#3B82F6', bgColor: '#EFF6FF', label: '🎾 Tecnica' },
    tattica: { color: '#8B5CF6', bgColor: '#F5F3FF', label: '🧠 Tattica' },
    fisico: { color: '#F97316', bgColor: '#FFF7ED', label: '💪 Fisico' },
    mentale: { color: '#14B8A6', bgColor: '#F0FDFA', label: '🧘 Mentale' }
  };

  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
    return match ? match[1] : null;
  };

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
        <Link href="/plans" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
          ← Piani
        </Link>
        <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 800, marginTop: '8px' }}>
          📋 {plan.title}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginTop: '4px' }}>
          {isCoach ? `👤 Per: ${plan.student?.full_name}` : `👨‍🏫 Da: ${plan.coach?.full_name}`}
        </p>
        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
          <span style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            color: '#fff'
          }}>
            📅 {new Date(plan.start_date).toLocaleDateString('it-IT')}
            {plan.end_date && ` - ${new Date(plan.end_date).toLocaleDateString('it-IT')}`}
          </span>
          <span style={{
            background: plan.status === 'active' ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.2)',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            color: '#fff'
          }}>
            {plan.status === 'active' ? '✅ Attivo' : '📁 Completato'}
          </span>
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Obiettivo */}
        {plan.description && (
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '16px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '12px' }}>
              🎯 Obiettivo
            </h2>
            <p style={{ color: '#64748B', fontSize: '15px', lineHeight: 1.6 }}>{plan.description}</p>
          </div>
        )}

        {/* Video da Studiare */}
        {videos.length > 0 && (
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '16px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '16px' }}>
              📹 Video da Studiare
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {videos.map((video, i) => {
                const ytId = getYouTubeId(video.url);
                return (
                  <div key={i} style={{
                    background: '#F8FAFC',
                    borderRadius: '14px',
                    overflow: 'hidden'
                  }}>
                    {ytId && (
                      <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                        <iframe
                          src={`https://www.youtube.com/embed/${ytId}`}
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                          allowFullScreen
                        />
                      </div>
                    )}
                    <div style={{ padding: '12px 16px' }}>
                      <p style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a2e' }}>{video.title}</p>
                      {!ytId && (
                        <a href={video.url} target="_blank" rel="noopener noreferrer" style={{ color: '#0066FF', fontSize: '13px', textDecoration: 'none' }}>
                          🔗 Apri video →
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Esercizi */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '16px' }}>
            🏋️ Esercizi ({exercises.length})
          </h2>
          
          {exercises.length === 0 ? (
            <p style={{ color: '#94A3B8', textAlign: 'center', padding: '20px' }}>Nessun esercizio</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {exercises.map((ex, i) => {
                const catStyle = categoryColors[ex.category] || categoryColors.tecnica;
                const ytId = ex.videoUrl ? getYouTubeId(ex.videoUrl) : null;
                
                return (
                  <div key={ex.id || i} style={{
                    background: catStyle.bgColor,
                    borderRadius: '16px',
                    padding: '16px',
                    border: `1px solid ${catStyle.color}20`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                      <span style={{
                        width: '28px',
                        height: '28px',
                        background: catStyle.color,
                        color: '#fff',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: 700,
                        flexShrink: 0
                      }}>
                        {i + 1}
                      </span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 700, fontSize: '15px', color: '#1a1a2e' }}>{ex.name}</p>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                          {ex.duration && (
                            <span style={{ fontSize: '12px', color: '#64748B' }}>⏱️ {ex.duration}</span>
                          )}
                          <span style={{ fontSize: '11px', color: catStyle.color, background: '#fff', padding: '2px 8px', borderRadius: '10px' }}>
                            {catStyle.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {ex.description && (
                      <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '12px', lineHeight: 1.5 }}>
                        {ex.description}
                      </p>
                    )}

                    {ex.notes && (
                      <div style={{
                        background: '#fff',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        marginBottom: '12px',
                        border: '1px solid #E2E8F0'
                      }}>
                        <p style={{ fontSize: '12px', color: '#64748B' }}>
                          💬 <strong>Note del coach:</strong> {ex.notes}
                        </p>
                      </div>
                    )}

                    {ytId && (
                      <div style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '12px' }}>
                        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                          <iframe
                            src={`https://www.youtube.com/embed/${ytId}`}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                            allowFullScreen
                          />
                        </div>
                      </div>
                    )}

                    {ex.videoUrl && !ytId && (
                      <a href={ex.videoUrl} target="_blank" rel="noopener noreferrer" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#0066FF',
                        fontSize: '13px',
                        textDecoration: 'none',
                        marginBottom: '12px'
                      }}>
                        🎬 Guarda video →
                      </a>
                    )}

                    {isStudent && (
                      <ExerciseFeedback planId={plan.id} exerciseId={ex.id} exerciseName={ex.name} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Note del Coach */}
        {plan.coach_notes && (
          <div style={{
            background: '#EFF6FF',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '16px',
            border: '1px solid #BFDBFE'
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1E40AF', marginBottom: '12px' }}>
              👨‍🏫 Messaggio del Coach
            </h2>
            <p style={{ color: '#1E40AF', fontSize: '15px', lineHeight: 1.6 }}>{plan.coach_notes}</p>
          </div>
        )}

        {/* Pulsante Elimina (solo coach) */}
        <DeletePlanButton planId={plan.id} isCoach={isCoach} />
      </div>
    </div>
  );
}
