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
      background: '#FAFAF7',
      paddingBottom: '100px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #0E5E4A 0%, #0A4A3A 100%)',
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
          fontSize: '36px',
          fontWeight: 800,
          color: '#fff'
        }}>
          {profile?.full_name?.charAt(0).toUpperCase() || '?'}
        </div>
        <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 800 }}>
          {profile?.full_name || 'Utente'}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginTop: '4px' }}>
          {isCoach ? '👨‍🏫 Maestro' : '🎾 Giocatore'}
        </p>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* PLAYER CARD - CTA principale */}
        <Link href="/profile/player-card" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'linear-gradient(135deg, #111 0%, #1a1a1a 100%)',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              background: 'linear-gradient(135deg, #0E5E4A 0%, #16A34A 100%)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              🏆
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: '#fff', fontSize: '17px', fontWeight: 700 }}>La tua Player Card</p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>Stats, badge e titolo • Condividila!</p>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '20px' }}>→</span>
          </div>
        </Link>

        {/* Info */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '16px'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111', marginBottom: '16px' }}>
            👤 Informazioni
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F5F5F3' }}>
              <span style={{ color: '#666', fontSize: '14px' }}>Email</span>
              <span style={{ color: '#111', fontSize: '14px', fontWeight: 500 }}>{user.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F5F5F3' }}>
              <span style={{ color: '#666', fontSize: '14px' }}>Ruolo</span>
              <span style={{
                background: isCoach ? '#E0F2FE' : '#E8F5E9',
                color: isCoach ? '#0369A1' : '#0E5E4A',
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
                <span style={{ color: '#666', fontSize: '14px' }}>Codice Coach</span>
                <span style={{
                  background: '#F5F5F3',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color: '#0E5E4A',
                  letterSpacing: '2px'
                }}>
                  {profile.coach_code}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Menu */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '16px'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111', marginBottom: '16px' }}>
            ⚙️ Impostazioni
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Link href="/companions" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: '#F5F5F3', borderRadius: '14px' }}>
                <span style={{ fontSize: '20px' }}>👥</span>
                <span style={{ flex: 1, fontSize: '15px', fontWeight: 600, color: '#111' }}>I Miei Compagni</span>
                <span style={{ color: '#CCC' }}>›</span>
              </div>
            </Link>
            <Link href="/goals" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: '#F5F5F3', borderRadius: '14px' }}>
                <span style={{ fontSize: '20px' }}>🎯</span>
                <span style={{ flex: 1, fontSize: '15px', fontWeight: 600, color: '#111' }}>Obiettivi Stagione</span>
                <span style={{ color: '#CCC' }}>›</span>
              </div>
            </Link>
            <Link href="/errors" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: '#F5F5F3', borderRadius: '14px' }}>
                <span style={{ fontSize: '20px' }}>⚠️</span>
                <span style={{ flex: 1, fontSize: '15px', fontWeight: 600, color: '#111' }}>Errori Ricorrenti</span>
                <span style={{ color: '#CCC' }}>›</span>
              </div>
            </Link>
            <Link href="/connections" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: '#F5F5F3', borderRadius: '14px' }}>
                <span style={{ fontSize: '20px' }}>🔗</span>
                <span style={{ flex: 1, fontSize: '15px', fontWeight: 600, color: '#111' }}>Connessioni Maestro</span>
                <span style={{ color: '#CCC' }}>›</span>
              </div>
            </Link>
          </div>
        </div>

        <LogoutButton />
      </div>
    </div>
  );
}
