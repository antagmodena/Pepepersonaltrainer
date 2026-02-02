'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Student { id: string; full_name: string; }

export default function NewLessonPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState('');
  const [lessonDate, setLessonDate] = useState(new Date().toISOString().split('T')[0]);
  const [lessonTime, setLessonTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('coach_student_connections')
        .select('student:profiles!coach_student_connections_student_id_fkey(id, full_name)')
        .eq('coach_id', user.id)
        .eq('status', 'accepted');
      if (data) setStudents(data.map(d => d.student as unknown as Student));
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTime) { setError('Seleziona un orario'); return; }
    setLoading(true); setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: err } = await supabase.from('coach_lessons').insert({
      coach_id: user.id,
      student_id: studentId || null,
      lesson_date: lessonDate,
      lesson_time: lessonTime,
      duration_minutes: duration,
      topic: topic || null,
      notes: notes || null,
    });

    if (err) { setError(err.message); setLoading(false); }
    else { router.push('/dashboard'); router.refresh(); }
  };

  const quickTimes = ['08:00','09:00','10:00','11:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'];
  const quickTopics = ['Bandeja','Volée','Smash','Vibora','Servizio','Difesa','Tattica','Partita','Riscaldamento','Fisico'];

  return (
    <div style={{ minHeight: '100vh', background: '#fff', paddingBottom: '100px' }}>
      <div style={{
        background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #064E3B 100%)',
        padding: '48px 20px 24px', borderRadius: '0 0 28px 28px'
      }}>
        <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '15px' }}>← Annulla</Link>
        <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, marginTop: '12px' }}>📅 Nuova Lezione</h1>
      </div>

      <div style={{ padding: '20px' }}>
        {error && (
          <div style={{ background: '#FEE2E2', color: '#EF4444', padding: '14px', borderRadius: '14px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Data */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', border: '1px solid #E5E7EB', marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#6B7280', marginBottom: '10px' }}>📅 Data</p>
            <input type="date" value={lessonDate} onChange={e => setLessonDate(e.target.value)} required
              style={{ width: '100%', padding: '12px 16px', fontSize: '16px', border: '2px solid #E5E7EB', borderRadius: '12px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Orario quick select */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', border: '1px solid #E5E7EB', marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#6B7280', marginBottom: '10px' }}>⏰ Orario</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {quickTimes.map(t => (
                <button key={t} type="button" onClick={() => setLessonTime(t)}
                  style={{
                    padding: '10px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                    fontWeight: 700, fontSize: '14px',
                    background: lessonTime === t ? '#059669' : '#F3F4F6',
                    color: lessonTime === t ? '#fff' : '#374151'
                  }}>{t}</button>
              ))}
            </div>
            <input type="time" value={lessonTime} onChange={e => setLessonTime(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', fontSize: '16px', border: '2px solid #E5E7EB', borderRadius: '12px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Durata */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', border: '1px solid #E5E7EB', marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#6B7280', marginBottom: '10px' }}>⏱️ Durata</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[30, 45, 60, 90, 120].map(d => (
                <button key={d} type="button" onClick={() => setDuration(d)}
                  style={{
                    flex: 1, padding: '12px 4px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                    fontWeight: 700, fontSize: '14px',
                    background: duration === d ? '#059669' : '#F3F4F6',
                    color: duration === d ? '#fff' : '#374151'
                  }}>{d}min</button>
              ))}
            </div>
          </div>

          {/* Allievo */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', border: '1px solid #E5E7EB', marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#6B7280', marginBottom: '10px' }}>👤 Allievo (opzionale)</p>
            <select value={studentId} onChange={e => setStudentId(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: '2px solid #E5E7EB', borderRadius: '12px', outline: 'none', background: '#fff', boxSizing: 'border-box' }}>
              <option value="">Nessun allievo specifico</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
          </div>

          {/* Argomento quick select */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', border: '1px solid #E5E7EB', marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#6B7280', marginBottom: '10px' }}>🎾 Argomento</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {quickTopics.map(t => (
                <button key={t} type="button" onClick={() => setTopic(topic === t ? '' : t)}
                  style={{
                    padding: '8px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                    fontWeight: 600, fontSize: '13px',
                    background: topic === t ? '#059669' : '#F0FDF4',
                    color: topic === t ? '#fff' : '#059669'
                  }}>{t}</button>
              ))}
            </div>
            <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="O scrivi un argomento..."
              style={{ width: '100%', padding: '12px 16px', fontSize: '14px', border: '2px solid #E5E7EB', borderRadius: '12px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Note */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', border: '1px solid #E5E7EB', marginBottom: '20px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#6B7280', marginBottom: '10px' }}>📝 Note</p>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Obiettivi, esercizi da preparare..."
              style={{ width: '100%', padding: '12px 16px', fontSize: '14px', border: '2px solid #E5E7EB', borderRadius: '12px', outline: 'none', minHeight: '80px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading || !lessonTime}
            style={{
              width: '100%', padding: '18px', fontSize: '17px', fontWeight: 800,
              background: !lessonTime || loading ? '#D1D5DB' : 'linear-gradient(135deg, #059669, #047857)',
              color: '#fff', border: 'none', borderRadius: '16px', cursor: loading ? 'wait' : 'pointer',
              boxShadow: lessonTime && !loading ? '0 8px 24px rgba(5,150,105,0.3)' : 'none'
            }}>
            {loading ? 'Salvataggio...' : '✅ Programma Lezione'}
          </button>
        </form>
      </div>
    </div>
  );
}
