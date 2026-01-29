'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Student {
  id: string;
  full_name: string;
}

export default function NewPlanPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exercises, setExercises] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('student_coach_links')
      .select('student:profiles!student_coach_links_student_id_fkey(id, full_name)')
      .eq('coach_id', user.id)
      .eq('status', 'accepted');

    if (data) {
      setStudents(data.map(d => d.student as unknown as Student));
    }
  };

  const addExercise = () => setExercises([...exercises, '']);
  
  const updateExercise = (index: number, value: string) => {
    const updated = [...exercises];
    updated[index] = value;
    setExercises(updated);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Devi essere loggato');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('training_plans').insert({
      coach_id: user.id,
      student_id: studentId,
      title,
      description: description || null,
      start_date: startDate,
      end_date: endDate || null,
      exercises: exercises.filter(e => e.trim() !== ''),
      status: 'active'
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/plans');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-lg mx-auto">
        
        <div className="flex items-center justify-between mb-6">
          <Link href="/plans" className="text-[var(--color-blue)] font-medium">
            ← Annulla
          </Link>
          <h1 className="text-xl font-bold text-[var(--color-dark-blue)]">Nuovo Piano</h1>
          <div className="w-16"></div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="card">
            <h2 className="section-title">👤 Allievo</h2>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="input-field"
              required
            >
              <option value="">Seleziona allievo...</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
          </div>

          <div className="card">
            <h2 className="section-title">📋 Dettagli Piano</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Titolo</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field"
                  placeholder="Es: Piano settimanale tecnica"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Descrizione</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field min-h-[80px]"
                  placeholder="Obiettivi del piano..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Data inizio</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Data fine</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="section-title">🏋️ Esercizi</h2>
            <div className="space-y-3">
              {exercises.map((ex, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={ex}
                    onChange={(e) => updateExercise(i, e.target.value)}
                    className="input-field flex-1"
                    placeholder={`Esercizio ${i + 1}`}
                  />
                  {exercises.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExercise(i)}
                      className="text-red-500 px-3"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addExercise}
                className="text-[var(--color-blue)] text-sm font-medium"
              >
                + Aggiungi esercizio
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Salvataggio...' : 'Crea Piano'}
          </button>
        </form>

      </div>
    </div>
  );
}
