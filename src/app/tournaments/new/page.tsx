'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Student {
  id: string;
  full_name: string;
}

export default function NewTournamentPage() {
  const [isCoach, setIsCoach] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState('');
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'coach') {
      setIsCoach(true);

      const { data } = await supabase
        .from('student_coach_links')
        .select('student:profiles!student_coach_links_student_id_fkey(id, full_name)')
        .eq('coach_id', user.id)
        .eq('status', 'accepted');

      if (data) {
        setStudents(data.map(d => d.student as unknown as Student));
      }
    }
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

    const tournamentData: Record<string, unknown> = {
      title,
      event_date: eventDate,
      event_type: 'tournament',
      is_tournament: true,
      location: location || null,
      tournament_category: category || null,
      notes: notes || null,
    };

    if (isCoach && studentId) {
      // Coach assegna torneo a un allievo
      tournamentData.user_id = studentId;
      tournamentData.created_for_user_id = studentId;
      tournamentData.created_by_coach_id = user.id;
    } else {
      // Allievo crea il proprio torneo
      tournamentData.user_id = user.id;
    }

    const { error } = await supabase.from('events').insert(tournamentData);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/tournaments');
      router.refresh();
    }
  };

  const categories = [
    '1ª Categoria',
    '2ª Categoria', 
    '3ª Categoria',
    '4ª Categoria',
    '5ª Categoria',
    'Open',
    'Amatoriale',
    'Giovanile',
  ];

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-lg mx-auto">
        
        <div className="flex items-center justify-between mb-6">
          <Link href="/tournaments" className="text-[var(--color-blue)] font-medium">
            ← Annulla
          </Link>
          <h1 className="text-xl font-bold text-[var(--color-dark-blue)]">Nuovo Torneo</h1>
          <div className="w-16"></div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {isCoach && (
            <div className="card">
              <h2 className="section-title">👤 Assegna a</h2>
              <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="input-field">
                <option value="">Me stesso (nessun allievo)</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="card">
            <h2 className="section-title">🏆 Dettagli Torneo</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Nome torneo</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field"
                  placeholder="Es: Torneo Padel Club Milano"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Data</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Luogo</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="input-field"
                  placeholder="Es: Padel Club Milano"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Categoria</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field">
                  <option value="">Seleziona categoria...</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Note</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field min-h-[80px]"
                  placeholder="Obiettivi, preparazione, avversari..."
                />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Salvataggio...' : 'Salva Torneo'}
          </button>
        </form>

      </div>
    </div>
  );
}
