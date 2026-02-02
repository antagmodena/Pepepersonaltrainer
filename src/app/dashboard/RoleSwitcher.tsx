'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function RoleSwitcher({ currentRole }: { currentRole: string }) {
  const [switching, setSwitching] = useState(false);
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

    // Full page reload to sync BottomNav + Dashboard
    window.location.href = '/dashboard';
  };

  return (
    <button
      onClick={handleSwitch}
      disabled={switching}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '30px',
        padding: '8px 14px',
        cursor: switching ? 'not-allowed' : 'pointer',
        opacity: switching ? 0.6 : 1,
        transition: 'all 0.2s'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{
          width: '26px', height: '26px',
          background: 'rgba(255,255,255,0.25)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px'
        }}>
          {isCoach ? '👨‍🏫' : '🎾'}
        </span>
        <span style={{ color: '#fff', fontSize: '12px', fontWeight: 600 }}>
          {switching ? '...' : (isCoach ? 'Coach' : 'Giocatore')}
        </span>
      </div>
      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
        → {isCoach ? '🎾' : '👨‍🏫'}
      </span>
    </button>
  );
}
