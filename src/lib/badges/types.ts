// === BADGE (Permanenti, Globali) ===
export interface BadgeDefinition {
  key: string;
  emoji: string;
  name: string;
  description: string;
  hint: string;
  category: 'milestone' | 'achievement' | 'social';
}

export interface UserBadge {
  key: string;
  unlockedAt: string;
  matchId?: string;
}

// === TITOLI (Dinamici, Per Lega) ===
export interface TitleDefinition {
  key: string;
  emoji: string;
  name: string;
  description: string;
  howToEarn: string;
}

export interface TitleSignals {
  muratore: number;
  smashatore: number;
  rimontatore: number;
  cecchino: number;
  volpe: number;
  collante: number;
  imprevedibile: number;
  giocatore: number;
}

export interface LeagueTitle {
  leagueId: string;
  leagueName: string;
  titleKey: string;
  titleEmoji: string;
  titleName: string;
  score: number;
  matchesAnalyzed: number;
}

export interface PlayerProfile {
  globalBadges: UserBadge[];
  leagueTitles: LeagueTitle[];
  dominantTitle: LeagueTitle | null;
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  currentStreak: number;
}

// === BADGE CHECK RESULT ===
export interface BadgeCheckResult {
  key: string;
  unlocked: boolean;
  progress?: number;
  total?: number;
}
