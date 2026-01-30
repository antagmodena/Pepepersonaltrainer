import { BadgeDefinition, TitleDefinition } from './types';

// === BADGE (Permanenti, Globali) ===
// "Cosa ho fatto nella mia storia di padel?"

export const BADGES: BadgeDefinition[] = [
  // Milestone - Partite giocate
  {
    key: 'first_match',
    emoji: '🎾',
    name: 'Prima Volta',
    description: 'Benvenuto nel gioco',
    hint: 'Gioca la tua prima partita',
    category: 'milestone',
  },
  {
    key: 'club_10',
    emoji: '⭐',
    name: '10 Club',
    description: 'Stai prendendo il ritmo',
    hint: 'Gioca 10 partite',
    category: 'milestone',
  },
  {
    key: 'club_25',
    emoji: '💎',
    name: '25 Club',
    description: 'Non ti ferma nessuno',
    hint: 'Gioca 25 partite',
    category: 'milestone',
  },
  {
    key: 'club_50',
    emoji: '🏅',
    name: '50 Club',
    description: 'Veterano certificato',
    hint: 'Gioca 50 partite',
    category: 'milestone',
  },
  {
    key: 'centurion',
    emoji: '👑',
    name: 'Centurione',
    description: 'Leggenda vivente',
    hint: 'Gioca 100 partite',
    category: 'milestone',
  },

  // Achievement - Imprese
  {
    key: 'giant_killer',
    emoji: '🦁',
    name: 'Giant Killer',
    description: 'Hai abbattuto il re',
    hint: 'Batti il #1 di una lega',
    category: 'achievement',
  },
  {
    key: 'comeback_king',
    emoji: '💪',
    name: 'Rimontatore',
    description: 'Mai darsi per vinti',
    hint: 'Vinci dopo aver perso il primo set',
    category: 'achievement',
  },
  {
    key: 'on_fire',
    emoji: '🔥',
    name: 'On Fire',
    description: 'Inarrestabile',
    hint: 'Vinci 5 partite consecutive',
    category: 'achievement',
  },
  {
    key: 'perfect_game',
    emoji: '💯',
    name: 'Partita Perfetta',
    description: 'Dominazione totale',
    hint: 'Vinci una partita 6-0 6-0',
    category: 'achievement',
  },
  {
    key: 'marathon',
    emoji: '🏃',
    name: 'Maratoneta',
    description: 'Fino alla fine',
    hint: 'Vinci una partita al terzo set',
    category: 'achievement',
  },

  // Social - Comunità
  {
    key: 'social_10',
    emoji: '🤝',
    name: 'Sociale',
    description: 'Giochi con tutti',
    hint: 'Gioca con 10 compagni diversi',
    category: 'social',
  },
  {
    key: 'triple_crown',
    emoji: '🏆',
    name: 'Tripla Corona',
    description: 'Ovunque ti vogliono',
    hint: 'Sii attivo in 3 leghe diverse',
    category: 'social',
  },
  {
    key: 'founder',
    emoji: '🚀',
    name: 'Fondatore',
    description: 'Hai creato una comunità',
    hint: 'Crea una lega',
    category: 'social',
  },
];

// === TITOLI (Dinamici, Per Lega) ===
// "Chi sono io IN QUESTO PERIODO in questa lega?"

export const TITLES: TitleDefinition[] = [
  {
    key: 'muratore',
    emoji: '🏰',
    name: 'Il Muratore',
    description: 'Costruisce punto su punto',
    howToEarn: 'Vinci spesso al tie-break o in partite combattute',
  },
  {
    key: 'smashatore',
    emoji: '⚡',
    name: 'Lo Smashatore',
    description: 'Quando parte, travolge',
    howToEarn: 'Vinci con punteggi netti (6-0, 6-1, 6-2)',
  },
  {
    key: 'rimontatore',
    emoji: '💪',
    name: 'Il Rimontatore',
    description: 'Non finisce mai prima',
    howToEarn: 'Rimonta spesso dopo aver perso il primo set',
  },
  {
    key: 'cecchino',
    emoji: '🎯',
    name: 'Il Cecchino',
    description: 'Nei momenti chiave, c\'è',
    howToEarn: 'Vinci partite equilibrate (7-5, 6-4)',
  },
  {
    key: 'volpe',
    emoji: '🦊',
    name: 'La Volpe',
    description: 'Sottovalutarlo è un errore',
    howToEarn: 'Batti spesso chi ha più punti di te',
  },
  {
    key: 'collante',
    emoji: '🤝',
    name: 'Il Collante',
    description: 'Coppia perfetta',
    howToEarn: 'Alto winrate giocando sempre con lo stesso partner',
  },
  {
    key: 'giocatore',
    emoji: '🎲',
    name: 'Il Giocatore',
    description: 'Vive per il campo',
    howToEarn: 'Gioca tante partite nella lega',
  },
  {
    key: 'novizio',
    emoji: '🌱',
    name: 'Novizio',
    description: 'La storia sta iniziando',
    howToEarn: 'Meno di 5 partite in questa lega',
  },
];

// Helpers
export const getBadgeByKey = (key: string): BadgeDefinition | undefined => 
  BADGES.find(b => b.key === key);

export const getTitleByKey = (key: string): TitleDefinition | undefined => 
  TITLES.find(t => t.key === key);

export const getBadgesByCategory = (category: BadgeDefinition['category']): BadgeDefinition[] =>
  BADGES.filter(b => b.category === category);
