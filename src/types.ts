export interface Player {
  nombre: string;
  dorsal: number;
  foto: string;
  posicion?: 'POR' | 'LD' | 'LI' | 'DFC' | 'MCD' | 'MC' | 'MCO' | 'ED' | 'EI' | 'DC';
}

export interface Scorer {
  nombre: string;
  goles: number;
  pj?: number;
}

export interface Match {
  id: string;
  jornada: 'J1' | 'J2' | 'J3' | '1/16' | '1/8' | '1/4' | 'SEM' | '3º/4º' | 'FIN';
  fecha: string;
  dia: string;
  horario: string;
  tv: string;
  grupo: string;
  equipo1: string;
  equipo2: string;
  res1: number | null;
  res2: number | null;
  status: 'pending' | 'played';
  scorers1?: string[]; // Array of player names who scored for team 1
  scorers2?: string[]; // Array of player names who scored for team 2
}

export interface BracketMatch {
  id: string;
  fecha: string;
  dia: string;
  horario: string;
  tv: string;
  equipo1: string | null; // Could be team name or placeholder like '2A', '3ABCDF' or null
  equipo2: string | null;
  res1: number | null;
  res2: number | null;
  goles1: number | null; // penalties or extra goals
  goles2: number | null;
  status: 'pending' | 'played';
  winner?: string; // Standard name of winner once decided
  scorers1?: string[];
  scorers2?: string[];
}

export interface Standing {
  pos: number;
  team: string;
  pts: number;
  gf: number;
  gc: number;
  dg: number;
}

export type GroupStandings = Record<string, Standing[]>;

export interface TournamentData {
  groups: Record<string, { pos: number; team: string; pts: number; gf: number; gc: number; dg: number }[]>;
  matches: Match[];
  bracket: Record<string, BracketMatch[]>;
  rosters: Record<string, Player[]>;
  initial_team_scorers: Record<string, { nombre: string; goles: number }[]>;
}

export type ActiveTab = 'dashboard' | 'partidos' | 'grupos' | 'bracket' | 'squads' | 'scorers';
