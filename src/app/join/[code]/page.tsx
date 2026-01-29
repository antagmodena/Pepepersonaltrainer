import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import JoinButton from './JoinButton';

export default async function JoinLeaguePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();
  
  // Trova la lega
  const { data: league } = await supabase
    .from('leagues')
    .select('*, creator:profiles!leagues_created_by_fkey(full_name)')
    .eq('code', code.toUpperCase())
    .single();

  if (!league) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: '#fff',
          borderRadius: '24px',
          padding: '40px 24px',
          textAlign: 'center',
          maxWidth: '360px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
        }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>😕</span>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a2e', marginBottom: '8px' }}>
            Lega non trovata
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px' }}>
            Il link potrebbe essere scaduto o errato
          </p>
          <Link href="/" style={{
            display: 'inline-block',
            padding: '14px 32px',
            background: '#0066FF',
            color: '#fff',
            borderRadius: '12px',
            fontWeight: 600,
            textDecoration: 'none'
          }}>
            Vai alla Home
          </Link>
        </div>
      </div>
    );
  }

  // Conta membri
  const { count: memberCount } = await supabase
    .from('league_members')
    .select('*', { count: 'exact', head: true })
    .eq('league_id', league.id);

  // Controlla se utente loggato
  const { data: { user } } = await supabase.auth.getUser();

  // Se loggato, controlla se già membro
  let alreadyMember = false;
  if (user) {
    const { data: membership } = await supabase
      .from('league_members')
      .select('id')
      .eq('league_id', league.id)
      .eq('user_id', user.id)
      .single();
    alreadyMember = !!membership;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '24px',
        padding: '32px 24px',
        textAlign: 'center',
        maxWidth: '360px',
        width: '100%',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
      }}>
        {/* Logo/Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: '40px'
        }}>
          🎾
        </div>

        {/* Invito */}
        <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '4px' }}>
          Sei stato invitato a
        </p>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1a1a2e', marginBottom: '8px' }}>
          {league.name}
        </h1>
        
        {/* Info */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <span style={{ fontSize: '13px', color: '#64748B' }}>
            👥 {memberCount} giocatori
          </span>
          {league.creator?.full_name && (
            <span style={{ fontSize: '13px', color: '#64748B' }}>
              👤 {league.creator.full_name}
            </span>
          )}
        </div>

        {/* Action */}
        {alreadyMember ? (
          <>
            <div style={{
              background: '#DCFCE7',
              padding: '12px',
              borderRadius: '12px',
              marginBottom: '16px'
            }}>
              <p style={{ color: '#16A34A', fontWeight: 600, fontSize: '14px' }}>
                ✅ Sei già in questa lega!
              </p>
            </div>
            <Link href={`/leagues/${league.id}`} style={{
              display: 'block',
              padding: '16px',
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: '#fff',
              borderRadius: '14px',
              fontWeight: 700,
              fontSize: '16px',
              textDecoration: 'none'
            }}>
              Vai alla Lega →
            </Link>
          </>
        ) : user ? (
          <JoinButton leagueId={league.id} userId={user.id} />
        ) : (
          <>
            <Link href={`/login?redirect=/join/${code}`} style={{
              display: 'block',
              padding: '16px',
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: '#fff',
              borderRadius: '14px',
              fontWeight: 700,
              fontSize: '16px',
              textDecoration: 'none',
              marginBottom: '12px'
            }}>
              Accedi e Unisciti
            </Link>
            <Link href={`/register?redirect=/join/${code}`} style={{
              display: 'block',
              padding: '16px',
              background: '#F1F5F9',
              color: '#64748B',
              borderRadius: '14px',
              fontWeight: 600,
              fontSize: '15px',
              textDecoration: 'none'
            }}>
              Non hai un account? Registrati
            </Link>
          </>
        )}

        {/* Footer */}
        <p style={{ marginTop: '24px', fontSize: '12px', color: '#94A3B8' }}>
          🎾 MyPadelog
        </p>
      </div>
    </div>
  );
}
