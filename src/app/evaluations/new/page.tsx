'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const accent = '#059669';

interface Student {
  id: string;
  full_name: string;
}

export default function NewEvaluationPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState('');
  const [evaluationDate, setEvaluationDate] = useState(new Date().toISOString().split('T')[0]);
  const [scores, setScores] = useState({
    tech_volee: 5, tech_bandeja: 5, tech_smash: 5, tech_servizio: 5, tech_difesa: 5,
    tact_posizione: 5, tact_lettura_gioco: 5, tact_scelta_colpi: 5,
    phys_velocita: 5, phys_resistenza: 5,
    mental_concentrazione: 5, mental_gestione_pressione: 5,
  });
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { loadStudents(); }, []);

  const loadStudents = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('coach_student_connections')
      .select('student:profiles!coach_student_connections_student_id_fkey(id, full_name)')
      .eq('coach_id', user.id)
      .eq('status', 'accepted');

    if (data) {
      setStudents(data.map(d => d.student as unknown as Student));
    }
  };

  const setScore = (key: string, value: number) => {
    setScores(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Devi essere loggato'); setLoading(false); return; }

    const { error: err } = await supabase.from('student_evaluations').insert({
      coach_id: user.id,
      student_id: studentId,
      evaluation_date: evaluationDate,
      ...scores,
      notes: notes || null
    });

    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      router.push('/evaluations');
      router.refresh();
    }
  };

  const sections = [
    {
      title: '🎾 Tecnica', color: '#3B82F6', bg: '#EFF6FF',
      fields: [
        { key: 'tech_volee', label: 'Volée' },
        { key: 'tech_bandeja', label: 'Bandeja' },
        { key: 'tech_smash', label: 'Smash' },
        { key: 'tech_servizio', label: 'Servizio' },
        { key: 'tech_difesa', label: 'Difesa' },
      ]
    },
    {
      title: '🧠 Tattica', color: '#059669', bg: '#F0FDF4',
      fields: [
        { key: 'tact_posizione', label: 'Posizione in campo' },
        { key: 'tact_lettura_gioco', label: 'Lettura del gioco' },
        { key: 'tact_scelta_colpi', label: 'Scelta dei colpi' },
      ]
    },
    {
      title: '💪 Fisico', color: '#F59E0B', bg: '#FFFBEB',
      fields: [
        { key: 'phys_velocita', label: 'Velocità' },
        { key: 'phys_resistenza', label: 'Resistenza' },
      ]
    },
    {
      title: '💭 Mentale', color: '#8B5CF6', bg: '#F5F3FF',
      fields: [
        { key: 'mental_concentrazione', label: 'Concentrazione' },
        { key: 'mental_gestione_pressione', label: 'Gestione pressione' },
      ]
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#fff', paddingBottom: '100px' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #064E3B 100%)',
        padding: '48px 20px 24px',
        borderRadius: '0 0 28px 28px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/evaluations" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '15px' }}>← Annulla</Link>
          <div style={{ width: '60px' }} />
        </div>
        <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, marginTop: '12px' }}>📊 Nuova Valutazione</h1>
      </div>

      <div style={{ padding: '20px' }}>
        {error && (
          <div style={{ background: '#FEE2E2', color: '#EF4444', padding: '14px 16px', borderRadius: '14px', marginBottom: '16px', fontSize: '14px', fontWeight: 500 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* Allievo + Data */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', border: '1px solid #E5E7EB', marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>👤 Allievo</p>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
              style={{
                width: '100%', padding: '12px 16px', fontSize: '15px',
                border: '2px solid #E5E7EB', borderRadius: '12px', outline: 'none',
                background: '#fff', boxSizing: 'border-box', marginBottom: '12px'
              }}
            >
              <option value="">Seleziona allievo...</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#6B7280', marginBottom: '6px' }}>📅 Data</p>
            <input
              type="date"
              value={evaluationDate}
              onChange={(e) => setEvaluationDate(e.target.value)}
              required
              style={{
                width: '100%', padding: '12px 16px', fontSize: '15px',
                border: '2px solid #E5E7EB', borderRadius: '12px', outline: 'none',
                background: '#fff', boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Rating sections */}
          {sections.map((section, si) => (
            <div key={si} style={{
              background: '#fff', borderRadius: '16px', padding: '16px',
              border: '1px solid #E5E7EB', marginBottom: '16px'
            }}>
              <p style={{
                fontSize: '15px', fontWeight: 800, color: section.color,
                marginBottom: '16px', padding: '8px 12px',
                background: section.bg, borderRadius: '10px', display: 'inline-block'
              }}>
                {section.title}
              </p>

              {section.fields.map(field => {
                const val = scores[field.key as keyof typeof scores];
                return (
                  <div key={field.key} style={{ marginBottom: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{field.label}</span>
                      <span style={{
                        fontSize: '16px', fontWeight: 800, color: section.color,
                        background: section.bg, padding: '2px 10px', borderRadius: '8px'
                      }}>{val}/10</span>
                    </div>

                    {/* Tap rating buttons */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[1,2,3,4,5,6,7,8,9,10].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setScore(field.key, n)}
                          style={{
                            flex: 1, height: '36px', borderRadius: '8px',
                            border: 'none', cursor: 'pointer',
                            fontWeight: 700, fontSize: '12px',
                            background: n <= val ? section.color : '#F3F4F6',
                            color: n <= val ? '#fff' : '#9CA3AF',
                            transition: 'all 0.15s'
                          }}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Note */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', border: '1px solid #E5E7EB', marginBottom: '20px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>📝 Note</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Osservazioni, punti di forza, aree di miglioramento..."
              style={{
                width: '100%', padding: '12px 16px', fontSize: '14px',
                border: '2px solid #E5E7EB', borderRadius: '12px', outline: 'none',
                background: '#fff', minHeight: '100px', resize: 'vertical',
                boxSizing: 'border-box', fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !studentId}
            style={{
              width: '100%', padding: '16px', fontSize: '16px', fontWeight: 800,
              background: (!studentId || loading) ? '#D1D5DB' : accent,
              color: '#fff', border: 'none', borderRadius: '16px', cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: studentId && !loading ? '0 4px 14px rgba(5, 150, 105, 0.3)' : 'none'
            }}
          >
            {loading ? 'Salvataggio...' : '✅ Salva Valutazione'}
          </button>
        </form>
      </div>
    </div>
  );
}
