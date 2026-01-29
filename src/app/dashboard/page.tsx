import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import LogoutButton from './LogoutButton';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const isCoach = profile?.role === 'coach';

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-lg mx-auto">
        
        <div className="header-gradient">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                Ciao, {profile?.full_name || 'Giocatore'}! 👋
              </h1>
              <p className="text-blue-100 mt-1">
                {isCoach ? '👨‍🏫 Maestro' : '🎯 Allievo'}
              </p>
            </div>
            <LogoutButton />
          </div>
        </div>

        <div className="card">
          <h2 className="section-title">Menu Principale</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/calendar" className="menu-card">
              <span className="text-4xl mb-3 block">📅</span>
              <span className="font-semibold text-[var(--color-dark-blue)]">Calendario</span>
            </Link>
            <Link href="/training" className="menu-card">
              <span className="text-4xl mb-3 block">📝</span>
              <span className="font-semibold text-[var(--color-dark-blue)]">Le mie Schede</span>
            </Link>
            <Link href="/errors" className="menu-card">
              <span className="text-4xl mb-3 block">⚠️</span>
              <span className="font-semibold text-[var(--color-dark-blue)]">Errori</span>
            </Link>
            <Link href="/goals" className="menu-card">
              <span className="text-4xl mb-3 block">🎯</span>
              <span className="font-semibold text-[var(--color-dark-blue)]">Obiettivi</span>
            </Link>
          </div>
        </div>

        <div className="card mt-4">
          <h2 className="section-title">{isCoach ? 'Gestione Allievi' : 'Il mio Percorso'}</h2>
          <div className="space-y-3">
            <Link href="/plans" className="flex items-center justify-between p-3 bg-[var(--color-light)] rounded-xl hover:bg-blue-50 transition-all">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📋</span>
                <div>
                  <div className="font-semibold text-[var(--color-dark-blue)]">Piani Allenamento</div>
                  <div className="text-sm text-[var(--color-gray)]">
                    {isCoach ? 'Crea e gestisci piani' : 'I tuoi piani assegnati'}
                  </div>
                </div>
              </div>
              <span className="text-[var(--color-azure)]">→</span>
            </Link>

            <Link href="/evaluations" className="flex items-center justify-between p-3 bg-[var(--color-light)] rounded-xl hover:bg-blue-50 transition-all">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📊</span>
                <div>
                  <div className="font-semibold text-[var(--color-dark-blue)]">Valutazioni</div>
                  <div className="text-sm text-[var(--color-gray)]">
                    {isCoach ? 'Valuta i tuoi allievi' : 'Le tue valutazioni'}
                  </div>
                </div>
              </div>
              <span className="text-[var(--color-azure)]">→</span>
            </Link>

            <Link href="/tournaments" className="flex items-center justify-between p-3 bg-[var(--color-light)] rounded-xl hover:bg-blue-50 transition-all">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏆</span>
                <div>
                  <div className="font-semibold text-[var(--color-dark-blue)]">Tornei</div>
                  <div className="text-sm text-[var(--color-gray)]">
                    {isCoach ? 'Assegna tornei agli allievi' : 'I tuoi tornei'}
                  </div>
                </div>
              </div>
              <span className="text-[var(--color-azure)]">→</span>
            </Link>
          </div>
        </div>

        <div className="card mt-4">
          <Link href="/stats" className="flex items-center justify-between p-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📈</span>
              <div>
                <div className="font-semibold text-[var(--color-dark-blue)]">Statistiche</div>
                <div className="text-sm text-[var(--color-gray)]">Vedi i tuoi progressi</div>
              </div>
            </div>
            <span className="text-[var(--color-azure)]">→</span>
          </Link>
        </div>

        <div className="card mt-4">
          <Link href="/connections" className="flex items-center justify-between p-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🤝</span>
              <div>
                <div className="font-semibold text-[var(--color-dark-blue)]">
                  {isCoach ? 'I miei Allievi' : 'I miei Maestri'}
                </div>
                <div className="text-sm text-[var(--color-gray)]">Gestisci collegamenti</div>
              </div>
            </div>
            <span className="text-[var(--color-azure)]">→</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
