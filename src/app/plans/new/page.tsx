'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EXERCISE_LIBRARY, EXERCISE_CATEGORIES, ExerciseCategory } from '@/lib/exercises';

interface Student { id: string; full_name: string; }
interface SelectedExercise {
  id: string; name: string; category: string; duration: string; description: string;
  videoUrl?: string; notes?: string;
}

export default function NewPlanPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
  const [videos, setVideos] = useState<{ title: string; url: string }[]>([]);
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [coachNotes, setCoachNotes] = useState('');
  const [activeCategory, setActiveCategory] = useState<ExerciseCategory>('tecnica');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { loadStudents(); }, []);

  const loadStudents = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('coach_student_connections')
      .select('*, student:profiles!coach_student_connections_student_id_fkey(id, full_name)')
      .eq('coach_id', user.id)
      .eq('status', 'accepted');
    if (data) setStudents(data.map(d => d.student as unknown as Student));
    setLoading(false);
  };

  const addExercise = (exercise: typeof EXERCISE_LIBRARY.tecnica[0], category: string) => {
    if (selectedExercises.find(e => e.id === exercise.id)) return;
    setSelectedExercises([...selectedExercises, { ...exercise, category, videoUrl: '', notes: '' }]);
  };

  const removeExercise = (id: string) => setSelectedExercises(selectedExercises.filter(e => e.id !== id));

  const updateExercise = (id: string, field: string, value: string) => {
    setSelectedExercises(selectedExercises.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const addVideo = () => {
    if (!newVideoTitle.trim() || !newVideoUrl.trim()) return;
    setVideos([...videos, { title: newVideoTitle, url: newVideoUrl }]);
    setNewVideoTitle(''); setNewVideoUrl('');
  };

  const removeVideo = (index: number) => setVideos(videos.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !title.trim()) { setError('Seleziona allievo e titolo'); return; }
    setSaving(true); setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Non autenticato'); setSaving(false); return; }

    const { error: err } = await supabase.from('training_plans').insert({
      coach_id: user.id,
      student_id: studentId,
      title,
      description: description || null,
      start_date: startDate || new Date().toISOString().split('T')[0],
      end_date: endDate || null,
      exercises: selectedExercises,
      videos,
      coach_notes: coachNotes || null,
      status: 'active'
    });

    if (err) { setError(err.message); setSaving(false); }
    else { router.push('/plans'); router.refresh(); }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', fontSize: '15px',
    border: '2px solid #E2E8F0', borderRadius: '12px', outline: 'none', background: '#fff'
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <p style={{ color: '#94A3B8' }}>Caricamento...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)', paddingBottom: '100px' }}>
      <div style={{ background: 'linear-gradient(135deg, #0066FF 0%, #00D4AA 100%)', padding: '48px 24px 32px', borderRadius: '0 0 32px 32px', marginBottom: '24px' }}>
        <Link href="/plans" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>← Annulla</Link>
        <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>📋 Nuovo Piano</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '0 20px' }}>
        {error && (
          <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '16px', borderRadius: '12px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>
        )}

        {/* Info Base */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '16px' }}>📝 Informazioni</h2>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Allievo *</label>
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }} required>
              <option value="">Seleziona allievo...</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Titolo *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Es: Migliorare la Bandeja" style={inputStyle} required />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Obiettivo</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Cosa vogliamo raggiungere?" style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Inizio</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Fine</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Video YouTube */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '16px' }}>📹 Video da Studiare</h2>
          {videos.length > 0 && (
            <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {videos.map((v, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#F8FAFC', borderRadius: '10px' }}>
                  <span style={{ fontSize: '20px' }}>🎬</span>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a2e' }}>{v.title}</p>
                    <p style={{ fontSize: '12px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.url}</p>
                  </div>
                  <button type="button" onClick={() => removeVideo(i)} style={{ background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontWeight: 600 }}>✕</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input type="text" value={newVideoTitle} onChange={(e) => setNewVideoTitle(e.target.value)} placeholder="Titolo (es: Bandeja di Lebron)" style={inputStyle} />
            <input type="url" value={newVideoUrl} onChange={(e) => setNewVideoUrl(e.target.value)} placeholder="Link YouTube" style={inputStyle} />
            <button type="button" onClick={addVideo} disabled={!newVideoTitle.trim() || !newVideoUrl.trim()} style={{ padding: '12px', background: newVideoTitle && newVideoUrl ? '#0066FF' : '#E2E8F0', color: newVideoTitle && newVideoUrl ? '#fff' : '#94A3B8', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: newVideoTitle && newVideoUrl ? 'pointer' : 'not-allowed' }}>
              + Aggiungi Video
            </button>
          </div>
        </div>

        {/* Libreria Esercizi */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '16px' }}>🏋️ Libreria Esercizi</h2>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
            {(Object.keys(EXERCISE_CATEGORIES) as ExerciseCategory[]).map(cat => (
              <button key={cat} type="button" onClick={() => setActiveCategory(cat)} style={{ padding: '10px 16px', borderRadius: '20px', border: 'none', background: activeCategory === cat ? EXERCISE_CATEGORIES[cat].color : '#F1F5F9', color: activeCategory === cat ? '#fff' : '#64748B', fontWeight: 600, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {EXERCISE_CATEGORIES[cat].label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
            {EXERCISE_LIBRARY[activeCategory].map(ex => {
              const isSelected = selectedExercises.find(e => e.id === ex.id);
              return (
                <div key={ex.id} onClick={() => !isSelected && addExercise(ex, activeCategory)} style={{ padding: '12px 16px', background: isSelected ? EXERCISE_CATEGORIES[activeCategory].bgColor : '#F8FAFC', borderRadius: '12px', cursor: isSelected ? 'default' : 'pointer', border: isSelected ? `2px solid ${EXERCISE_CATEGORIES[activeCategory].color}` : '2px solid transparent', opacity: isSelected ? 0.6 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a2e' }}>{ex.name}</p>
                      <p style={{ fontSize: '12px', color: '#64748B' }}>{ex.duration}</p>
                    </div>
                    <span style={{ color: isSelected ? EXERCISE_CATEGORIES[activeCategory].color : '#CBD5E1', fontWeight: 700 }}>{isSelected ? '✓' : '+'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Esercizi Selezionati */}
        {selectedExercises.length > 0 && (
          <div style={{ background: '#fff', borderRadius: '20px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '16px' }}>✅ Esercizi Selezionati ({selectedExercises.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {selectedExercises.map((ex, i) => (
                <div key={ex.id} style={{ padding: '16px', background: EXERCISE_CATEGORIES[ex.category as ExerciseCategory]?.bgColor || '#F8FAFC', borderRadius: '14px', border: `1px solid ${EXERCISE_CATEGORIES[ex.category as ExerciseCategory]?.color || '#E2E8F0'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: '#64748B' }}>#{i + 1}</span>
                      <p style={{ fontWeight: 700, fontSize: '15px', color: '#1a1a2e' }}>{ex.name}</p>
                      <p style={{ fontSize: '12px', color: '#64748B' }}>{ex.duration}</p>
                    </div>
                    <button type="button" onClick={() => removeExercise(ex.id)} style={{ background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontWeight: 600 }}>✕</button>
                  </div>
                  <input type="url" value={ex.videoUrl || ''} onChange={(e) => updateExercise(ex.id, 'videoUrl', e.target.value)} placeholder="Link video dimostrativo (opzionale)" style={{ ...inputStyle, marginBottom: '8px', fontSize: '13px', padding: '10px 12px' }} />
                  <input type="text" value={ex.notes || ''} onChange={(e) => updateExercise(ex.id, 'notes', e.target.value)} placeholder="Note per l'allievo..." style={{ ...inputStyle, fontSize: '13px', padding: '10px 12px' }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Note Coach */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '12px' }}>📝 Note del Coach</h2>
          <textarea value={coachNotes} onChange={(e) => setCoachNotes(e.target.value)} placeholder="Messaggi o istruzioni per l'allievo..." style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} />
        </div>

        <button type="submit" disabled={saving || !studentId || !title.trim()} style={{ width: '100%', padding: '18px', background: (!studentId || !title.trim()) ? '#E2E8F0' : 'linear-gradient(135deg, #0066FF 0%, #0052CC 100%)', color: (!studentId || !title.trim()) ? '#94A3B8' : '#fff', border: 'none', borderRadius: '14px', fontSize: '17px', fontWeight: 700, cursor: (!studentId || !title.trim()) ? 'not-allowed' : 'pointer', boxShadow: (!studentId || !title.trim()) ? 'none' : '0 8px 32px rgba(0, 102, 255, 0.3)' }}>
          {saving ? 'Invio in corso...' : '📤 Invia Piano'}
        </button>
      </form>
    </div>
  );
}
