'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  fontSize: '15px',
  border: '2px solid #E2E8F0',
  borderRadius: '12px',
  outline: 'none',
  transition: 'border-color 0.2s',
  background: '#fff'
};

const checkboxContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 16px',
  background: '#F8FAFC',
  borderRadius: '12px',
  cursor: 'pointer'
};

function TrainingForm() {
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

  const SectionCard = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => (
    <div style={{
      background: '#fff',
      borderRadius: '20px',
      padding: '20px',
      marginBottom: '16px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      border: '1px solid rgba(0,0,0,0.04)'
    }}>
      <h2 style={{
        fontSize: '16px',
        fontWeight: 700,
        color: '#1a1a2e',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span>{icon}</span> {title}
      </h2>
      {children}
    </div>
  );

  const Checkbox = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
    <label style={checkboxContainerStyle}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: '20px', height: '20px', accentColor: '#0066FF' }}
      />
      <span style={{ fontSize: '15px', color: '#1a1a2e' }}>{label}</span>
    </label>
  );

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{
          background: '#FEF2F2',
          color: '#DC2626',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '16px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}
      
      <SectionCard title="Informazioni generali" icon="📋">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#1a1a2e' }}>Data</label>
            <input type="date" value={trainingDate} onChange={(e) => setTrainingDate(e.target.value)} style={inputStyle} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#1a1a2e' }}>Tipo sessione</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button type="button" onClick={() => setSessionType('training')} style={{
                padding: '14px',
                borderRadius: '12px',
                border: sessionType === 'training' ? '2px solid #0066FF' : '2px solid #E2E8F0',
                background: sessionType === 'training' ? '#EFF6FF' : '#fff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}>🏋️ Allenamento</button>
              <button type="button" onClick={() => setSessionType('match')} style={{
                padding: '14px',
                borderRadius: '12px',
                border: sessionType === 'match' ? '2px solid #0066FF' : '2px solid #E2E8F0',
                background: sessionType === 'match' ? '#EFF6FF' : '#fff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}>🎮 Partita</button>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#1a1a2e' }}>Compagni di gioco</label>
            <input type="text" value={partners} onChange={(e) => setPartners(e.target.value)} style={inputStyle} placeholder="Es: Marco, Luca" />
          </div>
          <Checkbox checked={coachPresent} onChange={setCoachPresent} label="👨‍🏫 Maestro presente" />
        </div>
      </SectionCard>

      <SectionCard title="Obiettivo della sessione" icon="🎯">
        <textarea value={objective} onChange={(e) => setObjective(e.target.value)} style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} placeholder="Su cosa dovevo lavorare oggi?" />
      </SectionCard>

      <SectionCard title="Cose fatte bene" icon="✅">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Checkbox checked={doneWellIntensity} onChange={setDoneWellIntensity} label="Intensità" />
          <Checkbox checked={doneWellConcentration} onChange={setDoneWellConcentration} label="Concentrazione" />
          <Checkbox checked={doneWellAttitude} onChange={setDoneWellAttitude} label="Attitudine" />
          <input type="text" value={doneWellOther} onChange={(e) => setDoneWellOther(e.target.value)} style={{ ...inputStyle, marginTop: '8px' }} placeholder="Altro..." />
        </div>
      </SectionCard>

      <SectionCard title="Aspetti da migliorare" icon="⚠️">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Checkbox checked={improvePosition} onChange={setImprovePosition} label="Posizione in campo" />
          <Checkbox checked={improveDecisionMaking} onChange={setImproveDecisionMaking} label="Presa di decisioni" />
          <Checkbox checked={improvePartnerCommunication} onChange={setImprovePartnerCommunication} label="Comunicazione col compagno" />
          <Checkbox checked={improveErrorManagement} onChange={setImproveErrorManagement} label="Gestione degli errori" />
          <input type="text" value={improveOther} onChange={(e) => setImproveOther(e.target.value)} style={{ ...inputStyle, marginTop: '8px' }} placeholder="Altro..." />
        </div>
      </SectionCard>

      <SectionCard title="Note personali" icon="📝">
        <textarea value={personalNotes} onChange={(e) => setPersonalNotes(e.target.value)} style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} placeholder="Come mi sono sentito?" />
      </SectionCard>

      <SectionCard title="Il mio feedback" icon="💬">
        <textarea value={studentFeedback} onChange={(e) => setStudentFeedback(e.target.value)} style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} placeholder="Cosa penso del mio allenamento..." />
      </SectionCard>

      <button type="submit" disabled={loading} style={{
        width: '100%',
        padding: '16px',
        background: loading ? '#94A3B8' : 'linear-gradient(135deg, #0066FF 0%, #0052CC 100%)',
        color: '#fff',
        border: 'none',
        borderRadius: '14px',
        fontSize: '16px',
        fontWeight: 700,
        cursor: loading ? 'not-allowed' : 'pointer',
        boxShadow: '0 8px 32px rgba(0, 102, 255, 0.3)',
        marginBottom: '20px'
      }}>
        {loading ? 'Salvataggio...' : '💾 Salva Scheda'}
      </button>
    </form>
  );
}

export default function NewTrainingCard() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
      paddingBottom: '100px'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0066FF 0%, #00D4AA 100%)',
        padding: '48px 24px 32px',
        borderRadius: '0 0 32px 32px',
        marginBottom: '24px'
      }}>
        <Link href="/calendar" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
          ← Annulla
        </Link>
        <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>
          ✍️ Nuova Scheda
        </h1>
      </div>

      <div style={{ padding: '0 20px' }}>
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>Caricamento...</div>}>
          <TrainingForm />
        </Suspense>
      </div>
    </div>
  );
}
