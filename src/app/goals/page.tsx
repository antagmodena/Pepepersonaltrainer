'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function GoalsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [goalId, setGoalId] = useState<string | null>(null);
  
  const [technicalGoal, setTechnicalGoal] = useState('');
  const [sportsGoal, setSportsGoal] = useState('');
  const [mentalGoal, setMentalGoal] = useState('');
  const [notes, setNotes] = useState('');
  
  const currentYear = new Date().getFullYear();
  
  const supabase = createClient();

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('season_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('season_year', currentYear)
      .single();

    if (data) {
      setGoalId(data.id);
      setTechnicalGoal(data.technical_goal || '');
      setSportsGoal(data.sports_goal || '');
      setMentalGoal(data.mental_goal || '');
      setNotes(data.notes || '');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Devi essere loggato');
      setSaving(false);
      return;
    }

    const goalData = {
      user_id: user.id,
      season_year: currentYear,
      technical_goal: technicalGoal || null,
      sports_goal: sportsGoal || null,
      mental_goal: mentalGoal || null,
      notes: notes || null,
    };

    let result;
    if (goalId) {
      result = await supabase
        .from('season_goals')
        .update(goalData)
        .eq('id', goalId);
    } else {
      result = await supabase
        .from('season_goals')
        .insert(goalData)
        .select()
        .single();
      if (result.data) {
        setGoalId(result.data.id);
      }
    }

    if (result.error) {
      setError(result.error.message);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--color-gray)]">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-lg mx-auto">
        
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard" className="text-[var(--color-blue)] font-medium">
            ← Indietro
          </Link>
          <h1 className="text-xl font-bold text-[var(--color-dark-blue)]">Obiettivi {currentYear}</h1>
          <div className="w-16"></div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-600 p-4 rounded-xl mb-6 text-sm border border-green-200">
            ✓ Salvato con successo!
          </div>
        )}

        <div className="space-y-6">
          
          {/* Obiettivo Tecnico */}
          <div className="card">
            <h2 className="section-title">🎾 Obiettivo Tecnico</h2>
            <p className="text-sm text-[var(--color-gray)] mb-3">
              Es: migliorare volée, smash, gioco a rete
            </p>
            <textarea
              value={technicalGoal}
              onChange={(e) => setTechnicalGoal(e.target.value)}
              className="input-field min-h-[120px]"
              placeholder="Qual è il tuo obiettivo tecnico principale per questa stagione?"
            />
          </div>

          {/* Obiettivo Sportivo */}
          <div className="card">
            <h2 className="section-title">🏆 Obiettivo Sportivo</h2>
            <p className="text-sm text-[var(--color-gray)] mb-3">
              Es: salire di livello, vincere tornei, costanza nei risultati
            </p>
            <textarea
              value={sportsGoal}
              onChange={(e) => setSportsGoal(e.target.value)}
              className="input-field min-h-[120px]"
              placeholder="Qual è il tuo obiettivo sportivo principale per questa stagione?"
            />
          </div>

          {/* Obiettivo Mentale */}
          <div className="card">
            <h2 className="section-title">💭 Obiettivo Mentale</h2>
            <p className="text-sm text-[var(--color-gray)] mb-3">
              Es: gestione errori, calma, lucidità nei momenti chiave
            </p>
            <textarea
              value={mentalGoal}
              onChange={(e) => setMentalGoal(e.target.value)}
              className="input-field min-h-[120px]"
              placeholder="Qual è il tuo obiettivo mentale principale per questa stagione?"
            />
          </div>

          {/* Note */}
          <div className="card">
            <h2 className="section-title">📝 Note aggiuntive</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field min-h-[100px]"
              placeholder="Altre considerazioni sulla tua stagione..."
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full"
          >
            {saving ? 'Salvataggio...' : 'Salva Obiettivi'}
          </button>
        </div>

      </div>
    </div>
  );
}
