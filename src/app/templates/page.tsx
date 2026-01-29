'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Template {
  id: string;
  title: string;
  description: string;
  duration_weeks: number;
  exercises: any[];
  videos: any[];
  level: string;
  created_at: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => { loadTemplates(); }, []);

  const loadTemplates = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('plan_templates')
      .select('*')
      .eq('coach_id', user.id)
      .order('created_at', { ascending: false });

    setTemplates(data || []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questo template?')) return;
    await supabase.from('plan_templates').delete().eq('id', id);
    loadTemplates();
  };

  const levelColors: Record<string, { color: string; bg: string }> = {
    principiante: { color: '#22C55E', bg: '#DCFCE7' },
    intermedio: { color: '#F59E0B', bg: '#FEF3C7' },
    avanzato: { color: '#EF4444', bg: '#FEE2E2' },
    tutti: { color: '#6366F1', bg: '#E0E7FF' }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <p style={{ color: '#94A3B8' }}>Caricamento...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
      paddingBottom: '100px'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
        padding: '48px 24px 32px',
        borderRadius: '0 0 32px 32px',
        marginBottom: '24px'
      }}>
        <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>
          ← Dashboard
        </Link>
        <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, marginTop: '8px' }}>
          📋 Template Piani
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginTop: '4px' }}>
          {templates.length} template salvati
        </p>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Create New */}
        <Link href="/templates/new" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
            borderRadius: '16px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '20px',
            boxShadow: '0 8px 32px rgba(34, 197, 94, 0.3)'
          }}>
            <span style={{ fontSize: '20px' }}>➕</span>
            <span style={{ color: '#fff', fontSize: '16px', fontWeight: 700 }}>Crea Nuovo Template</span>
          </div>
        </Link>

        {/* Templates List */}
        {templates.length === 0 ? (
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '60px 20px',
            textAlign: 'center',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
          }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>📋</span>
            <p style={{ color: '#94A3B8', fontSize: '15px' }}>Nessun template creato</p>
            <p style={{ color: '#94A3B8', fontSize: '13px' }}>Crea template riutilizzabili per i tuoi allievi</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {templates.map(template => {
              const levelStyle = levelColors[template.level] || levelColors.tutti;
              return (
                <div key={template.id} style={{
                  background: '#fff',
                  borderRadius: '20px',
                  padding: '20px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ fontWeight: 700, fontSize: '16px', color: '#1a1a2e', marginBottom: '4px' }}>
                        {template.title}
                      </h3>
                      {template.description && (
                        <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '8px' }}>
                          {template.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: levelStyle.color,
                          background: levelStyle.bg,
                          padding: '4px 10px',
                          borderRadius: '10px'
                        }}>
                          {template.level.charAt(0).toUpperCase() + template.level.slice(1)}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#64748B',
                          background: '#F1F5F9',
                          padding: '4px 10px',
                          borderRadius: '10px'
                        }}>
                          📅 {template.duration_weeks} sett.
                        </span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#64748B',
                          background: '#F1F5F9',
                          padding: '4px 10px',
                          borderRadius: '10px'
                        }}>
                          🏋️ {template.exercises?.length || 0} esercizi
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <Link href={`/templates/${template.id}/send`} style={{ flex: 1, textDecoration: 'none' }}>
                      <button style={{
                        width: '100%',
                        padding: '12px',
                        background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}>
                        📤 Invia a Allievi
                      </button>
                    </Link>
                    <Link href={`/templates/${template.id}/edit`} style={{ textDecoration: 'none' }}>
                      <button style={{
                        padding: '12px 16px',
                        background: '#F1F5F9',
                        color: '#64748B',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}>
                        ✏️
                      </button>
                    </Link>
                    <button
                      onClick={() => handleDelete(template.id)}
                      style={{
                        padding: '12px 16px',
                        background: '#FEF2F2',
                        color: '#DC2626',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
