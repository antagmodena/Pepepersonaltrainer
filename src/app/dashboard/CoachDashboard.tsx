'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import RoleSwitcher from './RoleSwitcher';

const c = {
  emerald: '#059669',
  emeraldDark: '#047857',
  emeraldDeep: '#064E3B',
  emeraldLight: '#D1FAE5',
  teal: '#0D9488',
  white: '#FFFFFF',
  bg: '#F0FDF4',
  black: '#111827',
  gray: '#6B7280',
  lightGray: '#E5E7EB',
  amber: '#F59E0B',
  amberLight: '#FEF3C7',
  red: '#EF4444',
  redLight: '#FEE2E2',
  blue: '#3B82F6',
  blueLight: '#DBEAFE',
};

interface Student {
  id: string;
  full_name: string;
  activePlans: number;
  lastPlanTitle: string | null;
  completedRecently: boolean;
  daysSinceActivity: number | null;
}

interface Notification {
  type: 'completed' | 'warning' | 'info';
  text: string;
  studentId?: string;
}

export default function CoachDashboard({ firstName }: { firstName: string }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState({ totalStudents: 0, activePlans: 0, totalVideos: 0, totalTemplates: 0, pendingRequests: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const supabase = createClient();

  useEffect(() => { loadCoachData(); }, []);

  const loadCoachData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: connections } = await supabase
      .from('coach_student_connections')
      .select('*, student:profiles!coach_student_connections_student_id_fkey(id, full_name)')
      .eq('coach_id', user.id)
      .eq('status', 'accepted');

    const { data: pending } = await supabase
      .from('coach_student_connections')
      .select('id')
      .eq('coach_id', user.id)
      .eq('status', 'pending');

    const { data: plans } = await supabase
      .from('training_plans')
      .select('id, student_id, status, title, updated_at')
      .eq('coach_id', user.id)
      .order('updated_at', { ascending: false });

    const { count: vidCount } = await supabase
      .from('coach_videos')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', user.id);

    const { count: tmplCount } = await supabase
      .from('plan_templates')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', user.id);

    const now = new Date();

    const studentList: Student[] = (connections || []).map(conn => {
      const sid = conn.student?.id;
      const studentPlans = (plans || []).filter(p => p.student_id === sid);
      const active = studentPlans.filter(p => p.status === 'active');
      const completedRecently = studentPlans.some(p =>
        p.status === 'completed' &&
        new Date(p.updated_at) > new Date(now.getTime() - 7 * 86400000)
      );

      const lastActivity = active[0]?.updated_at || null;
      let daysSinceActivity: number | null = null;
      if (lastActivity) {
        daysSinceActivity = Math.floor((now.getTime() - new Date(lastActivity).getTime()) / 86400000);
      }

      return {
        id: sid || '',
        full_name: conn.student?.full_name || 'Allievo',
        activePlans: active.length,
        lastPlanTitle: active[0]?.title || null,
        completedRecently,
        daysSinceActivity,
      };
    });

    studentList.sort((a, b) => {
      if (a.completedRecently && !b.completedRecently) return -1;
      if (!a.completedRecently && b.completedRecently) return 1;
      if (a.activePlans === 0 && b.activePlans > 0) return -1;
      if (a.activePlans > 0 && b.activePlans === 0) return 1;
      return a.full_name.localeCompare(b.full_name);
    });

    const notifs: Notification[] = [];
    const recentCompleted = (plans || []).filter(p =>
      p.status === 'completed' &&
      new Date(p.updated_at) > new Date(now.getTime() - 7 * 86400000)
    );
    recentCompleted.slice(0, 5).forEach(p => {
      const student = studentList.find(s => s.id === p.student_id);
      if (student) {
        notifs.push({ type: 'completed', text: `${student.full_name} ha completato "${p.title}"`, studentId: student.id });
      }
    });

    const inactive = studentList.filter(s => s.activePlans === 0);
    if (inactive.length > 0) {
      notifs.push({ type: 'warning', text: `${inactive.length} alliev${inactive.length === 1 ? 'o' : 'i'} senza piano attivo` });
    }

    if (pending && pending.length > 0) {
      notifs.push({ type: 'info', text: `${pending.length} richiest${pending.length === 1 ? 'a' : 'e'} di connessione` });
    }

    setStudents(studentList);
    setNotifications(notifs);
    setStats({
      totalStudents: studentList.length,
      activePlans: (plans || []).filter(p => p.status === 'active').length,
      totalVideos: vidCount || 0,
      totalTemplates: tmplCount || 0,
      pendingRequests: pending?.length || 0,
    });
    setLoading(false);
  };

  const getStatus = (s: Student) => {
    if (s.completedRecently) return { bg: c.emeraldLight, text: c.emerald, icon: '✅', label: 'Completato' };
    if (s.activePlans > 0) return { bg: c.emeraldLight, text: c.emerald, icon: '🟢', label: 'Piano attivo' };
    if (s.daysSinceActivity !== null && s.daysSinceActivity > 7) return { bg: c.redLight, text: c.red, icon: '🔴', label: `Fermo ${s.daysSinceActivity}gg` };
    if (s.activePlans === 0) return { bg: c.amberLight, text: c.amber, icon: '⚠️', label: 'Senza piano' };
    return { bg: c.lightGray, text: c.gray, icon: '⚪', label: 'Nuovo' };
  };

  const filtered = searchQuery
    ? students.filter(s => s.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
    : students;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.bg }}>
        <p style={{ color: c.gray }}>Caricamento...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: c.white, paddingBottom: '100px' }}>

      {/* HEADER EMERALD */}
      <div style={{
        background: `linear-gradient(135deg, ${c.emerald} 0%, ${c.emeraldDark} 50%, ${c.emeraldDeep} 100%)`,
        padding: '48px 20px 24px',
        borderRadius: '0 0 28px 28px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>
              👨‍🏫 Coach
            </p>
            <h1 style={{ color: c.white, fontSize: '32px', fontWeight: 800 }}>{firstName}</h1>
          </div>
          <RoleSwitcher currentRole="coach" />
        </div>

        <div style={{ display: 'flex', gap: '1px', marginTop: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
          {[
            { value: stats.totalStudents, label: 'Allievi', emoji: '👥' },
            { value: stats.activePlans, label: 'Piani', emoji: '📋' },
            { value: stats.totalVideos, label: 'Video', emoji: '📹' },
            { value: stats.totalTemplates, label: 'Template', emoji: '📦' },
          ].map((stat, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', padding: '12px 4px', background: 'rgba(255,255,255,0.08)' }}>
              <p style={{ fontSize: '22px', fontWeight: 800, color: c.white }}>{stat.value}</p>
              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>{stat.emoji} {stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px' }}>

        {/* NOTIFICHE */}
        {notifications.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: c.gray, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>📬 Da fare</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {notifications.map((notif, i) => {
                const ns = notif.type === 'completed'
                  ? { bg: c.emeraldLight, border: c.emerald, icon: '✅' }
                  : notif.type === 'warning'
                    ? { bg: c.amberLight, border: c.amber, icon: '⚠️' }
                    : { bg: c.blueLight, border: c.blue, icon: '💬' };

                return (
                  <div key={i} onClick={notif.studentId ? () => window.location.href = `/students/${notif.studentId}` : undefined}
                    style={{
                      background: ns.bg, borderRadius: '14px', padding: '14px 16px',
                      display: 'flex', alignItems: 'center', gap: '12px',
                      borderLeft: `4px solid ${ns.border}`,
                      cursor: notif.studentId ? 'pointer' : 'default'
                    }}>
                    <span style={{ fontSize: '18px' }}>{ns.icon}</span>
                    <p style={{ fontSize: '14px', color: c.black, fontWeight: 500, flex: 1 }}>{notif.text}</p>
                    {notif.studentId && <span style={{ color: c.gray, fontSize: '18px' }}>›</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AZIONI RAPIDE */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 700, color: c.gray, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>⚡ Azioni rapide</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { href: '/plans/new', icon: '📋', label: 'Nuovo Piano', gradient: `linear-gradient(135deg, ${c.emerald}, ${c.teal})` },
              { href: '/evaluations/new', icon: '📊', label: 'Valutazione', gradient: `linear-gradient(135deg, ${c.blue}, #6366F1)` },
              { href: '/videos', icon: '📹', label: 'Videoteca', gradient: 'linear-gradient(135deg, #EC4899, #F43F5E)' },
              { href: '/templates', icon: '📦', label: 'Template', gradient: `linear-gradient(135deg, ${c.amber}, #F97316)` },
            ].map((a, i) => (
              <Link key={i} href={a.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: a.gradient, borderRadius: '16px', padding: '16px',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }}>
                  <span style={{ fontSize: '22px' }}>{a.icon}</span>
                  <span style={{ color: c.white, fontSize: '14px', fontWeight: 700 }}>{a.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* CONNESSIONI IN ATTESA */}
        {stats.pendingRequests > 0 && (
          <Link href="/connections" style={{ textDecoration: 'none' }}>
            <div style={{
              background: c.blueLight, borderRadius: '16px', padding: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '24px', border: `1px solid ${c.blue}30`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>🔔</span>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '14px', color: c.blue }}>{stats.pendingRequests} richiest{stats.pendingRequests === 1 ? 'a' : 'e'} in attesa</p>
                  <p style={{ fontSize: '12px', color: c.gray }}>Nuovi allievi vogliono connettersi</p>
                </div>
              </div>
              <span style={{ color: c.blue, fontWeight: 700, fontSize: '14px' }}>Vedi →</span>
            </div>
          </Link>
        )}

        {/* I MIEI ALLIEVI */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: c.gray, textTransform: 'uppercase', letterSpacing: '0.5px' }}>👥 I miei allievi ({students.length})</h2>
            <Link href="/connections" style={{ fontSize: '13px', color: c.emerald, fontWeight: 600, textDecoration: 'none' }}>Gestisci →</Link>
          </div>

          {students.length > 5 && (
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Cerca allievo..."
              style={{ width: '100%', padding: '12px 16px', fontSize: '14px', border: `2px solid ${c.lightGray}`, borderRadius: '12px', outline: 'none', background: c.white, marginBottom: '12px', boxSizing: 'border-box' }}
            />
          )}

          {students.length === 0 ? (
            <div style={{ background: c.white, borderRadius: '20px', padding: '48px 20px', textAlign: 'center', border: `1px solid ${c.lightGray}` }}>
              <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>👥</span>
              <p style={{ color: c.gray, fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Nessun allievo connesso</p>
              <p style={{ color: c.gray, fontSize: '13px', marginBottom: '20px' }}>Condividi il tuo codice coach per iniziare</p>
              <Link href="/connections" style={{ textDecoration: 'none' }}>
                <span style={{ display: 'inline-block', padding: '12px 24px', background: c.emerald, color: c.white, borderRadius: '12px', fontWeight: 700, fontSize: '14px' }}>Gestisci Connessioni →</span>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filtered.map(student => {
                const status = getStatus(student);
                return (
                  <Link key={student.id} href={`/students/${student.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: c.white, borderRadius: '16px', padding: '16px',
                      display: 'flex', alignItems: 'center', gap: '14px',
                      border: `1px solid ${c.lightGray}`
                    }}>
                      <div style={{
                        width: '48px', height: '48px', borderRadius: '50%',
                        background: `linear-gradient(135deg, ${c.emerald}, ${c.teal})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: c.white, fontWeight: 800, fontSize: '18px', flexShrink: 0
                      }}>
                        {student.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: '15px', color: c.black, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.full_name}</p>
                        {student.lastPlanTitle ? (
                          <p style={{ fontSize: '12px', color: c.gray, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📋 {student.lastPlanTitle}</p>
                        ) : (
                          <p style={{ fontSize: '12px', color: c.amber }}>Nessun piano assegnato</p>
                        )}
                      </div>
                      <div style={{ background: status.bg, padding: '6px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        <span style={{ fontSize: '11px' }}>{status.icon}</span>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: status.text, whiteSpace: 'nowrap' }}>{status.label}</span>
                      </div>
                      <span style={{ color: c.lightGray, fontSize: '18px', flexShrink: 0 }}>›</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* RISORSE */}
        <div style={{ marginTop: '28px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 700, color: c.gray, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>📚 Le tue risorse</h2>
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
            {[
              { href: '/videos', icon: '📹', label: 'Videoteca', count: stats.totalVideos, color: '#EC4899' },
              { href: '/templates', icon: '📦', label: 'Template', count: stats.totalTemplates, color: c.amber },
              { href: '/plans', icon: '📋', label: 'Tutti i piani', count: stats.activePlans, color: c.emerald },
              { href: '/evaluations', icon: '📊', label: 'Valutazioni', count: null, color: c.blue },
            ].map((res, i) => (
              <Link key={i} href={res.href} style={{ textDecoration: 'none', flexShrink: 0 }}>
                <div style={{ background: c.white, borderRadius: '16px', padding: '16px', width: '130px', border: `1px solid ${c.lightGray}`, textAlign: 'center' }}>
                  <span style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}>{res.icon}</span>
                  <p style={{ fontWeight: 700, fontSize: '13px', color: c.black, marginBottom: '4px' }}>{res.label}</p>
                  {res.count !== null && (
                    <span style={{ display: 'inline-block', background: res.color + '20', color: res.color, padding: '2px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 700 }}>{res.count}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
