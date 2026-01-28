'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function NewTrainingCard() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');
  
  const [trainingDate, setTrainingDate] = useState(dateParam || '');
  const [sessionType, setSessionType] = useState('training');
  const [partners, setPartners] = useState('');
  const [coachPresent, setCoachPresent] = useState(false);
  const [objective, setObjective] = useState('');
  
  const [doneWellIntensity, setDoneWellIntensity] = useState(false);
  const [doneWellConcentration, setDoneWellConcentration] = useState(false);
  const [doneWellAttitude, setDoneWellAttitude] = useState(false);
  const [doneWellOther, setDoneWellOther] = useState('');
  
  const [improvePosition, setImprovePosition] = useState(false);
  const [improveDecisionMaking, setImproveDecisionMaking] = useState(false);
  const [improvePartnerCommunication, setImprovePartnerCommunication] = useState(false);
  const [improveErrorManagement, setImproveErrorManagement] = useState(false);
  const [improveOther, setImproveOther] = useState('');
  
  const [personalNotes, setPersonalNotes] = useState('');
  const [studentFeedback, setStudentFeedback] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (dateParam) {
      setTrainingDate(dateParam);
    }
  }, [dateParam]);

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

    const { error } = await supabase.from('training_cards').insert({
      user_id: user.id,
      training_date: trainingDate,
      session_type: sessionType,
      partners: partners ? partners.split(',').map(p => p.trim()) : [],
      coach_present: coachPresent,
      objective,
      done_well_intensity: doneWellIntensity,
      done_well_concentration: doneWellConcentration,
      done_well_attitude: doneWellAttitude,
      done_well_other: doneWellOther || null,
      improve_position: improvePosition,
      improve_decision_making: improveDecisionMaking,
      improve_partner_communication: improvePartnerCommunication,
      improve_error_management: improveErrorManagement,
      improve_other: improveOther || null,
      personal_notes: personalNotes || null,
      student_feedback: studentFeedback || null,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/calendar');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-lg mx-auto">
        
        <div className="flex items-center justify-between mb-6">
          <Link href="/calendar" className="text-[var(--color-blue)] font-medium">
            ← Annulla
          </Link>
          <h1 className="text-xl font-bold text-[var(--color-dark-blue)]">Nuova Scheda</h1>
          <div className="w-16"></div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="card">
            <h2 className="section-title">📋 Informazioni generali</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Data</label>
                <input
                  type="date"
                  value={trainingDate}
                  onChange={(e) => setTrainingDate(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Tipo sessione</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSessionType('training')}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      sessionType === 'training'
                        ? 'border-[var(--color-azure)] bg-[var(--color-light)]'
                        : 'border-[var(--color-light-gray)]'
                    }`}
                  >
                    🏋️ Allenamento
                  </button>
                  <button
                    type="button"
                    onClick={() => setSessionType('match')}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      sessionType === 'match'
                        ? 'border-[var(--color-azure)] bg-[var(--color-light)]'
                        : 'border-[var(--color-light-gray)]'
                    }`}
                  >
                    🎮 Partita
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Compagni di gioco</label>
                <input
                  type="text"
                  value={partners}
                  onChange={(e) => setPartners(e.target.value)}
                  className="input-field"
                  placeholder="Es: Marco, Luca"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={coachPresent}
                  onChange={(e) => setCoachPresent(e.target.checked)}
                  className="checkbox-large"
                />
                <span className="font-medium">Maestro presente</span>
              </label>
            </div>
          </div>

          <div className="card">
            <h2 className="section-title">🎯 Obiettivo della sessione</h2>
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="input-field min-h-[100px]"
              placeholder="Su cosa dovevo lavorare oggi?"
            />
          </div>

          <div className="card">
            <h2 className="section-title">✅ Cose fatte bene</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={doneWellIntensity} onChange={(e) => setDoneWellIntensity(e.target.checked)} className="checkbox-large" />
                <span>Intensità</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={doneWellConcentration} onChange={(e) => setDoneWellConcentration(e.target.checked)} className="checkbox-large" />
                <span>Concentrazione</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={doneWellAttitude} onChange={(e) => setDoneWellAttitude(e.target.checked)} className="checkbox-large" />
                <span>Attitudine</span>
              </label>
              <div>
                <label className="block text-sm font-medium mb-2">Altro</label>
                <input type="text" value={doneWellOther} onChange={(e) => setDoneWellOther(e.target.value)} className="input-field" placeholder="Specifica..." />
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="section-title">⚠️ Aspetti da migliorare</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={improvePosition} onChange={(e) => setImprovePosition(e.target.checked)} className="checkbox-large" />
                <span>Posizione in campo</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={improveDecisionMaking} onChange={(e) => setImproveDecisionMaking(e.target.checked)} className="checkbox-large" />
                <span>Presa di decisioni</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={improvePartnerCommunication} onChange={(e) => setImprovePartnerCommunication(e.target.checked)} className="checkbox-large" />
                <span>Comunicazione col compagno</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={improveErrorManagement} onChange={(e) => setImproveErrorManagement(e.target.checked)} className="checkbox-large" />
                <span>Gestione degli errori</span>
              </label>
              <div>
                <label className="block text-sm font-medium mb-2">Altro</label>
                <input type="text" value={improveOther} onChange={(e) => setImproveOther(e.target.value)} className="input-field" placeholder="Specifica..." />
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="section-title">📝 Note personali</h2>
            <textarea value={personalNotes} onChange={(e) => setPersonalNotes(e.target.value)} className="input-field min-h-[100px]" placeholder="Come mi sono sentito? Cosa ho capito oggi?" />
          </div>

          <div className="card">
            <h2 className="section-title">💬 Il mio feedback</h2>
            <textarea value={studentFeedback} onChange={(e) => setStudentFeedback(e.target.value)} className="input-field min-h-[100px]" placeholder="Cosa penso del mio allenamento/partita..." />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Salvataggio...' : 'Salva Scheda'}
          </button>
        </form>

      </div>
    </div>
  );
}
