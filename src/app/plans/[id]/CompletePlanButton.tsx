'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Props {
  planId: string;
  isStudent: boolean;
  currentStatus: string;
}

export default function CompletePlanButton({ planId, isStudent, currentStatus }: Props) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const supabase = createClient();
  const router = useRouter();

  if (!isStudent) return null;

  const toggleStatus = async () => {
    setLoading(true);
    
    const newStatus = status === 'active' ? 'completed' : 'active';
    
    const { error } = await supabase
      .from('training_plans')
      .update({ status: newStatus })
      .eq('id', planId);

    if (!error) {
      setStatus(newStatus);
      router.refresh();
    } else {
      alert('Errore: ' + error.message);
    }
    
    setLoading(false);
  };

  return (
    <div style={{ marginTop: '16px' }}>
      {status === 'active' ? (
        <button
          onClick={toggleStatus}
          disabled={loading}
          style={{
            width: '100%',
            padding: '16px',
            background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '14px',
            fontSize: '16px',
            fontWeight: 700,
            cursor: 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Salvataggio...' : '✅ Segna come Completato'}
        </button>
      ) : (
        <div>
          <div style={{
            background: '#DCFCE7',
            borderRadius: '14px',
            padding: '16px',
            textAlign: 'center',
            marginBottom: '12px'
          }}>
            <p style={{ color: '#16A34A', fontSize: '16px', fontWeight: 700 }}>
              🎉 Piano Completato!
            </p>
          </div>
          <button
            onClick={toggleStatus}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: '#F5F5F3',
              color: '#666',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {loading ? '...' : '↩️ Riattiva piano'}
          </button>
        </div>
      )}
    </div>
  );
}
