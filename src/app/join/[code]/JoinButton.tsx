'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function JoinButton({ leagueId, userId }: { leagueId: string; userId: string }) {
  const [joining, setJoining] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleJoin = async () => {
    setJoining(true);
    
    const { error } = await supabase.from('league_members').insert({
      league_id: leagueId,
      user_id: userId
    });

    if (error) {
      alert('Errore: ' + error.message);
      setJoining(false);
      return;
    }

    router.push(`/leagues/${leagueId}`);
  };

  return (
    <button
      onClick={handleJoin}
      disabled={joining}
      style={{
        width: '100%',
        padding: '16px',
        background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
        color: '#fff',
        border: 'none',
        borderRadius: '14px',
        fontWeight: 700,
        fontSize: '16px',
        cursor: joining ? 'wait' : 'pointer',
        boxShadow: '0 8px 32px rgba(34, 197, 94, 0.3)'
      }}
    >
      {joining ? 'Entro...' : '🎾 Unisciti alla Lega'}
    </button>
  );
}
