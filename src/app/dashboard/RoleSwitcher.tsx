'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function RoleSwitcher({ currentRole }: { currentRole: string }) {
  const [switching, setSwitching] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const isCoach = currentRole === 'coach';

  const handleSwitch = async () => {
    setSwitching(true);
    const newRole = isCoach ? 'student' : 'coach';
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('profiles')
      .update({ active_role: newRole })
      .eq('id', user.id);

    router.refresh();
    setSwitching(false);
  };

  return (
    <button
      onClick={handleSwitch}
      disabled={switching}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(255,255,255,0.2)',
        border: 'none',
        borderRadius: '30px',
        padding: '8px 16px',
        cursor: switching ? 'not-allowed' : 'pointer',
        opacity: switching ? 0.7 : 1,
        transition: 'all 0.2s'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        <span style={{
          width: '28px',
          height: '28px',
          background: isCoach ? '#22C55E' : '#0066FF',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          transition: 'all 0.3s'
        }}>
          {isCoach ? '👨‍🏫' : '🎾'}
        </span>
        <span style={{
          color: '#fff',
          fontSize: '13px',
          fontWeight: 600
        }}>
          {isCoach ? 'Coach' : 'Allievo'}
        </span>
      </div>
      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
        → {isCoach ? '🎾' : '👨‍🏫'}
      </span>
    </button>
  );
}
