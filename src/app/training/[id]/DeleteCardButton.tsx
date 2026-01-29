'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function DeleteCardButton({ cardId }: { cardId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase
      .from('training_cards')
      .delete()
      .eq('id', cardId);

    if (!error) {
      router.push('/training');
      router.refresh();
    } else {
      alert('Errore: ' + error.message);
      setDeleting(false);
      setConfirming(false);
    }
  };

  if (confirming) {
    return (
      <div style={{
        background: '#FEF2F2',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '16px',
        border: '1px solid #FECACA'
      }}>
        <p style={{ color: '#DC2626', fontWeight: 600, marginBottom: '12px', textAlign: 'center' }}>
          ⚠️ Sei sicuro di voler eliminare questa scheda?
        </p>
        <p style={{ color: '#64748B', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
          Questa azione non può essere annullata.
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setConfirming(false)}
            style={{
              flex: 1,
              padding: '12px',
              background: '#fff',
              color: '#64748B',
              border: '2px solid #E2E8F0',
              borderRadius: '10px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Annulla
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              flex: 1,
              padding: '12px',
              background: '#DC2626',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 600,
              cursor: deleting ? 'not-allowed' : 'pointer',
              opacity: deleting ? 0.7 : 1
            }}
          >
            {deleting ? 'Eliminazione...' : '🗑️ Elimina'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      style={{
        width: '100%',
        padding: '14px',
        background: '#FEF2F2',
        color: '#DC2626',
        border: 'none',
        borderRadius: '14px',
        fontSize: '15px',
        fontWeight: 600,
        cursor: 'pointer',
        marginBottom: '16px'
      }}
    >
      🗑️ Elimina Scheda
    </button>
  );
}
