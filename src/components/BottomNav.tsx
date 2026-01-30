'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/login' || pathname === '/register' || pathname === '/') {
    return null;
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const leagueMatch = pathname.match(/\/leagues\/([^\/]+)/);
  const currentLeagueId = leagueMatch ? leagueMatch[1] : null;

  const handleQuickAdd = () => {
    if (currentLeagueId && currentLeagueId !== 'new') {
      router.push(`/leagues/${currentLeagueId}/match/new`);
    } else {
      router.push('/leagues');
    }
  };

  const primary = '#0E5E4A';

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white z-50" style={{ 
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      borderTop: '1px solid #E5E5E5'
    }}>
      <div className="max-w-lg mx-auto flex justify-around items-center h-16 relative">
        
        {/* Home */}
        <Link
          href="/dashboard"
          className="flex flex-col items-center justify-center flex-1 h-full relative transition-colors"
          style={{ color: isActive('/dashboard') ? primary : '#999' }}
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

        {/* Leghe */}
        <Link
          href="/leagues"
          className="flex flex-col items-center justify-center flex-1 h-full relative transition-colors"
          style={{ color: isActive('/leagues') ? primary : '#999' }}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive('/leagues') ? 2 : 1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span style={{ fontSize: '10px', marginTop: '2px', fontWeight: isActive('/leagues') ? 600 : 500 }}>Leghe</span>
        </Link>

        {/* + Central */}
        <div className="flex flex-col items-center justify-center flex-1 h-full">
          <button
            onClick={handleQuickAdd}
            className="w-14 h-14 -mt-5 rounded-full flex items-center justify-center transition-transform active:scale-95"
            style={{
              background: primary,
              boxShadow: '0 4px 20px rgba(14, 94, 74, 0.4)'
            }}
          >
            <span className="text-white text-3xl font-light">+</span>
          </button>
        </div>

        {/* Calendario */}
        <Link
          href="/calendar"
          className="flex flex-col items-center justify-center flex-1 h-full relative transition-colors"
          style={{ color: isActive('/calendar') ? primary : '#999' }}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive('/calendar') ? 2 : 1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span style={{ fontSize: '10px', marginTop: '2px', fontWeight: isActive('/calendar') ? 600 : 500 }}>Calendario</span>
        </Link>

        {/* Profilo */}
        <Link
          href="/profile"
          className="flex flex-col items-center justify-center flex-1 h-full relative transition-colors"
          style={{ color: isActive('/profile') ? primary : '#999' }}
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
