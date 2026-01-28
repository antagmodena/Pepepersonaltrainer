'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Props {
  cardId: string;
  currentFeedback: string;
}

export default function CoachFeedbackForm({ cardId, currentFeedback }: Props) {
  const [feedback, setFeedback] = useState(currentFeedback);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSave = async () => {
    setSaving(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase
      .from('training_cards')
      .update({ 
        coach_feedback: feedback,
        coach_feedback_by: user?.id,
        coach_feedback_at: new Date().toISOString()
      })
      .eq('id', cardId);

    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    router.refresh();
  };

  return (
    <div className="card">
      <h3 className="section-title">👨‍🏫 Feedback Maestro</h3>
      
      {success && (
        <div className="bg-green-50 text-green-600 p-3 rounded-xl mb-4 text-sm border border-green-200">
          ✓ Feedback salvato!
        </div>
      )}
      
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        className="input-field min-h-[120px] mb-4"
        placeholder="Scrivi il tuo feedback per l'allievo..."
      />
      
      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary w-full"
      >
        {saving ? 'Salvataggio...' : 'Salva Feedback'}
      </button>
    </div>
  );
}
