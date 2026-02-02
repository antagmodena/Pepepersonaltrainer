'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCoach, setIsCoach] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('active_role')
        .eq('id', user.id)
        .single();

      setIsCoach(profile?.active_role === 'coach');
    };
    checkRole();
  }, [pathname]);

  if (pathname === '/login' || pathname === '/register' || pathname === '/' || pathname?.startsWith('/onboarding')) {
    return null;
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const accent = isCoach ? '#059669' : '#1A8CD8';
  const accentShadow = isCoach ? 'rgba(5, 150, 105, 0.4)' : 'rgba(26, 140, 216, 0.4)';

  const handleCenterAction = () => {
    if (navigator.vibrate) navigator.vibrate(15);
    if (isCoach) {
      router.push('/plans/new');
    } else {
      const leagueMatch = pathname.match(/\/leagues\/([^\/]+)/);
      const currentLeagueId = leagueMatch ? leagueMatch[1] : null;
      if (currentLeagueId && currentLeagueId !== 'new') {
        router.push(`/leagues/${currentLeagueId}/match/new`);
      } else {
        router.push('/quick-match');
      }
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white z-50" style={{ 
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      borderTop: '1px solid #E5E5E5',
      boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
    }}>
      <div className="max-w-lg mx-auto flex justify-around items-center h-16 relative">
        
        {/* Home */}
        <Link
          href="/dashboard"
          className="flex flex-col items-center justify-center flex-1 h-full relative transition-colors"
          style={{ color: isActive('/dashboard') ? accent : '#999' }}
        >
          <svg className="w-6 h-6" fill={isActive('/dashboard') ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive('/dashboard') ? 0 : 1.5}>
            {isActive('/dashboard') ? (
              <path d="M3 9.5L12 2l9 7.5V20a2 2 0 01-2 2h-4v-7H9v7H5a2 2 0 01-2-2V9.5z"/>
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M9 22V12h6v10"/>
            )}
          </svg>
          <span style={{ fontSize: '10px', marginTop: '2px', fontWeight: isActive('/dashboard') ? 600 : 500 }}>Home</span>
        </Link>

        {/* Tab 2: Leghe (player) / Allievi (coach) */}
        <Link
          href={isCoach ? '/connections' : '/leagues'}
          className="flex flex-col items-center justify-center flex-1 h-full relative transition-colors"
          style={{ color: isActive(isCoach ? '/connections' : '/leagues') ? accent : '#999' }}
        >
          {isCoach ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive('/connections') ? 2 : 1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive('/leagues') ? 2 : 1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
          <span style={{ fontSize: '10px', marginTop: '2px', fontWeight: isActive(isCoach ? '/connections' : '/leagues') ? 600 : 500 }}>
            {isCoach ? 'Allievi' : 'Leghe'}
          </span>
        </Link>

        {/* + Central */}
        <div className="flex flex-col items-center justify-center flex-1 h-full">
          <button
            onClick={handleCenterAction}
            className="w-14 h-14 -mt-5 rounded-full flex items-center justify-center transition-all active:scale-95"
            style={{
              background: accent,
              boxShadow: `0 6px 20px ${accentShadow}`
            }}
          >
            <span className="text-white text-3xl font-light">+</span>
          </button>
        </div>

        {/* Tab 4: Calendario (player) / Video (coach) */}
        <Link
          href={isCoach ? '/videos' : '/calendar'}
          className="flex flex-col items-center justify-center flex-1 h-full relative transition-colors"
          style={{ color: isActive(isCoach ? '/videos' : '/calendar') ? accent : '#999' }}
        >
          {isCoach ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive('/videos') ? 2 : 1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive('/calendar') ? 2 : 1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
          <span style={{ fontSize: '10px', marginTop: '2px', fontWeight: isActive(isCoach ? '/videos' : '/calendar') ? 600 : 500 }}>
            {isCoach ? 'Video' : 'Calendario'}
          </span>
        </Link>

        {/* Profilo */}
        <Link
          href="/profile"
          className="flex flex-col items-center justify-center flex-1 h-full relative transition-colors"
          style={{ color: isActive('/profile') ? accent : '#999' }}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive('/profile') ? 2 : 1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span style={{ fontSize: '10px', marginTop: '2px', fontWeight: isActive('/profile') ? 600 : 500 }}>Profilo</span>
        </Link>
      </div>
    </nav>
  );
}
