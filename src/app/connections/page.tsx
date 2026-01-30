'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Connection {
  id: string;
  status: string;
  created_at: string;
  student?: { id: string; full_name: string; email: string };
  coach?: { id: string; full_name: string; email: string };
  studentStats?: { totalCards: number; lastActivity: string | null; activePlans: number };
}

export default function ConnectionsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingConnections, setPendingConnections] = useState<Connection[]>([]);
  const [coachCode, setCoachCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setProfile(profileData);

    const isCoachMode = profileData?.active_role === 'coach' || profileData?.role === 'coach';

    if (isCoachMode) {
      const { data: students } = await supabase
        .from('coach_student_connections')
        .select('*, student:profiles!coach_student_connections_student_id_fkey(*)')
        .eq('coach_id', user.id)
        .order('created_at', { ascending: false });

      const accepted = students?.filter(s => s.status === 'accepted') || [];
      const pending = students?.filter(s => s.status === 'pending') || [];

      const enrichedConnections = await Promise.all(
        accepted.map(async (conn) => {
          const { count: totalCards } = await supabase
            .from('training_cards')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', conn.student?.id);

          const { data: lastCard } = await supabase
            .from('training_cards')
            .select('training_date')
            .eq('user_id', conn.student?.id)
            .order('training_date', { ascending: false })
            .limit(1)
            .single();

          const { count: activePlans } = await supabase
            .from('training_plans')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', conn.student?.id)
            .eq('status', 'active');

          return {
            ...conn,
            studentStats: {
              totalCards: totalCards || 0,
              lastActivity: lastCard?.training_date || null,
              activePlans: activePlans || 0
            }
          };
        })
      );

      setConnections(enrichedConnections);
      setPendingConnections(pending);
    } else {
      const { data: coaches } = await supabase
        .from('coach_student_connections')
        .select('*, coach:profiles!coach_student_connections_coach_id_fkey(*)')
        .eq('student_id', user.id)
        .eq('status', 'accepted');
      setConnections(coaches || []);
    }
    setLoading(false);
  };

  const sendRequest = async () => {
    if (!coachCode.trim()) return;
    setSending(true);
    setMessage('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: coach } = await supabase
      .from('profiles')
      .select('id')
      .eq('coach_code', coachCode.toUpperCase())
      .single();

    if (!coach) {
      setMessage('Codice coach non trovato');
      setSending(false);
      return;
    }

    const { error } = await supabase.from('coach_student_connections').insert({
      coach_id: coach.id,
      student_id: user.id,
      status: 'pending'
    });

    if (error) {
      setMessage('Richiesta già inviata');
    } else {
      setMessage('Richiesta inviata!');
      setCoachCode('');
      loadData();
    }
    setSending(false);
  };

  const handleConnection = async (connectionId: string, accept: boolean) => {
    await supabase
      .from('coach_student_connections')
      .update({ status: accept ? 'accepted' : 'rejected' })
      .eq('id', connectionId);
    loadData();
  };

  const disconnectConnection = async (connectionId: string, personName: string) => {
    if (!confirm(`Sei sicuro di voler disconnettere ${personName}? Questa azione non può essere annullata.`)) return;
    
    await supabase
      .from('coach_student_connections')
      .delete()
      .eq('id', connectionId);
    
    loadData();
  };

  const getDaysSince = (date: string | null) => {
    if (!date) return null;
    return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAF7' }}>
        <p style={{ color: '#999' }}>Caricamento...</p>
      </div>
    );
  }

  const isCoachMode = profile?.active_role === 'coach' || profile?.role === 'coach';

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF7', paddingBottom: '100px' }}>
      <div style={{
        background: 'linear-gradient(135deg, #0E5E4A 0%, #0A4A3A 100%)',
        padding: '48px 24px 32px',
        borderRadius: '0 0 32px 32px',
        marginBottom: '24px'
      }}>
        <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
          ← Dashboard
        </Link>
        <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>
          {isCoachMode ? '👥 I miei Allievi' : '👨‍🏫 Il mio Maestro'}
        </h1>
        {isCoachMode && (
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginTop: '4px' }}>
            {connections.length} allievi collegati
          </p>
        )}
      </div>

      <div style={{ padding: '0 20px' }}>
        
        {/* Codice Coach */}
        {isCoachMode && profile?.coach_code && (
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Il tuo codice coach:</p>
            <p style={{
              fontSize: '32px',
              fontWeight: 800,
              color: '#0E5E4A',
              fontFamily: 'monospace',
              letterSpacing: '4px',
              background: '#F0FDF4',
              padding: '16px',
              borderRadius: '12px'
            }}>
              {profile.coach_code}
            </p>
          </div>
        )}

        {/* Form connessione Studenti */}
        {!isCoachMode && (
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '16px'
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111', marginBottom: '16px' }}>
              🔗 Collegati a un Maestro
            </h2>
            <input
              type="text"
              value={coachCode}
              onChange={(e) => setCoachCode(e.target.value.toUpperCase())}
              placeholder="Inserisci codice coach"
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: '18px',
                border: '2px solid #E5E5E5',
                borderRadius: '12px',
                textAlign: 'center',
                fontFamily: 'monospace',
                letterSpacing: '4px',
                marginBottom: '12px'
              }}
            />
            <button
              onClick={sendRequest}
              disabled={sending || !coachCode.trim()}
              style={{
                width: '100%',
                padding: '14px',
                background: coachCode.trim() ? '#0E5E4A' : '#E5E5E5',
                color: coachCode.trim() ? '#fff' : '#999',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: coachCode.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              {sending ? 'Invio...' : '📤 Invia Richiesta'}
            </button>
            {message && (
              <p style={{
                marginTop: '12px',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '14px',
                textAlign: 'center',
                background: message.includes('non trovato') || message.includes('già') ? '#FEE2E2' : '#DCFCE7',
                color: message.includes('non trovato') || message.includes('già') ? '#DC2626' : '#16A34A'
              }}>
                {message}
              </p>
            )}
          </div>
        )}

        {/* Richieste Pendenti Coach */}
        {isCoachMode && pendingConnections.length > 0 && (
          <div style={{
            background: '#FEF3C7',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '16px',
            border: '1px solid #FCD34D'
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#92400E', marginBottom: '16px' }}>
              ⏳ Richieste in attesa ({pendingConnections.length})
            </h2>
            {pendingConnections.map(conn => (
              <div key={conn.id} style={{
                background: '#fff',
                padding: '16px',
                borderRadius: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <div>
                  <p style={{ fontWeight: 600, color: '#111' }}>{conn.student?.full_name}</p>
                  <p style={{ fontSize: '12px', color: '#666' }}>{conn.student?.email}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleConnection(conn.id, true)}
                    style={{ padding: '10px 16px', background: '#22C55E', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => handleConnection(conn.id, false)}
                    style={{ padding: '10px 16px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lista Connessioni */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111', marginBottom: '16px' }}>
            {isCoachMode ? '🎾 Allievi Attivi' : '👨‍🏫 I miei Maestri'}
          </h2>
          
          {connections.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>
                {isCoachMode ? '👥' : '👨‍🏫'}
              </span>
              <p style={{ color: '#999', fontSize: '15px' }}>
                {isCoachMode ? 'Nessun allievo collegato' : 'Nessun maestro collegato'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {connections.map(conn => {
                const person = isCoachMode ? conn.student : conn.coach;
                const daysSince = isCoachMode ? getDaysSince(conn.studentStats?.lastActivity || null) : null;
                const isInactive = daysSince !== null && daysSince > 7;

                return (
                  <div key={conn.id} style={{
                    padding: '16px',
                    background: isInactive ? '#FEF2F2' : '#F5F5F3',
                    borderRadius: '16px',
                    border: isInactive ? '1px solid #FECACA' : 'none'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          background: '#0E5E4A',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '18px'
                        }}>
                          {person?.full_name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, color: '#111', fontSize: '15px' }}>
                            {person?.full_name || 'Utente'}
                          </p>
                          <p style={{ fontSize: '12px', color: '#666' }}>{person?.email}</p>
                        </div>
                      </div>
                      
                      {/* Pulsante Disconnetti */}
                      <button
                        onClick={() => disconnectConnection(conn.id, person?.full_name || 'questo utente')}
                        style={{
                          padding: '8px 12px',
                          background: '#FEE2E2',
                          color: '#DC2626',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Disconnetti
                      </button>
                    </div>

                    {/* Stats Coach */}
                    {isCoachMode && conn.studentStats && (
                      <div style={{
                        display: 'flex',
                        gap: '16px',
                        marginTop: '12px',
                        paddingTop: '12px',
                        borderTop: '1px solid #E5E5E5'
                      }}>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <p style={{ fontSize: '18px', fontWeight: 700, color: '#0E5E4A' }}>{conn.studentStats.totalCards}</p>
                          <p style={{ fontSize: '10px', color: '#999', textTransform: 'uppercase' }}>Schede</p>
                        </div>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <p style={{ fontSize: '18px', fontWeight: 700, color: conn.studentStats.activePlans > 0 ? '#22C55E' : '#999' }}>
                            {conn.studentStats.activePlans}
                          </p>
                          <p style={{ fontSize: '10px', color: '#999', textTransform: 'uppercase' }}>Piani</p>
                        </div>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <p style={{ fontSize: '18px', fontWeight: 700, color: isInactive ? '#EF4444' : daysSince === 0 ? '#22C55E' : '#F59E0B' }}>
                            {daysSince !== null ? (daysSince === 0 ? 'Oggi' : `${daysSince}g`) : '—'}
                          </p>
                          <p style={{ fontSize: '10px', color: '#999', textTransform: 'uppercase' }}>Ultima</p>
                        </div>
                      </div>
                    )}

                    {isInactive && (
                      <div style={{
                        marginTop: '8px',
                        padding: '8px 12px',
                        background: '#FEE2E2',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#DC2626',
                        textAlign: 'center'
                      }}>
                        ⚠️ Non si allena da {daysSince} giorni
                      </div>
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
