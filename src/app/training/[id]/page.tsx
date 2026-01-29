import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import DeleteCardButton from './DeleteCardButton';

export default async function TrainingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const { data: card } = await supabase
    .from('training_cards')
    .select('*')
    .eq('id', id)
    .single();

  if (!card) {
    redirect('/training');
  }

  // Verifica che l'utente sia il proprietario della scheda
  const isOwner = card.user_id === user.id;

  const Section = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => (
    <div style={{
      background: '#fff',
      borderRadius: '20px',
      padding: '20px',
      marginBottom: '16px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      border: '1px solid rgba(0,0,0,0.04)'
    }}>
      <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>{icon}</span> {title}
      </h2>
      {children}
    </div>
  );

  const CheckItem = ({ checked, label }: { checked: boolean; label: string }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 14px',
      background: checked ? '#DCFCE7' : '#F8FAFC',
      borderRadius: '10px',
      marginBottom: '8px'
    }}>
      <span style={{ fontSize: '16px' }}>{checked ? '✅' : '⬜'}</span>
      <span style={{ fontSize: '14px', color: checked ? '#16A34A' : '#94A3B8' }}>{label}</span>
    </div>
  );

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
        <Link href="/training" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
          ← Le mie Schede
        </Link>
        <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>
          {card.session_type === 'training' ? '🏋️ Allenamento' : '🎮 Partita'}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginTop: '4px' }}>
          {new Date(card.training_date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div style={{ padding: '0 20px' }}>
        <Section title="Informazioni" icon="📋">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ color: '#64748B', fontSize: '14px' }}>Tipo</span>
              <span style={{ fontWeight: 600, color: '#1a1a2e' }}>{card.session_type === 'training' ? '🏋️ Allenamento' : '🎮 Partita'}</span>
            </div>
            {card.partners && card.partners.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B', fontSize: '14px' }}>Compagni</span>
                <span style={{ fontWeight: 600, color: '#1a1a2e' }}>{card.partners.join(', ')}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
              <span style={{ color: '#64748B', fontSize: '14px' }}>Maestro presente</span>
              <span style={{ fontWeight: 600, color: card.coach_present ? '#16A34A' : '#94A3B8' }}>{card.coach_present ? '✅ Sì' : '❌ No'}</span>
            </div>
          </div>
        </Section>

        {card.objective && (
          <Section title="Obiettivo" icon="🎯">
            <p style={{ color: '#1a1a2e', fontSize: '15px', lineHeight: 1.6 }}>{card.objective}</p>
          </Section>
        )}

        <Section title="Cose fatte bene" icon="✅">
          <CheckItem checked={card.done_well_intensity} label="Intensità" />
          <CheckItem checked={card.done_well_concentration} label="Concentrazione" />
          <CheckItem checked={card.done_well_attitude} label="Attitudine" />
          {card.done_well_other && (
            <div style={{ padding: '10px 14px', background: '#DCFCE7', borderRadius: '10px', marginTop: '8px' }}>
              <span style={{ fontSize: '14px', color: '#16A34A' }}>➕ {card.done_well_other}</span>
            </div>
          )}
        </Section>

        <Section title="Aspetti da migliorare" icon="⚠️">
          <CheckItem checked={card.improve_position} label="Posizione in campo" />
          <CheckItem checked={card.improve_decision_making} label="Presa di decisioni" />
          <CheckItem checked={card.improve_partner_communication} label="Comunicazione col compagno" />
          <CheckItem checked={card.improve_error_management} label="Gestione degli errori" />
          {card.improve_other && (
            <div style={{ padding: '10px 14px', background: '#FEF3C7', borderRadius: '10px', marginTop: '8px' }}>
              <span style={{ fontSize: '14px', color: '#D97706' }}>➕ {card.improve_other}</span>
            </div>
          )}
        </Section>

        {card.personal_notes && (
          <Section title="Note personali" icon="📝">
            <p style={{ color: '#1a1a2e', fontSize: '15px', lineHeight: 1.6 }}>{card.personal_notes}</p>
          </Section>
        )}

        {card.student_feedback && (
          <Section title="Il mio feedback" icon="💬">
            <p style={{ color: '#1a1a2e', fontSize: '15px', lineHeight: 1.6 }}>{card.student_feedback}</p>
          </Section>
        )}

        {card.coach_feedback && (
          <Section title="Feedback del Maestro" icon="👨‍🏫">
            <div style={{ background: '#EFF6FF', borderRadius: '12px', padding: '16px', border: '1px solid #BFDBFE' }}>
              <p style={{ color: '#1E40AF', fontSize: '15px', lineHeight: 1.6 }}>{card.coach_feedback}</p>
            </div>
          </Section>
        )}

        {/* Pulsante Elimina (solo proprietario) */}
        {isOwner && <DeleteCardButton cardId={card.id} />}
      </div>
    </div>
  );
}
