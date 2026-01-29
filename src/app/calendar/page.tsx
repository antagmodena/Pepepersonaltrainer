import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import CalendarView from './CalendarView';

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const { data: trainingCards } = await supabase
    .from('training_cards')
    .select('id, training_date, session_type, coach_feedback')
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
          📅 Calendario
        </h1>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Quick Action */}
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

        {/* Calendar */}
        <div style={{
          background: '#fff',
          borderRadius: '24px',
          padding: '20px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          border: '1px solid rgba(0,0,0,0.04)',
          marginBottom: '16px'
        }}>
          <CalendarView trainingCards={trainingCards || []} />
        </div>

        <p style={{
          textAlign: 'center',
          fontSize: '13px',
          color: '#94A3B8',
          marginTop: '12px'
        }}>
          👆 Clicca su un giorno per vedere o creare una scheda
        </p>
      </div>
    </div>
  );
}
