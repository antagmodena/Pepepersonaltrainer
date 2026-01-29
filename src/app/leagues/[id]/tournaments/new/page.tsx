'use client';

import { useState, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewTournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: leagueId } = use(params);
  const [name, setName] = useState('');
  const [type, setType] = useState('roulette');
  const [saving, setSaving] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: tournament, error } = await supabase
      .from('tournaments')
      .insert({
        league_id: leagueId,
        name,
        type,
        status: 'open',
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      alert('Errore: ' + error.message);
      setSaving(false);
      return;
    }

    // Iscrivi automaticamente il creatore
    await supabase.from('tournament_players').insert({
      tournament_id: tournament.id,
      user_id: user.id
    });

    router.push(`/leagues/${leagueId}/tournaments/${tournament.id}`);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
      paddingBottom: '100px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
        padding: '48px 24px 32px',
        borderRadius: '0 0 32px 32px',
        marginBottom: '24px'
      }}>
        <Link href={`/leagues/${leagueId}/tournaments`} style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
          ← Annulla
        </Link>
        <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>
          ➕ Nuovo Torneo
        </h1>
      </div>

      <div style={{ padding: '0 20px' }}>
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
        }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#1a1a2e' }}>
            Nome del torneo
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Es: Roulette di Febbraio"
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '16px',
              border: '2px solid #E2E8F0',
              borderRadius: '12px',
              marginBottom: '20px'
            }}
          />

          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#1a1a2e' }}>
            Tipo di torneo
          </label>

          {/* Roulette */}
          <div
            onClick={() => setType('roulette')}
            style={{
              padding: '20px',
              background: type === 'roulette' ? '#F5F3FF' : '#F8FAFC',
              borderRadius: '16px',
              marginBottom: '12px',
              cursor: 'pointer',
              border: type === 'roulette' ? '2px solid #8B5CF6' : '2px solid transparent'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px' }}>🎲</span>
              <div>
                <p style={{ fontWeight: 700, fontSize: '16px', color: '#1a1a2e' }}>Roulette</p>
                <p style={{ fontSize: '13px', color: '#64748B' }}>Coppie generate automaticamente. Tutti giocano con tutti!</p>
              </div>
            </div>
          </div>

          {/* Classico */}
          <div
            onClick={() => setType('classic')}
            style={{
              padding: '20px',
              background: type === 'classic' ? '#FEF3C7' : '#F8FAFC',
              borderRadius: '16px',
              cursor: 'pointer',
              border: type === 'classic' ? '2px solid #F59E0B' : '2px solid transparent'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px' }}>🏆</span>
              <div>
                <p style={{ fontWeight: 700, fontSize: '16px', color: '#1a1a2e' }}>Classico</p>
                <p style={{ fontSize: '13px', color: '#64748B' }}>Coppie fisse. Tabellone eliminazione.</p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={saving || !name.trim()}
          style={{
            width: '100%',
            padding: '18px',
            background: !name.trim() ? '#E2E8F0' : 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
            color: !name.trim() ? '#94A3B8' : '#fff',
            border: 'none',
            borderRadius: '14px',
            fontSize: '17px',
            fontWeight: 700,
            cursor: !name.trim() ? 'not-allowed' : 'pointer',
            boxShadow: !name.trim() ? 'none' : '0 8px 32px rgba(139, 92, 246, 0.3)'
          }}
        >
          {saving ? 'Creazione...' : '🎲 Crea Torneo'}
        </button>
      </div>
    </div>
  );
}
