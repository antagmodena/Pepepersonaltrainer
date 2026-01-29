'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <button onClick={handleLogout} style={{
      width: '100%',
      padding: '16px',
      background: '#FEF2F2',
      color: '#DC2626',
      border: 'none',
      borderRadius: '14px',
      fontSize: '16px',
      fontWeight: 600,
      cursor: 'pointer'
    }}>
      🚪 Esci
    </button>
  );
}
