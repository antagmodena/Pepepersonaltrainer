'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Colori - BLU DOMINANTE
const colors = {
  bluePadel: '#1A8CD8',
  blueLight: '#E8F4FC',
  blueMuted: '#5BA4D9',
  white: '#FFFFFF',
  background: '#F5F5F3',
  black: '#111111',
  gray: '#666666',
  lightGray: '#E5E5E5',
  orange: '#F46A25',
  red: '#EF4444',
};

interface Props {
  firstName: string;
  userLeagues: any[];
  nextEvent: any;
  isEventToday: boolean;
  isEventTomorrow: boolean;
  pastEventToday: any;
  matchToday: any;
  newPlan: any;
  currentStreak: number;
  thisWeekMatches: number;
  thisWeekWins: number;
  primaryLeagueId: string | null;
}

// Bottone con feedback
function ActionButton({
  children,
  href,
  onClick,
  variant = 'primary',
  size = 'large',
  icon,
  fullWidth = true
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'large' | 'medium' | 'small';
  icon?: string;
  fullWidth?: boolean;
}) {
  const baseStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all 80ms ease-out',
    width: fullWidth ? '100%' : 'auto',
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    large: { height: '56px', fontSize: '17px', borderRadius: '14px', padding: '0 24px' },
    medium: { height: '48px', fontSize: '15px', borderRadius: '12px', padding: '0 20px' },
    small: { height: '40px', fontSize: '14px', borderRadius: '10px', padding: '0 16px' },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: colors.bluePadel,
      color: colors.white,
      boxShadow: '0 8px 24px rgba(26, 140, 216, 0.35)',
    },
    secondary: {
      background: colors.white,
      color: colors.black,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    },
    ghost: {
      background: 'transparent',
      color: colors.gray,
      boxShadow: 'none',
    },
  };

  const style = { ...baseStyles, ...sizeStyles[size], ...variantStyles[variant] };

  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    const target = e.currentTarget as HTMLElement;
    if (navigator.vibrate) navigator.vibrate(10);
    target.style.transform = 'scale(0.97)';
    setTimeout(() => { target.style.transform = 'scale(1)'; }, 100);
  };

  const content = (
    <>
      {icon && <span style={{ fontSize: size === 'large' ? '24px' : '20px' }}>{icon}</span>}
      {children}
    </>
  );

  if (href) {
    return (
      <Link href={href} style={style} onMouseDown={handleInteraction} onTouchStart={handleInteraction}>
        {content}
      </Link>
    );
  }

  return (
    <button style={style} onClick={onClick} onMouseDown={handleInteraction} onTouchStart={handleInteraction}>
      {content}
    </button>
  );
}

// Card
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: colors.white,
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      ...style
    }}>
      {children}
    </div>
  );
}

export default function DashboardClient({
  firstName,
  userLeagues,
  nextEvent,
  isEventToday,
  isEventTomorrow,
  pastEventToday,
  matchToday,
  newPlan,
  currentStreak,
  thisWeekMatches,
  thisWeekWins,
  primaryLeagueId,
}: Props) {

  // === LOGICA CTA DINAMICA ===
  
  // Caso 1: Hai già registrato oggi → mostra risultato, no CTA
  const alreadyPlayedToday = matchToday !== null;
  
  // Caso 2: Evento passato oggi, non ancora registrato → "Com'è andata?"
  const hasPastEvent = pastEventToday !== null && !alreadyPlayedToday;
  
  // Determina CTA
  let ctaText = 'Registra Partita';
  let ctaIcon = '🎾';
  let ctaHref = primaryLeagueId ? `/leagues/${primaryLeagueId}/match/new` : '/quick-match';
  
  if (hasPastEvent) {
    const eventTime = pastEventToday.event_time?.slice(0, 5) || '';
    ctaText = `Com'è andata alle ${eventTime}?`;
    ctaIcon = '📍';
    ctaHref = pastEventToday.league?.id 
      ? `/leagues/${pastEventToday.league.id}/match/new` 
      : '/quick-match';
  }

  // === HERO DINAMICO ===
  const hasUrgentEvent = (isEventToday || isEventTomorrow) && nextEvent && !hasPastEvent;
  const hasNewPlan = newPlan !== null;
  const hasStreak = currentStreak >= 3;

  let heroType: 'played' | 'event' | 'plan' | 'streak' | 'none' = 'none';
  if (alreadyPlayedToday) heroType = 'played';
  else if (hasUrgentEvent) heroType = 'event';
  else if (hasNewPlan) heroType = 'plan';
  else if (hasStreak) heroType = 'streak';

  return (
    <div style={{ minHeight: '100vh', background: colors.white, paddingBottom: '100px' }}>
      
      {/* Header */}
      <div style={{ padding: '48px 20px 24px', background: colors.white }}>
        <p style={{ color: colors.gray, fontSize: '15px', marginBottom: '4px' }}>Ciao</p>
        <h1 style={{ color: colors.black, fontSize: '32px', fontWeight: 800 }}>{firstName}</h1>
      </div>

      <div style={{ padding: '0 20px' }}>
        
        {/* === HERO: PARTITA GIÀ REGISTRATA OGGI === */}
        {heroType === 'played' && matchToday && (
          <Card style={{
            background: colors.blueLight,
            marginBottom: '16px',
            border: `2px solid ${colors.bluePadel}20`
          }}>
            <p style={{ fontSize: '12px', color: colors.bluePadel, fontWeight: 600, marginBottom: '8px' }}>
              ✓ PARTITA DI OGGI
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
              <span style={{ 
                fontSize: '28px', 
                fontWeight: 800, 
                color: matchToday.winner_team === 1 ? colors.bluePadel : colors.gray 
              }}>
                {matchToday.score_team1}
              </span>
              <span style={{ fontSize: '14px', color: colors.gray }}>vs</span>
              <span style={{ 
                fontSize: '28px', 
                fontWeight: 800, 
                color: matchToday.winner_team === 2 ? colors.bluePadel : colors.gray 
              }}>
                {matchToday.score_team2}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: colors.gray, textAlign: 'center', marginTop: '8px' }}>
              {matchToday.winner_team === 1 || matchToday.winner_team === 2 ? '🎉 Ottima partita!' : ''}
            </p>
          </Card>
        )}

        {/* === HERO: EVENTO IMMINENTE === */}
        {heroType === 'event' && nextEvent && (
          <Link href="/calendar" style={{ textDecoration: 'none' }}>
            <Card style={{
              background: `linear-gradient(135deg, ${colors.bluePadel} 0%, ${colors.blueMuted} 100%)`,
              marginBottom: '16px',
              border: 'none'
            }}>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: 600, marginBottom: '8px' }}>
                {isEventToday ? '📅 OGGI' : '📅 DOMANI'}
              </p>
              <p style={{ fontSize: '20px', fontWeight: 700, color: colors.white, marginBottom: '4px' }}>
                Partita alle {nextEvent?.event_time?.slice(0,5) || '—'}
              </p>
              {nextEvent?.location && (
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>📍 {nextEvent.location}</p>
              )}
            </Card>
          </Link>
        )}

        {/* === HERO: NUOVO PIANO COACH === */}
        {heroType === 'plan' && newPlan && (
          <Link href={`/plans/${newPlan.id}`} style={{ textDecoration: 'none' }}>
            <Card style={{
              background: `linear-gradient(135deg, ${colors.bluePadel} 0%, #1565C0 100%)`,
              marginBottom: '16px'
            }}>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: 600, marginBottom: '8px' }}>
                👨‍🏫 NUOVO PIANO
              </p>
              <p style={{ fontSize: '20px', fontWeight: 700, color: colors.white, marginBottom: '4px' }}>
                {newPlan.title}
              </p>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
                da Coach {newPlan.coach?.full_name?.split(' ')[0]}
              </p>
            </Card>
          </Link>
        )}

        {/* === HERO: STREAK === */}
        {heroType === 'streak' && (
          <Card style={{
            background: `linear-gradient(135deg, ${colors.orange} 0%, #D35400 100%)`,
            marginBottom: '16px'
          }}>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: 600, marginBottom: '8px' }}>
              🔥 SEI ON FIRE
            </p>
            <p style={{ fontSize: '28px', fontWeight: 800, color: colors.white }}>
              {currentStreak} vittorie di fila!
            </p>
          </Card>
        )}

        {/* === CTA PRINCIPALE (nascosta se già giocato oggi) === */}
        {!alreadyPlayedToday && (
          <div style={{ marginBottom: '24px' }}>
            <ActionButton href={ctaHref} icon={ctaIcon} variant="primary" size="large">
              {ctaText}
            </ActionButton>
          </div>
        )}

        {/* QUICK ACTIONS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
          <ActionButton href="/quick-match" variant="secondary" size="medium" fullWidth>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '24px', display: 'block', marginBottom: '4px' }}>⚡</span>
              <span style={{ fontSize: '12px', color: colors.gray }}>Veloce</span>
            </div>
          </ActionButton>
          
          <ActionButton href="/profile/player-card" variant="secondary" size="medium" fullWidth>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '24px', display: 'block', marginBottom: '4px' }}>🏆</span>
              <span style={{ fontSize: '12px', color: colors.gray }}>Card</span>
            </div>
          </ActionButton>
          
          <ActionButton href="/companions" variant="secondary" size="medium" fullWidth>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '24px', display: 'block', marginBottom: '4px' }}>👥</span>
              <span style={{ fontSize: '12px', color: colors.gray }}>Compagni</span>
            </div>
          </ActionButton>
        </div>

        {/* STATS SETTIMANA */}
        {thisWeekMatches > 0 && (
          <Card style={{ marginBottom: '16px', background: colors.background }}>
            <p style={{ fontSize: '11px', color: colors.gray, fontWeight: 600, marginBottom: '12px', letterSpacing: '0.5px' }}>
              QUESTA SETTIMANA
            </p>
            <div style={{ display: 'flex', gap: '32px' }}>
              <div>
                <p style={{ fontSize: '32px', fontWeight: 800, color: colors.black }}>{thisWeekMatches}</p>
                <p style={{ fontSize: '12px', color: colors.gray }}>partite</p>
              </div>
              <div>
                <p style={{ fontSize: '32px', fontWeight: 800, color: colors.bluePadel }}>{thisWeekWins}</p>
                <p style={{ fontSize: '12px', color: colors.gray }}>vittorie</p>
              </div>
              {currentStreak > 0 && (
                <div>
                  <p style={{ fontSize: '32px', fontWeight: 800, color: colors.orange }}>{currentStreak}</p>
                  <p style={{ fontSize: '12px', color: colors.gray }}>streak 🔥</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* LE TUE LEGHE */}
        {userLeagues.length > 0 && (
          <Card style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', color: colors.gray, fontWeight: 600, letterSpacing: '0.5px' }}>
                LE TUE LEGHE
              </p>
              <Link href="/leagues" style={{ fontSize: '13px', color: colors.bluePadel, fontWeight: 600, textDecoration: 'none' }}>
                Tutte →
              </Link>
            </div>
            {userLeagues.slice(0, 2).map((ul: any) => (
              <Link key={ul.league_id} href={`/leagues/${ul.league?.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 16px',
                  background: colors.background,
                  borderRadius: '12px',
                  marginBottom: '8px'
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, color: colors.black, fontSize: '15px' }}>{ul.league?.name}</p>
                    <p style={{ fontSize: '12px', color: colors.gray }}>{ul.wins}V - {ul.losses}S</p>
                  </div>
                  <p style={{ fontSize: '24px', fontWeight: 800, color: colors.bluePadel }}>{ul.points}</p>
                </div>
              </Link>
            ))}
          </Card>
        )}

        {/* SEZIONE ALLENAMENTO */}
        <Card style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '11px', color: colors.gray, fontWeight: 600, marginBottom: '16px', letterSpacing: '0.5px' }}>
            ALLENAMENTO
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            <Link href="/training" style={{ textDecoration: 'none' }}>
              <div style={{ textAlign: 'center', padding: '16px 8px', background: colors.background, borderRadius: '12px' }}>
                <span style={{ fontSize: '24px', display: 'block', marginBottom: '6px' }}>📝</span>
                <p style={{ fontSize: '12px', fontWeight: 600, color: colors.black }}>Schede</p>
              </div>
            </Link>
            <Link href="/plans" style={{ textDecoration: 'none' }}>
              <div style={{ textAlign: 'center', padding: '16px 8px', background: colors.background, borderRadius: '12px' }}>
                <span style={{ fontSize: '24px', display: 'block', marginBottom: '6px' }}>📋</span>
                <p style={{ fontSize: '12px', fontWeight: 600, color: colors.black }}>Piani</p>
              </div>
            </Link>
            <Link href="/connections" style={{ textDecoration: 'none' }}>
              <div style={{ textAlign: 'center', padding: '16px 8px', background: colors.background, borderRadius: '12px' }}>
                <span style={{ fontSize: '24px', display: 'block', marginBottom: '6px' }}>👨‍🏫</span>
                <p style={{ fontSize: '12px', fontWeight: 600, color: colors.black }}>Maestro</p>
              </div>
            </Link>
          </div>
        </Card>

        {/* EMPTY STATE */}
        {userLeagues.length === 0 && thisWeekMatches === 0 && (
          <Card style={{ textAlign: 'center', padding: '40px 20px' }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>🎾</span>
            <p style={{ color: colors.black, fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
              Inizia a giocare!
            </p>
            <p style={{ color: colors.gray, fontSize: '14px', marginBottom: '20px' }}>
              Crea una lega o registra una partita veloce
            </p>
            <ActionButton href="/leagues/new" variant="secondary" size="medium">
              Crea la tua prima lega
            </ActionButton>
          </Card>
        )}

      </div>
    </div>
  );
}
