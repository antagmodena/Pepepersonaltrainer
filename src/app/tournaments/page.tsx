import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function TournamentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

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
        marginBottom: '24px'
      }}>
        <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
          ← Dashboard
        </Link>
        <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>
          🏆 I miei Tornei
        </h1>
      </div>

      <div style={{ padding: '0 20px' }}>
        <Link href="/tournaments/new" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'linear-gradient(135deg, #0066FF 0%, #0052CC 100%)',
            borderRadius: '16px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '20px',
            boxShadow: '0 8px 32px rgba(0, 102, 255, 0.3)'
          }}>
            <span style={{ fontSize: '20px' }}>➕</span>
            <span style={{ color: '#fff', fontSize: '16px', fontWeight: 700 }}>Aggiungi Torneo</span>
          </div>
        </Link>

        <div style={{
          background: '#fff',
          borderRadius: '24px',
          padding: '20px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          border: '1px solid rgba(0,0,0,0.04)'
        }}>
          {!tournaments || tournaments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>🏆</span>
              <p style={{ color: '#94A3B8', fontSize: '15px' }}>Nessun torneo registrato</p>
              <p style={{ color: '#94A3B8', fontSize: '14px' }}>Aggiungi il tuo primo torneo!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {tournaments.map(tournament => (
                <div key={tournament.id} style={{
                  padding: '16px',
                  background: '#F8FAFC',
                  borderRadius: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e' }}>{tournament.name}</h3>
                    {tournament.result && (
                      <span style={{
                        background: tournament.result.includes('1') ? '#FEF3C7' : '#F1F5F9',
                        color: tournament.result.includes('1') ? '#D97706' : '#64748B',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600
                      }}>
                        {tournament.result.includes('1') ? '🥇' : '🎾'} {tournament.result}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#64748B' }}>
                    <span>📅 {new Date(tournament.date).toLocaleDateString('it-IT')}</span>
                    {tournament.location && <span>📍 {tournament.location}</span>}
                  </div>
                  {tournament.partner && (
                    <div style={{ marginTop: '8px', fontSize: '13px', color: '#64748B' }}>
                      👥 Partner: {tournament.partner}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
