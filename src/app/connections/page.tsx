'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
}

interface Connection {
  id: string;
  student_id: string;
  coach_id: string;
  status: string;
  invited_by: string;
  student?: Profile;
  coach?: Profile;
}

export default function ConnectionsPage() {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('student');
  const [userId, setUserId] = useState('');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingInvites, setPendingInvites] = useState<Connection[]>([]);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUserId(user.id);

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile) {
      setUserRole(profile.role);
    }

    if (profile?.role === 'student') {
      const { data: links } = await supabase
        .from('student_coach_links')
        .select('*, coach:profiles!student_coach_links_coach_id_fkey(*)')
        .eq('student_id', user.id);

      if (links) {
        setConnections(links.filter(l => l.status === 'accepted'));
        setPendingInvites(links.filter(l => l.status === 'pending'));
      }
    } else {
      const { data: links } = await supabase
        .from('student_coach_links')
        .select('*, student:profiles!student_coach_links_student_id_fkey(*)')
        .eq('coach_id', user.id);

      if (links) {
        setConnections(links.filter(l => l.status === 'accepted'));
        setPendingInvites(links.filter(l => l.status === 'pending'));
      }
    }

    setLoading(false);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');
    setSuccess('');

    const { data: targetUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (!targetUser) {
      setError('Utente non trovato con questa email');
      setSending(false);
      return;
    }

    if (userRole === 'student' && targetUser.role !== 'coach') {
      setError('Questo utente non è un maestro');
      setSending(false);
      return;
    }

    if (userRole === 'coach' && targetUser.role !== 'student') {
      setError('Questo utente non è un allievo');
      setSending(false);
      return;
    }

    const linkData = userRole === 'student' 
      ? { student_id: userId, coach_id: targetUser.id, invited_by: userId }
      : { student_id: targetUser.id, coach_id: userId, invited_by: userId };

    const { error: insertError } = await supabase
      .from('student_coach_links')
      .insert(linkData);

    if (insertError) {
      if (insertError.code === '23505') {
        setError('Collegamento già esistente');
      } else {
        setError(insertError.message);
      }
    } else {
      setSuccess('Invito inviato!');
      setEmail('');
      loadData();
    }

    setSending(false);
  };

  const handleAccept = async (linkId: string) => {
    await supabase
      .from('student_coach_links')
      .update({ status: 'accepted' })
      .eq('id', linkId);
    loadData();
  };

  const handleReject = async (linkId: string) => {
    await supabase
      .from('student_coach_links')
      .delete()
      .eq('id', linkId);
    loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--color-gray)]">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-lg mx-auto">
        
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard" className="text-[var(--color-blue)] font-medium">
            ← Indietro
          </Link>
          <h1 className="text-xl font-bold text-[var(--color-dark-blue)]">
            {userRole === 'student' ? 'I miei Maestri' : 'I miei Allievi'}
          </h1>
          <div className="w-16"></div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-600 p-4 rounded-xl mb-6 text-sm border border-green-200">
            ✓ {success}
          </div>
        )}

        <div className="card mb-6">
          <h2 className="section-title">
            {userRole === 'student' ? '➕ Collega un Maestro' : '➕ Collega un Allievo'}
          </h2>
          <form onSubmit={handleInvite} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field flex-1"
              placeholder="Email..."
              required
            />
            <button type="submit" disabled={sending} className="btn-primary">
              {sending ? '...' : 'Invita'}
            </button>
          </form>
        </div>

        {pendingInvites.length > 0 && (
          <div className="card mb-6">
            <h2 className="section-title">⏳ Inviti in attesa</h2>
            <div className="space-y-3">
              {pendingInvites.map(link => {
                const person = userRole === 'student' ? link.coach : link.student;
                const isInvitedByMe = link.invited_by === userId;
                
                return (
                  <div key={link.id} className="flex items-center justify-between p-3 bg-[var(--color-light)] rounded-xl">
                    <div>
                      <div className="font-medium">{person?.full_name || 'Utente'}</div>
                      <div className="text-sm text-[var(--color-gray)]">{person?.email}</div>
                    </div>
                    {isInvitedByMe ? (
                      <span className="text-sm text-[var(--color-gray)]">In attesa...</span>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(link.id)}
                          className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm"
                        >
                          Accetta
                        </button>
                        <button
                          onClick={() => handleReject(link.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm"
                        >
                          Rifiuta
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="card">
          <h2 className="section-title">
            ✅ {userRole === 'student' ? 'Maestri collegati' : 'Allievi collegati'}
          </h2>
          {connections.length === 0 ? (
            <p className="text-[var(--color-gray)] text-center py-4">
              Nessun collegamento attivo
            </p>
          ) : (
            <div className="space-y-3">
              {connections.map(link => {
                const person = userRole === 'student' ? link.coach : link.student;
                
                return (
                  <div key={link.id} className="flex items-center justify-between p-3 bg-[var(--color-light)] rounded-xl">
                    <div>
                      <div className="font-medium">{person?.full_name || 'Utente'}</div>
                      <div className="text-sm text-[var(--color-gray)]">{person?.email}</div>
                    </div>
                    {userRole === 'coach' && (
                      <Link
                        href={`/students/${link.student_id}`}
                        className="btn-primary text-sm py-2 px-4"
                      >
                        Vedi
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
