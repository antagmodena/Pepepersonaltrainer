import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function TrainingListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const { data: cards } = await supabase
    .from('training_cards')
    .select('*')
    .eq('user_id', user.id)
    .order('training_date', { ascending: false });

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
      paddingBottom: '100px'
    }}>
      {/* Header */}
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
          📝 Le mie Schede
        </h1>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* New Card Button */}
        <Link href="/training/new" style={{ textDecoration: 'none' }}>
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
            <span style={{ fontSize: '20px' }}>✍️</span>
            <span style={{ color: '#fff', fontSize: '16px', fontWeight: 700 }}>Nuova Scheda</span>
          </div>
        </Link>

        {/* Cards List */}
        <div style={{
          background: '#fff',
          borderRadius: '24px',
          padding: '20px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          border: '1px solid rgba(0,0,0,0.04)'
        }}>
          {!cards || cards.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>📋</span>
              <p style={{ color: '#94A3B8', fontSize: '15px' }}>Nessuna scheda ancora.</p>
              <p style={{ color: '#94A3B8', fontSize: '14px' }}>Crea la tua prima scheda!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cards.map(card => (
                <Link key={card.id} href={`/training/${card.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    padding: '16px',
                    background: '#F8FAFC',
                    borderRadius: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s'
                  }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a2e', marginBottom: '4px' }}>
                        {card.session_type === 'training' ? '🏋️ Allenamento' : '🎮 Partita'}
                      </div>
                      <div style={{ fontSize: '13px', color: '#94A3B8' }}>
                        {new Date(card.training_date).toLocaleDateString('it-IT', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long'
                        })}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {card.coach_feedback && (
                        <span style={{
                          background: '#DCFCE7',
                          color: '#16A34A',
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '4px 10px',
                          borderRadius: '20px'
                        }}>
                          👨‍🏫 Feedback
                        </span>
                      )}
                      <span style={{ color: '#CBD5E1', fontSize: '18px' }}>›</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
