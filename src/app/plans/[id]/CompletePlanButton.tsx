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
  const supabase = createClient();
  const router = useRouter();

  if (!isStudent || currentStatus === 'completed') return null;

  const handleComplete = async () => {
    setLoading(true);
    
    const { error } = await supabase
      .from('training_plans')
      .update({ status: 'completed' })
      .eq('id', planId);

    if (!error) {
      router.refresh(); // Invalida la cache
    } else {
      alert('Errore: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleComplete}
      disabled={loading}
      style={{
        width: '100%',
        marginTop: '16px',
        padding: '18px',
        background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
        color: '#fff',
        border: 'none',
        borderRadius: '14px',
        fontSize: '17px',
        fontWeight: 700,
        cursor: 'pointer',
        opacity: loading ? 0.6 : 1
      }}
    >
      {loading ? 'Salvataggio...' : '✅ Segna come Completato'}
    </button>
  );
}
