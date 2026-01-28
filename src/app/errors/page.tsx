'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ErrorsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [errorId, setErrorId] = useState<string | null>(null);
  
  // Errori tecnici
  const [techSimpleVolley, setTechSimpleVolley] = useState(false);
  const [techLateHit, setTechLateHit] = useState(false);
  const [techBandejaBounce, setTechBandejaBounce] = useState(false);
  const [techSmashIneffective, setTechSmashIneffective] = useState(false);
  const [techOther, setTechOther] = useState('');
  
  // Errori tattici
  const [tactUnclearDecisions, setTactUnclearDecisions] = useState(false);
  const [tactWrongTimingAttack, setTactWrongTimingAttack] = useState(false);
  const [tactLosePosition, setTactLosePosition] = useState(false);
  const [tactMisreadOpponent, setTactMisreadOpponent] = useState(false);
  const [tactOther, setTactOther] = useState('');
  
  // Errori mentali
  const [mentalGetNervous, setMentalGetNervous] = useState(false);
  const [mentalLoseFocusAfterError, setMentalLoseFocusAfterError] = useState(false);
  const [mentalHesitateKeyPoints, setMentalHesitateKeyPoints] = useState(false);
  const [mentalDropTensionWhenAhead, setMentalDropTensionWhenAhead] = useState(false);
  const [mentalOther, setMentalOther] = useState('');
  
  const [notes, setNotes] = useState('');
  
  const supabase = createClient();

  useEffect(() => {
    loadErrors();
  }, []);

  const loadErrors = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('common_errors')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setErrorId(data.id);
      setTechSimpleVolley(data.tech_simple_volley);
      setTechLateHit(data.tech_late_hit);
      setTechBandejaBounce(data.tech_bandeja_bounce);
      setTechSmashIneffective(data.tech_smash_ineffective);
      setTechOther(data.tech_other || '');
      setTactUnclearDecisions(data.tact_unclear_decisions);
      setTactWrongTimingAttack(data.tact_wrong_timing_attack);
      setTactLosePosition(data.tact_lose_position);
      setTactMisreadOpponent(data.tact_misread_opponent);
      setTactOther(data.tact_other || '');
      setMentalGetNervous(data.mental_get_nervous);
      setMentalLoseFocusAfterError(data.mental_lose_focus_after_error);
      setMentalHesitateKeyPoints(data.mental_hesitate_key_points);
      setMentalDropTensionWhenAhead(data.mental_drop_tension_when_ahead);
      setMentalOther(data.mental_other || '');
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

    const errorData = {
      user_id: user.id,
      tech_simple_volley: techSimpleVolley,
      tech_late_hit: techLateHit,
      tech_bandeja_bounce: techBandejaBounce,
      tech_smash_ineffective: techSmashIneffective,
      tech_other: techOther || null,
      tact_unclear_decisions: tactUnclearDecisions,
      tact_wrong_timing_attack: tactWrongTimingAttack,
      tact_lose_position: tactLosePosition,
      tact_misread_opponent: tactMisreadOpponent,
      tact_other: tactOther || null,
      mental_get_nervous: mentalGetNervous,
      mental_lose_focus_after_error: mentalLoseFocusAfterError,
      mental_hesitate_key_points: mentalHesitateKeyPoints,
      mental_drop_tension_when_ahead: mentalDropTensionWhenAhead,
      mental_other: mentalOther || null,
      notes: notes || null,
    };

    let result;
    if (errorId) {
      result = await supabase
        .from('common_errors')
        .update(errorData)
        .eq('id', errorId);
    } else {
      result = await supabase
        .from('common_errors')
        .insert(errorData)
        .select()
        .single();
      if (result.data) {
        setErrorId(result.data.id);
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
          <h1 className="text-xl font-bold text-[var(--color-dark-blue)]">Errori Comuni</h1>
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
          
          {/* Errori Tecnici */}
          <div className="card">
            <h2 className="section-title">🎾 Errori Tecnici</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={techSimpleVolley}
                  onChange={(e) => setTechSimpleVolley(e.target.checked)}
                  className="checkbox-large"
                />
                <span>Volée semplici</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={techLateHit}
                  onChange={(e) => setTechLateHit(e.target.checked)}
                  className="checkbox-large"
                />
                <span>Colpisco in ritardo</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={techBandejaBounce}
                  onChange={(e) => setTechBandejaBounce(e.target.checked)}
                  className="checkbox-large"
                />
                <span>Bandeja con troppo rimbalzo</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={techSmashIneffective}
                  onChange={(e) => setTechSmashIneffective(e.target.checked)}
                  className="checkbox-large"
                />
                <span>Smash poco efficace</span>
              </label>
              <div>
                <label className="block text-sm font-medium mb-2">Altro</label>
                <input
                  type="text"
                  value={techOther}
                  onChange={(e) => setTechOther(e.target.value)}
                  className="input-field"
                  placeholder="Specifica..."
                />
              </div>
            </div>
          </div>

          {/* Errori Tattici */}
          <div className="card">
            <h2 className="section-title">🧠 Errori Tattici</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tactUnclearDecisions}
                  onChange={(e) => setTactUnclearDecisions(e.target.checked)}
                  className="checkbox-large"
                />
                <span>Decisioni poco lucide</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tactWrongTimingAttack}
                  onChange={(e) => setTactWrongTimingAttack(e.target.checked)}
                  className="checkbox-large"
                />
                <span>Attacco nei momenti sbagliati</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tactLosePosition}
                  onChange={(e) => setTactLosePosition(e.target.checked)}
                  className="checkbox-large"
                />
                <span>Perdo posizione in campo</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tactMisreadOpponent}
                  onChange={(e) => setTactMisreadOpponent(e.target.checked)}
                  className="checkbox-large"
                />
                <span>Leggo male il gioco avversario</span>
              </label>
              <div>
                <label className="block text-sm font-medium mb-2">Altro</label>
                <input
                  type="text"
                  value={tactOther}
                  onChange={(e) => setTactOther(e.target.value)}
                  className="input-field"
                  placeholder="Specifica..."
                />
              </div>
            </div>
          </div>

          {/* Errori Mentali */}
          <div className="card">
            <h2 className="section-title">💭 Errori Mentali</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mentalGetNervous}
                  onChange={(e) => setMentalGetNervous(e.target.checked)}
                  className="checkbox-large"
                />
                <span>Mi innervosisco facilmente</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mentalLoseFocusAfterError}
                  onChange={(e) => setMentalLoseFocusAfterError(e.target.checked)}
                  className="checkbox-large"
                />
                <span>Perdo concentrazione dopo un errore</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mentalHesitateKeyPoints}
                  onChange={(e) => setMentalHesitateKeyPoints(e.target.checked)}
                  className="checkbox-large"
                />
                <span>Esito nei punti chiave</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mentalDropTensionWhenAhead}
                  onChange={(e) => setMentalDropTensionWhenAhead(e.target.checked)}
                  className="checkbox-large"
                />
                <span>Calo di tensione quando sono in vantaggio</span>
              </label>
              <div>
                <label className="block text-sm font-medium mb-2">Altro</label>
                <input
                  type="text"
                  value={mentalOther}
                  onChange={(e) => setMentalOther(e.target.value)}
                  className="input-field"
                  placeholder="Specifica..."
                />
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="card">
            <h2 className="section-title">📝 Note aggiuntive</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field min-h-[100px]"
              placeholder="Osservazioni sui tuoi errori ricorrenti..."
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full"
          >
            {saving ? 'Salvataggio...' : 'Salva'}
          </button>
        </div>

      </div>
    </div>
  );
}
