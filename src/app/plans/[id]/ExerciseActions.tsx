'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Exercise {
  id: string;
  name: string;
  category: string;
  duration: string;
  description: string;
  videoUrl?: string;
  notes?: string;
}

interface Props {
  planId: string;
  exercise: Exercise;
  exercises: Exercise[];
  isCoach: boolean;
}

export default function ExerciseActions({ planId, exercise, exercises, isCoach }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form edit
  const [name, setName] = useState(exercise.name);
  const [category, setCategory] = useState(exercise.category);
  const [duration, setDuration] = useState(exercise.duration || '');
  const [description, setDescription] = useState(exercise.description || '');
  const [notes, setNotes] = useState(exercise.notes || '');

  const supabase = createClient();
  const router = useRouter();

  const handleDelete = async () => {
    setDeleting(true);
    
    const newExercises = exercises.filter(ex => ex.id !== exercise.id);
    
    const { error } = await supabase
      .from('training_plans')
      .update({ exercises: newExercises })
      .eq('id', planId);

    if (error) {
      alert('Errore: ' + error.message);
      setDeleting(false);
      return;
    }

    router.refresh();
  };

  const handleSave = async () => {
    setSaving(true);
    
    const newExercises = exercises.map(ex => 
      ex.id === exercise.id 
        ? { ...ex, name, category, duration, description, notes }
        : ex
    );
    
    const { error } = await supabase
      .from('training_plans')
      .update({ exercises: newExercises })
      .eq('id', planId);

    if (error) {
      alert('Errore: ' + error.message);
      setSaving(false);
      return;
    }

    setShowEdit(false);
    router.refresh();
  };

  if (!isCoach) return null;

  return (
    <>
      {/* Pulsanti Azioni */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginTop: '12px',
        paddingTop: '12px',
        borderTop: '1px solid rgba(0,0,0,0.08)'
      }}>
        <button
          onClick={() => setShowEdit(true)}
          style={{
            flex: 1,
            padding: '10px',
            background: '#F5F5F3',
            color: '#666',
            border: 'none',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          ✏️ Modifica
        </button>
        <button
          onClick={() => setShowConfirm(true)}
          style={{
            flex: 1,
            padding: '10px',
            background: '#FEE2E2',
            color: '#DC2626',
            border: 'none',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          🗑️ Elimina
        </button>
      </div>

      {/* Modal Conferma Elimina */}
      {showConfirm && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '24px',
            maxWidth: '340px',
            width: '100%'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: '#111' }}>
              Elimina esercizio?
            </h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
              Vuoi eliminare "<strong>{exercise.name}</strong>" dal piano?
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#F5F5F3',
                  color: '#666',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Annulla
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#DC2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  opacity: deleting ? 0.6 : 1
                }}
              >
                {deleting ? 'Elimino...' : 'Elimina'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Modifica */}
      {showEdit && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '24px 24px 0 0',
            padding: '24px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111' }}>
                ✏️ Modifica Esercizio
              </h3>
              <button
                onClick={() => setShowEdit(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#666', display: 'block', marginBottom: '6px' }}>
                  Nome esercizio
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '2px solid #E5E5E5',
                    borderRadius: '12px',
                    fontSize: '15px'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#666', display: 'block', marginBottom: '6px' }}>
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '2px solid #E5E5E5',
                    borderRadius: '12px',
                    fontSize: '15px',
                    background: '#fff'
                  }}
                >
                  <option value="tecnica">🎾 Tecnica</option>
                  <option value="tattica">🧠 Tattica</option>
                  <option value="fisico">💪 Fisico</option>
                  <option value="mentale">🧘 Mentale</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#666', display: 'block', marginBottom: '6px' }}>
                  Durata
                </label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="es: 15 min, 3 serie x 10"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '2px solid #E5E5E5',
                    borderRadius: '12px',
                    fontSize: '15px'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#666', display: 'block', marginBottom: '6px' }}>
                  Descrizione
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '2px solid #E5E5E5',
                    borderRadius: '12px',
                    fontSize: '15px',
                    resize: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#666', display: 'block', marginBottom: '6px' }}>
                  Note per l'allievo
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '2px solid #E5E5E5',
                    borderRadius: '12px',
                    fontSize: '15px',
                    resize: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button
                onClick={() => setShowEdit(false)}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: '#F5F5F3',
                  color: '#666',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Annulla
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !name.trim()}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: '#0E5E4A',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  opacity: saving || !name.trim() ? 0.6 : 1
                }}
              >
                {saving ? 'Salvo...' : '✓ Salva'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
