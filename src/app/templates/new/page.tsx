'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EXERCISE_LIBRARY, EXERCISE_CATEGORIES, ExerciseCategory } from '@/lib/exercises';

interface SelectedExercise {
  id: string; name: string; category: string; duration: string; description: string;
  videoUrl?: string; notes?: string;
}

export default function NewTemplatePage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationWeeks, setDurationWeeks] = useState(1);
  const [level, setLevel] = useState('tutti');
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
  const [coachVideos, setCoachVideos] = useState<any[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<ExerciseCategory>('tecnica');
  const [coachNotes, setCoachNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { loadCoachVideos(); }, []);

  const loadCoachVideos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('coach_videos').select('*').eq('coach_id', user.id);
    setCoachVideos(data || []);
  };

  const addExercise = (exercise: typeof EXERCISE_LIBRARY.tecnica[0], category: string) => {
    if (selectedExercises.find(e => e.id === exercise.id)) return;
    setSelectedExercises([...selectedExercises, { ...exercise, category, videoUrl: '', notes: '' }]);
  };

  const removeExercise = (id: string) => setSelectedExercises(selectedExercises.filter(e => e.id !== id));

  const updateExercise = (id: string, field: string, value: string) => {
    setSelectedExercises(selectedExercises.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const toggleVideo = (videoId: string) => {
    setSelectedVideos(prev => 
      prev.includes(videoId) ? prev.filter(id => id !== videoId) : [...prev, videoId]
    );
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const videosToSave = coachVideos
      .filter(v => selectedVideos.includes(v.id))
      .map(v => ({ title: v.title, url: v.url }));

    await supabase.from('plan_templates').insert({
      coach_id: user.id,
      title,
      description: description || null,
      duration_weeks: durationWeeks,
      level,
      exercises: selectedExercises,
      videos: videosToSave,
      coach_notes: coachNotes || null
    });

    router.push('/templates');
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    fontSize: '15px',
    border: '2px solid #E2E8F0',
    borderRadius: '12px',
    outline: 'none',
    background: '#fff'
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
      paddingBottom: '100px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
        padding: '48px 24px 32px',
        borderRadius: '0 0 32px 32px',
        marginBottom: '24px'
      }}>
        <Link href="/templates" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
          ← Annulla
        </Link>
        <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>
          📋 Nuovo Template
        </h1>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Info Base */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '16px' }}>📝 Informazioni</h2>
          
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nome template (es: Settimana Tipo Principiante)"
            style={{ ...inputStyle, marginBottom: '12px' }}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrizione e obiettivi..."
            style={{ ...inputStyle, marginBottom: '12px', minHeight: '80px', resize: 'vertical' }}
          />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#64748B' }}>Durata</label>
              <select value={durationWeeks} onChange={(e) => setDurationWeeks(Number(e.target.value))} style={{ ...inputStyle, cursor: 'pointer' }}>
                {[1, 2, 3, 4, 6, 8].map(w => (
                  <option key={w} value={w}>{w} settiman{w === 1 ? 'a' : 'e'}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#64748B' }}>Livello</label>
              <select value={level} onChange={(e) => setLevel(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="tutti">🎯 Tutti i livelli</option>
                <option value="principiante">🌱 Principiante</option>
                <option value="intermedio">📈 Intermedio</option>
                <option value="avanzato">🔥 Avanzato</option>
              </select>
            </div>
          </div>
        </div>

        {/* Video dalla Videoteca */}
        {coachVideos.length > 0 && (
          <div style={{ background: '#fff', borderRadius: '20px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '16px' }}>
              📹 Dalla mia Videoteca ({selectedVideos.length} selezionati)
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
              {coachVideos.map(video => (
                <div
                  key={video.id}
                  onClick={() => toggleVideo(video.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: selectedVideos.includes(video.id) ? '#F0FDF4' : '#F8FAFC',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    border: selectedVideos.includes(video.id) ? '2px solid #22C55E' : '2px solid transparent'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{selectedVideos.includes(video.id) ? '✅' : '⬜'}</span>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a2e' }}>{video.title}</p>
                    <p style={{ fontSize: '12px', color: '#64748B' }}>{video.category}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/videos" style={{ display: 'block', textAlign: 'center', marginTop: '12px', color: '#22C55E', fontSize: '13px', fontWeight: 600 }}>
              + Aggiungi nuovi video alla videoteca
            </Link>
          </div>
        )}

        {/* Esercizi */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '16px' }}>🏋️ Esercizi</h2>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
            {(Object.keys(EXERCISE_CATEGORIES) as ExerciseCategory[]).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  background: activeCategory === cat ? EXERCISE_CATEGORIES[cat].color : '#F1F5F9',
                  color: activeCategory === cat ? '#fff' : '#64748B',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {EXERCISE_CATEGORIES[cat].label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
            {EXERCISE_LIBRARY[activeCategory].map(ex => {
              const isSelected = selectedExercises.find(e => e.id === ex.id);
              return (
                <div
                  key={ex.id}
                  onClick={() => !isSelected && addExercise(ex, activeCategory)}
                  style={{
                    padding: '12px 16px',
                    background: isSelected ? EXERCISE_CATEGORIES[activeCategory].bgColor : '#F8FAFC',
                    borderRadius: '12px',
                    cursor: isSelected ? 'default' : 'pointer',
                    border: isSelected ? `2px solid ${EXERCISE_CATEGORIES[activeCategory].color}` : '2px solid transparent',
                    opacity: isSelected ? 0.6 : 1
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a2e' }}>{ex.name}</p>
                      <p style={{ fontSize: '12px', color: '#64748B' }}>{ex.duration}</p>
                    </div>
                    <span style={{ color: isSelected ? EXERCISE_CATEGORIES[activeCategory].color : '#CBD5E1', fontWeight: 700 }}>
                      {isSelected ? '✓' : '+'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Esercizi Selezionati */}
        {selectedExercises.length > 0 && (
          <div style={{ background: '#fff', borderRadius: '20px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '16px' }}>
              ✅ Esercizi nel Template ({selectedExercises.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {selectedExercises.map((ex, i) => (
                <div key={ex.id} style={{
                  padding: '14px',
                  background: '#F8FAFC',
                  borderRadius: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a2e' }}>#{i + 1} {ex.name}</span>
                    <button onClick={() => removeExercise(ex.id)} style={{ background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                  </div>
                  <input
                    type="text"
                    value={ex.notes || ''}
                    onChange={(e) => updateExercise(ex.id, 'notes', e.target.value)}
                    placeholder="Note per l'allievo..."
                    style={{ ...inputStyle, fontSize: '13px', padding: '10px 12px' }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Note Coach */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '12px' }}>📝 Note Generali</h2>
          <textarea
            value={coachNotes}
            onChange={(e) => setCoachNotes(e.target.value)}
            placeholder="Istruzioni generali per chi riceve questo piano..."
            style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
          />
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving || !title.trim()}
          style={{
            width: '100%',
            padding: '18px',
            background: !title.trim() ? '#E2E8F0' : 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
            color: !title.trim() ? '#94A3B8' : '#fff',
            border: 'none',
            borderRadius: '14px',
            fontSize: '17px',
            fontWeight: 700,
            cursor: !title.trim() ? 'not-allowed' : 'pointer',
            boxShadow: !title.trim() ? 'none' : '0 8px 32px rgba(34, 197, 94, 0.3)'
          }}
        >
          {saving ? 'Salvataggio...' : '💾 Salva Template'}
        </button>
      </div>
    </div>
  );
}
