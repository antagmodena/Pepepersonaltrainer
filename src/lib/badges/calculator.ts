import { TitleSignals, LeagueTitle, UserBadge, PlayerProfile, BadgeCheckResult } from './types';
import { BADGES, TITLES, getTitleByKey } from './definitions';

// === PARSING SCORES ===

interface ParsedSet {
  team1: number;
  team2: number;
}

function parseScore(scoreString: string): ParsedSet[] {
  const sets: ParsedSet[] = [];
  const parts = scoreString.trim().split(/[\s]+/);
  
  for (const part of parts) {
    const match = part.match(/(\d+)-(\d+)/);
    if (match) {
      sets.push({
        team1: parseInt(match[1]),
        team2: parseInt(match[2])
      });
    }
  }
  
  if (sets.length === 0) {
    const match = scoreString.match(/(\d+)-(\d+)/);
    if (match) {
      sets.push({
        team1: parseInt(match[1]),
        team2: parseInt(match[2])
      });
    }
  }
  
  return sets;
}

function isCloseSet(set: ParsedSet): boolean {
  const diff = Math.abs(set.team1 - set.team2);
  return diff <= 2 && (set.team1 >= 6 || set.team2 >= 6);
}

function isTiebreak(set: ParsedSet): boolean {
  return (set.team1 === 7 && set.team2 === 6) || (set.team1 === 6 && set.team2 === 7);
}

function isDomination(set: ParsedSet, winnerTeam: 1 | 2): boolean {
  const winnerScore = winnerTeam === 1 ? set.team1 : set.team2;
  const loserScore = winnerTeam === 1 ? set.team2 : set.team1;
  return winnerScore === 6 && loserScore <= 2;
}

function isPerfectGame(score1: string, score2: string, winnerTeam: number): boolean {
  const sets1 = parseScore(score1);
  const sets2 = parseScore(score2);
  
  if (winnerTeam === 1) {
    return sets1.every((set, i) => set.team1 === 6 && (sets2[i]?.team2 || set.team2) === 0);
  } else {
    return sets1.every((set, i) => set.team2 === 6 && (sets2[i]?.team1 || set.team1) === 0);
  }
}

// === MATCH ANALYSIS ===

interface MatchData {
  id: string;
  score_team1: string;
  score_team2: string;
  winner_team: number;
  player1_id: string;
  player2_id: string;
  player3_id: string;
  player4_id: string;
  played_at: string;
  league_id?: string;
}

interface MemberData {
  user_id: string;
  points: number;
}

function analyzeMatchForSignals(
  match: MatchData,
  userId: string,
  members: MemberData[]
): Partial<TitleSignals> {
  const signals: Partial<TitleSignals> = {};
  
  const inTeam1 = [match.player1_id, match.player2_id].includes(userId);
  const won = (inTeam1 && match.winner_team === 1) || (!inTeam1 && match.winner_team === 2);
  
  if (!won) return signals;
  
  const myTeam = inTeam1 ? 1 : 2;
  const sets = parseScore(match.score_team1);
  const sets2 = parseScore(match.score_team2);
  
  const allSets: ParsedSet[] = sets.map((s, i) => ({
    team1: s.team1,
    team2: sets2[i]?.team1 || s.team2
  }));
  
  let tiebreaks = 0;
  let closeSets = 0;
  let dominations = 0;
  let lostFirstSet = false;
  
  allSets.forEach((set, index) => {
    const wonSet = (myTeam === 1 && set.team1 > set.team2) || (myTeam === 2 && set.team2 > set.team1);
    
    if (index === 0 && !wonSet) lostFirstSet = true;
    if (isTiebreak(set)) tiebreaks++;
    if (isCloseSet(set)) closeSets++;
    if (wonSet && isDomination(set, myTeam as 1 | 2)) dominations++;
  });
  
  if (tiebreaks > 0 || closeSets >= 2) {
    signals.muratore = (signals.muratore || 0) + 1 + tiebreaks;
  }
  
  if (dominations >= 2 || (dominations >= 1 && allSets.length === 2)) {
    signals.smashatore = (signals.smashatore || 0) + dominations;
  }
  
  if (lostFirstSet && allSets.length >= 2) {
    signals.rimontatore = (signals.rimontatore || 0) + 2;
  }
  
  if (closeSets >= 1 && tiebreaks === 0) {
    signals.cecchino = (signals.cecchino || 0) + 1;
  }
  
  const myPoints = members.find(m => m.user_id === userId)?.points || 0;
  const opponents = inTeam1 
    ? [match.player3_id, match.player4_id]
    : [match.player1_id, match.player2_id];
  
  const strongerOpponent = opponents.some(oppId => {
    const oppPoints = members.find(m => m.user_id === oppId)?.points || 0;
    return oppPoints > myPoints + 50;
  });
  
  if (strongerOpponent) {
    signals.volpe = (signals.volpe || 0) + 2;
  }
  
  signals.giocatore = 1;
  
  return signals;
}

// === TITLE CALCULATION ===

export function calculateLeagueTitle(
  matches: MatchData[],
  userId: string,
  members: MemberData[],
  leagueId: string,
  leagueName: string
): LeagueTitle {
  const leagueMatches = matches
    .filter(m => m.league_id === leagueId)
    .filter(m => [m.player1_id, m.player2_id, m.player3_id, m.player4_id].includes(userId))
    .sort((a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime())
    .slice(0, 15);
  
  if (leagueMatches.length < 5) {
    return {
      leagueId,
      leagueName,
      titleKey: 'novizio',
      titleEmoji: '🌱',
      titleName: 'Novizio',
      score: 0,
      matchesAnalyzed: leagueMatches.length
    };
  }
  
  const totalSignals: TitleSignals = {
    muratore: 0,
    smashatore: 0,
    rimontatore: 0,
    cecchino: 0,
    volpe: 0,
    collante: 0,
    imprevedibile: 0,
    giocatore: 0
  };
  
  const partnerWins: Record<string, number> = {};
  const partnerTotal: Record<string, number> = {};
  
  leagueMatches.forEach(match => {
    const signals = analyzeMatchForSignals(match, userId, members);
    
    Object.entries(signals).forEach(([key, value]) => {
      totalSignals[key as keyof TitleSignals] += value || 0;
    });
    
    const inTeam1 = [match.player1_id, match.player2_id].includes(userId);
    const partnerId = inTeam1
      ? (match.player1_id === userId ? match.player2_id : match.player1_id)
      : (match.player3_id === userId ? match.player4_id : match.player3_id);
    
    if (partnerId) {
      partnerTotal[partnerId] = (partnerTotal[partnerId] || 0) + 1;
      const won = (inTeam1 && match.winner_team === 1) || (!inTeam1 && match.winner_team === 2);
      if (won) partnerWins[partnerId] = (partnerWins[partnerId] || 0) + 1;
    }
  });
  
  Object.entries(partnerTotal).forEach(([partnerId, total]) => {
    if (total >= 3) {
      const wins = partnerWins[partnerId] || 0;
      const winRate = wins / total;
      if (winRate >= 0.7) {
        totalSignals.collante += Math.floor(total * winRate);
      }
    }
  });
  
  const titleScores: { key: string; score: number }[] = [
    { key: 'muratore', score: totalSignals.muratore },
    { key: 'smashatore', score: totalSignals.smashatore },
    { key: 'rimontatore', score: totalSignals.rimontatore },
    { key: 'cecchino', score: totalSignals.cecchino },
    { key: 'volpe', score: totalSignals.volpe },
    { key: 'collante', score: totalSignals.collante },
    { key: 'giocatore', score: totalSignals.giocatore },
  ];
  
  const dominant = titleScores.sort((a, b) => b.score - a.score)[0];
  const title = getTitleByKey(dominant.key);
  
  return {
    leagueId,
    leagueName,
    titleKey: dominant.key,
    titleEmoji: title?.emoji || '🎾',
    titleName: title?.name || 'Giocatore',
    score: dominant.score,
    matchesAnalyzed: leagueMatches.length
  };
}

// === BADGE CALCULATION ===

export function checkBadges(
  allMatches: MatchData[],
  userId: string,
  members: MemberData[],
  leaguesCreated: number
): BadgeCheckResult[] {
  const results: BadgeCheckResult[] = [];
  
  const userMatches = allMatches.filter(m => 
    [m.player1_id, m.player2_id, m.player3_id, m.player4_id].includes(userId)
  );
  
  const totalMatches = userMatches.length;
  
  let wins = 0;
  let currentStreak = 0;
  let maxStreak = 0;
  let hasComeback = false;
  let hasPerfectGame = false;
  let hasThirdSetWin = false;
  let giantKill = false;
  
  const partners = new Set<string>();
  const leagues = new Set<string>();
  
  const sortedMatches = [...userMatches].sort(
    (a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime()
  );
  
  sortedMatches.forEach((match, index) => {
    const inTeam1 = [match.player1_id, match.player2_id].includes(userId);
    const won = (inTeam1 && match.winner_team === 1) || (!inTeam1 && match.winner_team === 2);
    
    if (won) {
      wins++;
      if (index === 0 || currentStreak > 0) currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
    
    const partnerId = inTeam1
      ? (match.player1_id === userId ? match.player2_id : match.player1_id)
      : (match.player3_id === userId ? match.player4_id : match.player3_id);
    if (partnerId) partners.add(partnerId);
    
    if (match.league_id) leagues.add(match.league_id);
    
    if (won) {
      const sets = parseScore(match.score_team1);
      if (sets.length >= 2) {
        const lostFirst = (inTeam1 && sets[0].team1 < sets[0].team2) || 
                          (!inTeam1 && sets[0].team2 < sets[0].team1);
        if (lostFirst) hasComeback = true;
        if (sets.length >= 3) hasThirdSetWin = true;
      }
      
      if (isPerfectGame(match.score_team1, match.score_team2, match.winner_team)) {
        hasPerfectGame = true;
      }
      
      const myPoints = members.find(m => m.user_id === userId)?.points || 0;
      const opponents = inTeam1 
        ? [match.player3_id, match.player4_id]
        : [match.player1_id, match.player2_id];
      
      const leagueMembers = members.filter(m => 
        opponents.includes(m.user_id) || m.user_id === userId
      ).sort((a, b) => b.points - a.points);
      
      if (leagueMembers[0] && opponents.includes(leagueMembers[0].user_id)) {
        giantKill = true;
      }
    }
  });
  
  // Milestone
  results.push({ key: 'first_match', unlocked: totalMatches >= 1, progress: totalMatches, total: 1 });
  results.push({ key: 'club_10', unlocked: totalMatches >= 10, progress: totalMatches, total: 10 });
  results.push({ key: 'club_25', unlocked: totalMatches >= 25, progress: totalMatches, total: 25 });
  results.push({ key: 'club_50', unlocked: totalMatches >= 50, progress: totalMatches, total: 50 });
  results.push({ key: 'centurion', unlocked: totalMatches >= 100, progress: totalMatches, total: 100 });
  
  // Achievement
  results.push({ key: 'giant_killer', unlocked: giantKill });
  results.push({ key: 'comeback_king', unlocked: hasComeback });
  results.push({ key: 'on_fire', unlocked: maxStreak >= 5, progress: maxStreak, total: 5 });
  results.push({ key: 'perfect_game', unlocked: hasPerfectGame });
  results.push({ key: 'marathon', unlocked: hasThirdSetWin });
  
  // Social
  results.push({ key: 'social_10', unlocked: partners.size >= 10, progress: partners.size, total: 10 });
  results.push({ key: 'triple_crown', unlocked: leagues.size >= 3, progress: leagues.size, total: 3 });
  results.push({ key: 'founder', unlocked: leaguesCreated >= 1 });
  
  return results;
}

// === MAIN PROFILE CALCULATOR ===

export async function calculatePlayerProfile(
  allMatches: MatchData[],
  userId: string,
  membersByLeague: Record<string, MemberData[]>,
  leagueNames: Record<string, string>,
  leaguesCreated: number
): Promise<PlayerProfile> {
  const userMatches = allMatches.filter(m => 
    [m.player1_id, m.player2_id, m.player3_id, m.player4_id].includes(userId)
  );
  
  let wins = 0;
  let losses = 0;
  let currentStreak = 0;
  
  const sortedMatches = [...userMatches].sort(
    (a, b) => new Date(b.played_at).getTime() - new Date(a.played_at).getTime()
  );
  
  sortedMatches.forEach((match, index) => {
    const inTeam1 = [match.player1_id, match.player2_id].includes(userId);
    const won = (inTeam1 && match.winner_team === 1) || (!inTeam1 && match.winner_team === 2);
    
    if (won) {
      wins++;
      if (index === 0 || currentStreak > 0) currentStreak++;
    } else {
      losses++;
      if (currentStreak > 0) currentStreak = 0;
    }
  });
  
  const leagueIds = [...new Set(userMatches.map(m => m.league_id).filter(Boolean))] as string[];
  const leagueTitles: LeagueTitle[] = leagueIds.map(leagueId => 
    calculateLeagueTitle(
      allMatches,
      userId,
      membersByLeague[leagueId] || [],
      leagueId,
      leagueNames[leagueId] || 'Lega'
    )
  );
  
  const activeTitles = leagueTitles.filter(t => t.titleKey !== 'novizio');
  const dominantTitle = activeTitles.length > 0
    ? activeTitles.sort((a, b) => b.score - a.score)[0]
    : leagueTitles[0] || null;
  
  const allMembers = Object.values(membersByLeague).flat();
  const badgeResults = checkBadges(allMatches, userId, allMembers, leaguesCreated);
  const unlockedBadges: UserBadge[] = badgeResults
    .filter(b => b.unlocked)
    .map(b => ({ key: b.key, unlockedAt: new Date().toISOString() }));
  
  return {
    globalBadges: unlockedBadges,
    leagueTitles,
    dominantTitle,
    totalMatches: wins + losses,
    totalWins: wins,
    totalLosses: losses,
    winRate: wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0,
    currentStreak
  };
}
