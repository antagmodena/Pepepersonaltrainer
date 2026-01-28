'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewEventPage() {
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('training');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const supabase = createClient();

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

    const { error } = await supabase.from('events').insert({
      user_id: user.id,
      title,
      event_type: eventType,
      event_date: eventDate,
      start_time: startTime || null,
      location: location || null,
      notes: notes || null,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/calendar');
      router.refresh();
    }
  };

  const eventTypes = [
    { value: 'training', label: 'Allenamento', emoji: '🏋️' },
    { value: 'match', label: 'Partita', emoji: '🎮' },
    { value: 'tournament', label: 'Torneo', emoji: '🏆' },
    { value: 'lesson', label: 'Lezione', emoji: '👨‍🏫' },
  ];

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-lg mx-auto">
        
        <div className="flex items-center justify-between mb-6">
          <Link href="/calendar" className="text-[var(--color-blue)] font-medium">
            ← Annulla
          </Link>
          <h1 className="text-xl font-bold text-[var(--color-dark-blue)]">Nuovo Evento</h1>
          <div className="w-16"></div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card space-y-5">
          
          <div>
            <label className="block text-sm font-semibold mb-2 text-[var(--color-dark-blue)]">
              Tipo evento
            </label>
            <div className="grid grid-cols-2 gap-2">
              {eventTypes.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setEventType(type.value)}
                  className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${
                    eventType === type.value
                      ? 'border-[var(--color-azure)] bg-[var(--color-light)]'
                      : 'border-[var(--color-light-gray)]'
                  }`}
                >
                  <span className="text-xl">{type.emoji}</span>
                  <span className="font-medium text-sm">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-[var(--color-dark-blue)]">
              Titolo
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="Es: Allenamento con Marco"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-[var(--color-dark-blue)]">
              Data
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-[var(--color-dark-blue)]">
              Ora (opzionale)
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-[var(--color-dark-blue)]">
              Luogo (opzionale)
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input-field"
              placeholder="Es: Club Padel Milano"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-[var(--color-dark-blue)]">
              Note (opzionale)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field min-h-[100px]"
              placeholder="Aggiungi note..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Salvataggio...' : 'Salva Evento'}
          </button>
        </form>

      </div>
    </div>
  );
}
