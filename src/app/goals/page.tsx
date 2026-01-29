'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function GoalsPage() {
  const [technicalGoal, setTechnicalGoal] = useState('');
  const [sportsGoal, setSportsGoal] = useState('');
  const [mentalGoal, setMentalGoal] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const supabase = createClient();
  const currentYear = new Date().getFullYear();

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
      setTechnicalGoal(data.technical_goal || '');
      setSportsGoal(data.sports_goal || '');
      setMentalGoal(data.mental_goal || '');
      setNotes(data.notes || '');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existing } = await supabase
      .from('season_goals')
      .select('id')
      .eq('user_id', user.id)
      .eq('season_year', currentYear)
      .single();

    if (existing) {
      await supabase.from('season_goals').update({
        technical_goal: technicalGoal,
        sports_goal: sportsGoal,
        mental_goal: mentalGoal,
        notes
      }).eq('id', existing.id);
    } else {
      await supabase.from('season_goals').insert({
        user_id: user.id,
        season_year: currentYear,
        technical_goal: technicalGoal,
        sports_goal: sportsGoal,
        mental_goal: mentalGoal,
        notes
      });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    fontSize: '15px',
    border: '2px solid #E2E8F0',
    borderRadius: '12px',
    outline: 'none',
    background: '#fff',
    minHeight: '100px',
    resize: 'vertical' as const
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <p style={{ color: '#94A3B8' }}>Caricamento...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
      paddingBottom: '100px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #0066FF 0%, #00D4AA 100%)',
        padding: '48px 24px 32px',
        borderRadius: '0 0 32px 32px',
        marginBottom: '24px'
      }}>
        <Link href="/profile" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
          ← Profilo
        </Link>
        <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>
          🎯 Obiettivi {currentYear}
        </h1>
      </div>

      <div style={{ padding: '0 20px' }}>
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '12px' }}>🎾 Obiettivo Tecnico</h2>
          <textarea
            value={technicalGoal}
            onChange={(e) => setTechnicalGoal(e.target.value)}
            placeholder="Es: Migliorare la bandeja, perfezionare il servizio..."
            style={inputStyle}
          />
        </div>

        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '12px' }}>🏆 Obiettivo Sportivo</h2>
          <textarea
            value={sportsGoal}
            onChange={(e) => setSportsGoal(e.target.value)}
            placeholder="Es: Vincere un torneo, salire di categoria..."
            style={inputStyle}
          />
        </div>

        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '12px' }}>🧠 Obiettivo Mentale</h2>
          <textarea
            value={mentalGoal}
            onChange={(e) => setMentalGoal(e.target.value)}
            placeholder="Es: Gestire meglio la pressione, mantenere la concentrazione..."
            style={inputStyle}
          />
        </div>

        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '12px' }}>📝 Note</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Altre note sugli obiettivi..."
            style={inputStyle}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%',
            padding: '16px',
            background: saved ? '#22C55E' : 'linear-gradient(135deg, #0066FF 0%, #0052CC 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '14px',
            fontSize: '16px',
            fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer',
            boxShadow: '0 8px 32px rgba(0, 102, 255, 0.3)'
          }}
        >
          {saving ? 'Salvataggio...' : saved ? '✅ Salvato!' : '💾 Salva Obiettivi'}
        </button>
      </div>
    </div>
  );
}
