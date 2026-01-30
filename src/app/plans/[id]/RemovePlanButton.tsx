'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Props {
  planId: string;
  isStudent: boolean;
  coachName: string;
}

export default function RemovePlanButton({ planId, isStudent, coachName }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  if (!isStudent) return null;

  const handleRemove = async () => {
    setLoading(true);
    
    const { error } = await supabase
      .from('training_plans')
      .delete()
      .eq('id', planId);

    if (!error) {
      router.push('/plans');
    } else {
      alert('Errore: ' + error.message);
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        style={{
          width: '100%',
          marginTop: '12px',
          padding: '14px',
          background: '#FEE2E2',
          color: '#DC2626',
          border: 'none',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer'
        }}
      >
        🗑️ Rimuovi questo piano
      </button>

      {showConfirm && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '24px',
            maxWidth: '340px',
            width: '100%'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: '#111' }}>
              Rimuovi piano?
            </h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
              Vuoi rimuovere questo piano assegnato da <strong>{coachName}</strong>? Il coach potrà assegnartene un altro se necessario.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#F5F5F3',
                  color: '#666',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Annulla
              </button>
              <button
                onClick={handleRemove}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#DC2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Rimuovo...' : 'Rimuovi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
