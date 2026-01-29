'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Student {
  id: string;
  full_name: string;
}

export default function NewEvaluationPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState('');
  const [evaluationDate, setEvaluationDate] = useState('');
  const [techVolee, setTechVolee] = useState(5);
  const [techBandeja, setTechBandeja] = useState(5);
  const [techSmash, setTechSmash] = useState(5);
  const [techServizio, setTechServizio] = useState(5);
  const [techDifesa, setTechDifesa] = useState(5);
  const [tactPosizione, setTactPosizione] = useState(5);
  const [tactLetturaGioco, setTactLetturaGioco] = useState(5);
  const [tactSceltaColpi, setTactSceltaColpi] = useState(5);
  const [physVelocita, setPhysVelocita] = useState(5);
  const [physResistenza, setPhysResistenza] = useState(5);
  const [mentalConcentrazione, setMentalConcentrazione] = useState(5);
  const [mentalGestionePressione, setMentalGestionePressione] = useState(5);
  const [notes, setNotes] = useState('');
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

    const { error } = await supabase.from('student_evaluations').insert({
      coach_id: user.id,
      student_id: studentId,
      evaluation_date: evaluationDate,
      tech_volee: techVolee,
      tech_bandeja: techBandeja,
      tech_smash: techSmash,
      tech_servizio: techServizio,
      tech_difesa: techDifesa,
      tact_posizione: tactPosizione,
      tact_lettura_gioco: tactLetturaGioco,
      tact_scelta_colpi: tactSceltaColpi,
      phys_velocita: physVelocita,
      phys_resistenza: physResistenza,
      mental_concentrazione: mentalConcentrazione,
      mental_gestione_pressione: mentalGestionePressione,
      notes: notes || null
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/evaluations');
      router.refresh();
    }
  };

  const RatingSlider = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm">{label}</span>
        <span className="font-bold text-[var(--color-blue)]">{value}/10</span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-[var(--color-light)] rounded-lg appearance-none cursor-pointer accent-[var(--color-azure)]"
      />
    </div>
  );

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-lg mx-auto">
        
        <div className="flex items-center justify-between mb-6">
          <Link href="/evaluations" className="text-[var(--color-blue)] font-medium">
            ← Annulla
          </Link>
          <h1 className="text-xl font-bold text-[var(--color-dark-blue)]">Nuova Valutazione</h1>
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
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="input-field" required>
              <option value="">Seleziona allievo...</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
            <div className="mt-4">
              <label className="block text-sm font-semibold mb-2">Data valutazione</label>
              <input type="date" value={evaluationDate} onChange={(e) => setEvaluationDate(e.target.value)} className="input-field" required />
            </div>
          </div>

          <div className="card">
            <h2 className="section-title">🎾 Tecnica</h2>
            <RatingSlider label="Volée" value={techVolee} onChange={setTechVolee} />
            <RatingSlider label="Bandeja" value={techBandeja} onChange={setTechBandeja} />
            <RatingSlider label="Smash" value={techSmash} onChange={setTechSmash} />
            <RatingSlider label="Servizio" value={techServizio} onChange={setTechServizio} />
            <RatingSlider label="Difesa" value={techDifesa} onChange={setTechDifesa} />
          </div>

          <div className="card">
            <h2 className="section-title">🧠 Tattica</h2>
            <RatingSlider label="Posizione in campo" value={tactPosizione} onChange={setTactPosizione} />
            <RatingSlider label="Lettura del gioco" value={tactLetturaGioco} onChange={setTactLetturaGioco} />
            <RatingSlider label="Scelta dei colpi" value={tactSceltaColpi} onChange={setTactSceltaColpi} />
          </div>

          <div className="card">
            <h2 className="section-title">💪 Fisico</h2>
            <RatingSlider label="Velocità" value={physVelocita} onChange={setPhysVelocita} />
            <RatingSlider label="Resistenza" value={physResistenza} onChange={setPhysResistenza} />
          </div>

          <div className="card">
            <h2 className="section-title">💭 Mentale</h2>
            <RatingSlider label="Concentrazione" value={mentalConcentrazione} onChange={setMentalConcentrazione} />
            <RatingSlider label="Gestione pressione" value={mentalGestionePressione} onChange={setMentalGestionePressione} />
          </div>

          <div className="card">
            <h2 className="section-title">📝 Note</h2>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field min-h-[100px]" placeholder="Osservazioni aggiuntive..." />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Salvataggio...' : 'Salva Valutazione'}
          </button>
        </form>

      </div>
    </div>
  );
}
