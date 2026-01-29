import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import RoleSwitcher from './RoleSwitcher';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const canCoach = profile?.can_coach || profile?.role === 'coach';
  const activeRole = profile?.active_role || profile?.role || 'student';
  const isCoachMode = activeRole === 'coach';
  const firstName = profile?.full_name?.split(' ')[0] || 'Campione';

  const { count: schedeCount } = await supabase
    .from('training_cards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const { data: lastTraining } = await supabase
    .from('training_cards')
    .select('training_date')
    .eq('user_id', user.id)
    .order('training_date', { ascending: false })
    .limit(1)
    .single();

  const daysSinceLastTraining = lastTraining?.training_date
    ? Math.floor((Date.now() - new Date(lastTraining.training_date).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Stats per coach
  let studentsCount = 0;
  let activePlansCount = 0;
  let videosCount = 0;
  
  if (isCoachMode) {
    const { count: students } = await supabase
      .from('coach_student_connections')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', user.id)
      .eq('status', 'accepted');
    studentsCount = students || 0;

    const { count: plans } = await supabase
      .from('training_plans')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', user.id)
      .eq('status', 'active');
    activePlansCount = plans || 0;

    const { count: videos } = await supabase
      .from('coach_videos')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', user.id);
    videosCount = videos || 0;
  }

  const colors = isCoachMode 
    ? { gradient: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)', primary: '#22C55E', shadow: 'rgba(34, 197, 94, 0.3)' }
    : { gradient: 'linear-gradient(135deg, #0066FF 0%, #00D4AA 100%)', primary: '#0066FF', shadow: 'rgba(0, 102, 255, 0.3)' };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
      paddingBottom: '100px'
    }}>
      {/* Header */}
      <div style={{
        background: colors.gradient,
        padding: '48px 24px 32px',
        borderRadius: '0 0 32px 32px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-40px', left: '20%', width: '80px', height: '80px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
        
        {canCoach && <RoleSwitcher currentRole={activeRole} />}
        
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', fontWeight: 500, marginBottom: '4px', marginTop: canCoach ? '16px' : '0' }}>
          {isCoachMode ? '👨‍🏫 Area Maestro' : 'Bentornato'}
        </p>
        <h1 style={{ color: '#fff', fontSize: '32px', fontWeight: 800, letterSpacing: '-0.5px' }}>
          {firstName} {isCoachMode ? '🎾' : '👋'}
        </h1>
      </div>

      <div style={{ padding: '0 20px', marginTop: '-20px' }}>
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {isCoachMode ? (
            <>
              <StatCard value={studentsCount} label="Allievi" color={colors.primary} />
              <StatCard value={activePlansCount} label="Piani Attivi" color="#3B82F6" />
              <StatCard value={videosCount} label="Video" color="#8B5CF6" />
            </>
          ) : (
            <>
              <StatCard value={schedeCount || 0} label="Schede" color={colors.primary} />
              <StatCard value={0} label="Streak 🔥" color="#FF6B35" />
              <StatCard value={daysSinceLastTraining !== null ? daysSinceLastTraining : '—'} label="Giorni fa" color="#14B8A6" />
            </>
          )}
        </div>

        {/* Quick Action */}
        {isCoachMode ? (
          <Link href="/plans/new" style={{ textDecoration: 'none' }}>
            <div style={{
              background: colors.gradient,
              borderRadius: '20px',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '24px',
              boxShadow: `0 8px 32px ${colors.shadow}`,
              cursor: 'pointer'
            }}>
              <div style={{ width: '52px', height: '52px', background: 'rgba(255,255,255,0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                📋
              </div>
              <div>
                <p style={{ color: '#fff', fontSize: '18px', fontWeight: 700 }}>Nuovo Piano</p>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 500 }}>Crea e invia ai tuoi allievi</p>
              </div>
              <div style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.6)', fontSize: '20px' }}>→</div>
            </div>
          </Link>
        ) : (
          <Link href="/training/new" style={{ textDecoration: 'none' }}>
            <div style={{
              background: colors.gradient,
              borderRadius: '20px',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '24px',
              boxShadow: `0 8px 32px ${colors.shadow}`,
              cursor: 'pointer'
            }}>
              <div style={{ width: '52px', height: '52px', background: 'rgba(255,255,255,0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                ✍️
              </div>
              <div>
                <p style={{ color: '#fff', fontSize: '18px', fontWeight: 700 }}>Nuova Scheda</p>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 500 }}>Registra il tuo allenamento</p>
              </div>
              <div style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.6)', fontSize: '20px' }}>→</div>
            </div>
          </Link>
        )}

        {/* Menu */}
        {isCoachMode ? (
          <>
            {/* Gestione */}
            <SectionCard title="Gestione" icon="📊" color={colors.primary}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <MenuRow href="/connections" icon="👥" title="I miei Allievi" subtitle="Gestisci e monitora" />
                <MenuRow href="/plans" icon="📋" title="Piani Inviati" subtitle="Vedi tutti i piani" />
                <MenuRow href="/evaluations" icon="⭐" title="Valutazioni" subtitle="Valuta i progressi" />
              </div>
            </SectionCard>

            {/* Strumenti Coach */}
            <SectionCard title="Strumenti Coach" icon="🛠️" color={colors.primary}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <MenuRow href="/templates" icon="📝" title="Template Piani" subtitle="Crea piani riutilizzabili" />
                <MenuRow href="/videos" icon="📹" title="La mia Videoteca" subtitle="Organizza video YouTube" />
                <MenuRow href="/calendar" icon="📅" title="Calendario Lezioni" subtitle="Pianifica la settimana" />
              </div>
            </SectionCard>
          </>
        ) : (
          <>
            <SectionCard title="Accesso Rapido" icon="⚡" color={colors.primary}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <QuickAccessTile href="/training" icon="📝" label="Le mie Schede" />
                <QuickAccessTile href="/calendar" icon="📅" label="Calendario" />
                <QuickAccessTile href="/stats" icon="📊" label="Statistiche" />
                <QuickAccessTile href="/leagues" icon="🏆" label="Leghe" />
              </div>
            </SectionCard>

            <SectionCard title="Il mio Percorso" icon="🎯" color={colors.primary}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <MenuRow href="/plans" icon="📋" title="Piani Allenamento" subtitle="I tuoi programmi" />
                <MenuRow href="/evaluations" icon="📊" title="Valutazioni" subtitle="I tuoi progressi" />
                <MenuRow href="/connections" icon="🔗" title="Il mio Maestro" subtitle="Connessioni" />
              </div>
            </SectionCard>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ value, label, color }: { value: number | string; label: string; color: string }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '20px',
      padding: '20px 16px',
      textAlign: 'center',
      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      border: '1px solid rgba(0,0,0,0.04)'
    }}>
      <p style={{ fontSize: '28px', fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '8px' }}>{label}</p>
    </div>
  );
}

function SectionCard({ title, icon, color, children }: { title: string; icon: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '24px',
      padding: '24px',
      marginBottom: '16px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      border: '1px solid rgba(0,0,0,0.04)'
    }}>
      <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#1a1a2e', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>{icon}</span> {title}
      </h2>
      {children}
    </div>
  );
}

function QuickAccessTile({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        background: '#F8FAFC',
        borderRadius: '16px',
        padding: '20px 16px',
        textAlign: 'center',
        cursor: 'pointer',
        border: '1px solid transparent'
      }}>
        <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>{icon}</span>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a2e' }}>{label}</span>
      </div>
    </Link>
  );
}

function MenuRow({ href, icon, title, subtitle }: { href: string; icon: string; title: string; subtitle: string }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '14px 16px',
        background: '#F8FAFC',
        borderRadius: '14px',
        cursor: 'pointer'
      }}>
        <span style={{ fontSize: '22px' }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a2e' }}>{title}</p>
          <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>{subtitle}</p>
        </div>
        <span style={{ color: '#CBD5E1', fontSize: '18px' }}>›</span>
      </div>
    </Link>
  );
}
