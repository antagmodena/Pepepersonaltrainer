'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  planId: string;
  exerciseId: string;
  exerciseName: string;
}

type FeedbackStatus = 'none' | 'done' | 'doubt' | 'repeat';

export default function ExerciseFeedback({ planId, exerciseId, exerciseName }: Props) {
  const [status, setStatus] = useState<FeedbackStatus>('none');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('exercise_feedback')
      .select('status')
      .eq('plan_id', planId)
      .eq('exercise_id', exerciseId)
      .eq('user_id', user.id)
      .single();

    if (data) {
      setStatus(data.status as FeedbackStatus);
    }
    setLoading(false);
  };

  const updateStatus = async (newStatus: FeedbackStatus) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setStatus(newStatus);

    // Upsert feedback
    await supabase.from('exercise_feedback').upsert({
      plan_id: planId,
      exercise_id: exerciseId,
      user_id: user.id,
      status: newStatus,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'plan_id,exercise_id,user_id'
    });
  };

  if (loading) return null;

  const buttons = [
    { key: 'done' as const, label: '✅ Fatto', color: '#22C55E', bgColor: '#DCFCE7' },
    { key: 'doubt' as const, label: '❓ Dubbi', color: '#F59E0B', bgColor: '#FEF3C7' },
    { key: 'repeat' as const, label: '🔄 Ripetere', color: '#EF4444', bgColor: '#FEE2E2' },
  ];

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      marginTop: '8px',
      paddingTop: '12px',
      borderTop: '1px solid rgba(0,0,0,0.05)'
    }}>
      {buttons.map(btn => (
        <button
          key={btn.key}
          onClick={() => updateStatus(status === btn.key ? 'none' : btn.key)}
          style={{
            flex: 1,
            padding: '8px 4px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            background: status === btn.key ? btn.bgColor : '#fff',
            color: status === btn.key ? btn.color : '#94A3B8',
            border: status === btn.key ? `2px solid ${btn.color}` : '2px solid #E2E8F0',
            transition: 'all 0.2s'
          }}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}
