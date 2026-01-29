'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Video {
  id: string;
  title: string;
  url: string;
  category: string;
  subcategory: string;
  notes: string;
  created_at: string;
}

const CATEGORIES = {
  tecnica: { label: '🎾 Tecnica', color: '#3B82F6', bgColor: '#EFF6FF' },
  tattica: { label: '🧠 Tattica', color: '#8B5CF6', bgColor: '#F5F3FF' },
  fisico: { label: '💪 Fisico', color: '#F97316', bgColor: '#FFF7ED' },
  mentale: { label: '🧘 Mentale', color: '#14B8A6', bgColor: '#F0FDFA' },
  ispirazione: { label: '🌟 Ispirazione', color: '#EC4899', bgColor: '#FDF2F8' }
};

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [newVideo, setNewVideo] = useState({ title: '', url: '', category: 'tecnica', subcategory: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => { loadVideos(); }, []);

  const loadVideos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('coach_videos')
      .select('*')
      .eq('coach_id', user.id)
      .order('created_at', { ascending: false });

    setVideos(data || []);
    setLoading(false);
  };

  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
    return match ? match[1] : null;
  };

  const getYouTubeThumbnail = (url: string) => {
    const id = getYouTubeId(url);
    return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
  };

  const handleSave = async () => {
    if (!newVideo.title.trim() || !newVideo.url.trim()) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('coach_videos').insert({
      coach_id: user.id,
      title: newVideo.title,
      url: newVideo.url,
      category: newVideo.category,
      subcategory: newVideo.subcategory || null,
      notes: newVideo.notes || null
    });

    setNewVideo({ title: '', url: '', category: 'tecnica', subcategory: '', notes: '' });
    setShowForm(false);
    setSaving(false);
    loadVideos();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questo video?')) return;
    await supabase.from('coach_videos').delete().eq('id', id);
    loadVideos();
  };

  const filteredVideos = activeCategory === 'all' 
    ? videos 
    : videos.filter(v => v.category === activeCategory);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    fontSize: '15px',
    border: '2px solid #E2E8F0',
    borderRadius: '12px',
    outline: 'none',
    background: '#fff'
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
          📹 La mia Videoteca
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', marginTop: '4px' }}>
          {videos.length} video salvati
        </p>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Add Button */}
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            width: '100%',
            padding: '16px',
            background: showForm ? '#F1F5F9' : 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
            color: showForm ? '#64748B' : '#fff',
            border: 'none',
            borderRadius: '16px',
            fontSize: '16px',
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: '20px',
            boxShadow: showForm ? 'none' : '0 8px 32px rgba(34, 197, 94, 0.3)'
          }}
        >
          {showForm ? '✕ Annulla' : '➕ Aggiungi Video'}
        </button>

        {/* Form */}
        {showForm && (
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
          }}>
            <input
              type="text"
              value={newVideo.title}
              onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
              placeholder="Titolo video"
              style={{ ...inputStyle, marginBottom: '12px' }}
            />
            <input
              type="url"
              value={newVideo.url}
              onChange={(e) => setNewVideo({ ...newVideo, url: e.target.value })}
              placeholder="Link YouTube"
              style={{ ...inputStyle, marginBottom: '12px' }}
            />
            
            {/* Preview */}
            {newVideo.url && getYouTubeThumbnail(newVideo.url) && (
              <div style={{ marginBottom: '12px', borderRadius: '12px', overflow: 'hidden' }}>
                <img 
                  src={getYouTubeThumbnail(newVideo.url)!} 
                  alt="Preview" 
                  style={{ width: '100%', display: 'block' }}
                />
              </div>
            )}

            <select
              value={newVideo.category}
              onChange={(e) => setNewVideo({ ...newVideo, category: e.target.value })}
              style={{ ...inputStyle, marginBottom: '12px', cursor: 'pointer' }}
            >
              {Object.entries(CATEGORIES).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            <input
              type="text"
              value={newVideo.subcategory}
              onChange={(e) => setNewVideo({ ...newVideo, subcategory: e.target.value })}
              placeholder="Sottocategoria (es: Bandeja, Vibora...)"
              style={{ ...inputStyle, marginBottom: '12px' }}
            />
            <textarea
              value={newVideo.notes}
              onChange={(e) => setNewVideo({ ...newVideo, notes: e.target.value })}
              placeholder="Note personali..."
              style={{ ...inputStyle, marginBottom: '12px', minHeight: '80px', resize: 'vertical' }}
            />
            <button
              onClick={handleSave}
              disabled={saving || !newVideo.title.trim() || !newVideo.url.trim()}
              style={{
                width: '100%',
                padding: '14px',
                background: (!newVideo.title.trim() || !newVideo.url.trim()) ? '#E2E8F0' : '#22C55E',
                color: (!newVideo.title.trim() || !newVideo.url.trim()) ? '#94A3B8' : '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: (!newVideo.title.trim() || !newVideo.url.trim()) ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? 'Salvataggio...' : '💾 Salva Video'}
            </button>
          </div>
        )}

        {/* Category Filters */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '20px', 
          overflowX: 'auto', 
          paddingBottom: '8px' 
        }}>
          <button
            onClick={() => setActiveCategory('all')}
            style={{
              padding: '10px 16px',
              borderRadius: '20px',
              border: 'none',
              background: activeCategory === 'all' ? '#1a1a2e' : '#fff',
              color: activeCategory === 'all' ? '#fff' : '#64748B',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            📁 Tutti ({videos.length})
          </button>
          {Object.entries(CATEGORIES).map(([key, val]) => {
            const count = videos.filter(v => v.category === key).length;
            return (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  background: activeCategory === key ? val.color : '#fff',
                  color: activeCategory === key ? '#fff' : '#64748B',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {val.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Video Grid */}
        {filteredVideos.length === 0 ? (
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '60px 20px',
            textAlign: 'center',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
          }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>📹</span>
            <p style={{ color: '#94A3B8', fontSize: '15px' }}>Nessun video salvato</p>
            <p style={{ color: '#94A3B8', fontSize: '13px' }}>Aggiungi video YouTube per iniziare</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {filteredVideos.map(video => {
              const thumb = getYouTubeThumbnail(video.url);
              const cat = CATEGORIES[video.category as keyof typeof CATEGORIES] || CATEGORIES.tecnica;
              
              return (
                <div key={video.id} style={{
                  background: '#fff',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
                }}>
                  <a href={video.url} target="_blank" rel="noopener noreferrer">
                    {thumb ? (
                      <img src={thumb} alt={video.title} style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100px', background: cat.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '32px' }}>🎬</span>
                      </div>
                    )}
                  </a>
                  <div style={{ padding: '12px' }}>
                    <span style={{
                      display: 'inline-block',
                      fontSize: '10px',
                      fontWeight: 600,
                      color: cat.color,
                      background: cat.bgColor,
                      padding: '2px 8px',
                      borderRadius: '10px',
                      marginBottom: '6px'
                    }}>
                      {cat.label}
                    </span>
                    {video.subcategory && (
                      <span style={{
                        display: 'inline-block',
                        fontSize: '10px',
                        fontWeight: 600,
                        color: '#64748B',
                        background: '#F1F5F9',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        marginLeft: '4px',
                        marginBottom: '6px'
                      }}>
                        {video.subcategory}
                      </span>
                    )}
                    <p style={{ fontWeight: 600, fontSize: '13px', color: '#1a1a2e', lineHeight: 1.3 }}>
                      {video.title}
                    </p>
                    <button
                      onClick={() => handleDelete(video.id)}
                      style={{
                        marginTop: '8px',
                        padding: '6px 10px',
                        background: '#FEF2F2',
                        color: '#DC2626',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      🗑️ Elimina
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
