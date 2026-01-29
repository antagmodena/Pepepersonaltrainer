'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewLeaguePage() {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Crea la lega
    const { data: league, error } = await supabase
      .from('leagues')
      .insert({ name, created_by: user.id })
      .select()
      .single();

    if (error || !league) {
      alert('Errore: ' + error?.message);
      setSaving(false);
      return;
    }

    // Aggiungi il creatore come membro
    await supabase.from('league_members').insert({
      league_id: league.id,
      user_id: user.id
    });

    router.push(`/leagues/${league.id}`);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
      paddingBottom: '100px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
        padding: '48px 24px 32px',
        borderRadius: '0 0 32px 32px',
        marginBottom: '24px'
      }}>
        <Link href="/leagues" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
          ← Annulla
        </Link>
        <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>
          ➕ Crea Lega
        </h1>
      </div>

      <div style={{ padding: '0 20px' }}>
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
        }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#1a1a2e' }}>
            Nome della Lega
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Es: I Pazzi del Giovedì"
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '16px',
              border: '2px solid #E2E8F0',
              borderRadius: '12px',
              marginBottom: '20px'
            }}
          />

          <div style={{
            background: '#FEF3C7',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <p style={{ fontSize: '14px', color: '#92400E' }}>
              💡 Dopo la creazione riceverai un <strong>codice</strong> da condividere con gli amici!
            </p>
          </div>

          <button
            onClick={handleCreate}
            disabled={saving || !name.trim()}
            style={{
              width: '100%',
              padding: '16px',
              background: !name.trim() ? '#E2E8F0' : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: !name.trim() ? '#94A3B8' : '#fff',
              border: 'none',
              borderRadius: '14px',
              fontSize: '16px',
              fontWeight: 700,
              cursor: !name.trim() ? 'not-allowed' : 'pointer',
              boxShadow: !name.trim() ? 'none' : '0 8px 32px rgba(245, 158, 11, 0.3)'
            }}
          >
            {saving ? 'Creazione...' : '🏆 Crea Lega'}
          </button>
        </div>
      </div>
    </div>
  );
}
