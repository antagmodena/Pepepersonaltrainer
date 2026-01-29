import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import LogoutButton from './LogoutButton';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const isCoach = profile?.role === 'coach';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
      paddingBottom: '100px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #0066FF 0%, #00D4AA 100%)',
        padding: '48px 24px 32px',
        borderRadius: '0 0 32px 32px',
        marginBottom: '24px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '50%',
          margin: '0 auto 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '36px'
        }}>
          {isCoach ? '👨‍🏫' : '🎾'}
        </div>
        <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 800 }}>
          {profile?.full_name || 'Utente'}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginTop: '4px' }}>
          {isCoach ? 'Maestro' : 'Giocatore'}
        </p>
      </div>

      <div style={{ padding: '0 20px' }}>
        <div style={{
          background: '#fff',
          borderRadius: '24px',
          padding: '24px',
          marginBottom: '16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          border: '1px solid rgba(0,0,0,0.04)'
        }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#1a1a2e', marginBottom: '20px' }}>
            👤 Informazioni
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ color: '#64748B', fontSize: '14px' }}>Email</span>
              <span style={{ color: '#1a1a2e', fontSize: '14px', fontWeight: 500 }}>{user.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ color: '#64748B', fontSize: '14px' }}>Ruolo</span>
              <span style={{
                background: isCoach ? '#DBEAFE' : '#DCFCE7',
                color: isCoach ? '#2563EB' : '#16A34A',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 600
              }}>
                {isCoach ? '👨‍🏫 Maestro' : '🎾 Giocatore'}
              </span>
            </div>
            {isCoach && profile?.coach_code && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
                <span style={{ color: '#64748B', fontSize: '14px' }}>Codice Coach</span>
                <span style={{
                  background: '#F1F5F9',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontWeight: 700
                }}>
                  {profile.coach_code}
                </span>
              </div>
            )}
          </div>
        </div>

        <div style={{
          background: '#fff',
          borderRadius: '24px',
          padding: '24px',
          marginBottom: '16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
        }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#1a1a2e', marginBottom: '16px' }}>
            ⚙️ Impostazioni
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Link href="/goals" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: '#F8FAFC', borderRadius: '14px' }}>
                <span style={{ fontSize: '22px' }}>🎯</span>
                <span style={{ flex: 1, fontSize: '15px', fontWeight: 600, color: '#1a1a2e' }}>Obiettivi Stagione</span>
                <span style={{ color: '#CBD5E1' }}>›</span>
              </div>
            </Link>
            <Link href="/errors" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: '#F8FAFC', borderRadius: '14px' }}>
                <span style={{ fontSize: '22px' }}>⚠️</span>
                <span style={{ flex: 1, fontSize: '15px', fontWeight: 600, color: '#1a1a2e' }}>Errori Ricorrenti</span>
                <span style={{ color: '#CBD5E1' }}>›</span>
              </div>
            </Link>
            <Link href="/connections" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: '#F8FAFC', borderRadius: '14px' }}>
                <span style={{ fontSize: '22px' }}>🔗</span>
                <span style={{ flex: 1, fontSize: '15px', fontWeight: 600, color: '#1a1a2e' }}>Connessioni</span>
                <span style={{ color: '#CBD5E1' }}>›</span>
              </div>
            </Link>
          </div>
        </div>

        <LogoutButton />
      </div>
    </div>
  );
}
