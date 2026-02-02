'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AutoCoachConnect() {
  useEffect(() => {
    const connectPendingCoach = async () => {
      const pendingCoachId = localStorage.getItem('pendingCoachId');
      if (!pendingCoachId) return;

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check se già connesso
      const { data: existing } = await supabase
        .from('coach_student_connections')
        .select('id')
        .eq('coach_id', pendingCoachId)
        .eq('student_id', user.id)
        .single();

      if (!existing) {
        await supabase.from('coach_student_connections').insert({
          coach_id: pendingCoachId,
          student_id: user.id,
          status: 'accepted'
        });
      }

      localStorage.removeItem('pendingCoachId');
    };

    connectPendingCoach();
  }, []);

  return null;
}
