-- Aggiungi colonna onboarding_completed alla tabella profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Gli utenti esistenti hanno già completato l'onboarding implicitamente
UPDATE profiles SET onboarding_completed = TRUE WHERE full_name IS NOT NULL;

-- Tabella per partite veloci (senza lega)
CREATE TABLE IF NOT EXISTS quick_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  my_partner_name TEXT,
  opponent1_name TEXT NOT NULL,
  opponent2_name TEXT,
  score_team1 TEXT NOT NULL,
  score_team2 TEXT NOT NULL,
  winner_team INTEGER NOT NULL CHECK (winner_team IN (1, 2)),
  played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE quick_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quick matches"
  ON quick_matches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quick matches"
  ON quick_matches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own quick matches"
  ON quick_matches FOR DELETE
  USING (auth.uid() = user_id);
