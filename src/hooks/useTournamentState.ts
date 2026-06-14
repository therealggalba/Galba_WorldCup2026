import { useState, useEffect } from 'react';
import type { Match, BracketMatch, Standing, GroupStandings, Player, Scorer } from '../types';
import initialDataRaw from '../../world_cup_data.json';

const STORAGE_KEY = 'world_cup_2026_state';

// Parse raw data from JSON
const initialData = (initialDataRaw as unknown) as {
  groups: Record<string, { pos: number; team: string; pts: number; gf: number; gc: number; dg: number }[]>;
  matches: Match[];
  bracket: Record<string, BracketMatch[]>;
  rosters: Record<string, Player[]>;
  initial_team_scorers: Record<string, { nombre: string; goles: number }[]>;
};

const mergeRostersWithInitial = (savedRosters: Record<string, Player[]>): Record<string, Player[]> => {
  const merged = { ...initialData.rosters };
  Object.keys(savedRosters).forEach((team) => {
    if (merged[team]) {
      merged[team] = merged[team].map((initialPlayer) => {
        const savedPlayer = savedRosters[team].find((p) => p.dorsal === initialPlayer.dorsal);
        if (savedPlayer) {
          return {
            ...initialPlayer,
            nombre: savedPlayer.nombre,
            foto: savedPlayer.foto,
            posicion: savedPlayer.posicion || initialPlayer.posicion
          };
        }
        return initialPlayer;
      });
    } else {
      merged[team] = savedRosters[team];
    }
  });
  return merged;
};

export function useTournamentState() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [bracket, setBracket] = useState<Record<string, BracketMatch[]>>({
    R32: [],
    R16: [],
    QF: [],
    SF: [],
    TP: [],
    F: []
  });
  const [thirdPlaceSelections, setThirdPlaceSelections] = useState<Record<string, string>>({});
  const [rosters, setRosters] = useState<Record<string, Player[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_rosters');
      if (saved) return mergeRostersWithInitial(JSON.parse(saved));
    } catch (e) {
      console.error('Error loading rosters', e);
    }
    return initialData.rosters;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_rosters', JSON.stringify(rosters));
  }, [rosters]);
  
  // Custom manual scorers additions state, to track scorers added during match validation
  const [customScorers, setCustomScorers] = useState<Record<string, Scorer[]>>({});

  const [errorCorrectionMode, setErrorCorrectionMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY + '_error_correction') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_error_correction', String(errorCorrectionMode));
  }, [errorCorrectionMode]);

  // 1. Load state from localStorage on init
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMatches(parsed.matches);
        setBracket(parsed.bracket);
        setThirdPlaceSelections(parsed.thirdPlaceSelections || {});
        setCustomScorers(parsed.customScorers || {});
        return;
      } catch (e) {
        console.error('Error loading saved state, resetting', e);
      }
    }
    // Fallback to initial excel data
    setMatches(initialData.matches);
    setBracket(initialData.bracket);
    setThirdPlaceSelections({});
    setCustomScorers({});
  }, []);

  // 2. Save state to localStorage whenever it changes
  useEffect(() => {
    if (matches.length > 0) {
      const stateToSave = {
        matches,
        bracket,
        thirdPlaceSelections,
        customScorers
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }
  }, [matches, bracket, thirdPlaceSelections, customScorers]);

  // Reset function to revert to Excel starting point
  const resetToInitial = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY + '_error_correction');
    localStorage.removeItem(STORAGE_KEY + '_rosters');
    setMatches(initialData.matches);
    setBracket(initialData.bracket);
    setThirdPlaceSelections({});
    setCustomScorers({});
    setErrorCorrectionMode(false);
    setRosters(initialData.rosters);
  };

  // 3. Dynamic Standings Calculation
  const getGroupStandings = (): GroupStandings => {
    const standings: GroupStandings = {};

    // Initialize standings for all groups and teams
    Object.keys(initialData.groups).forEach((gname) => {
      standings[gname] = initialData.groups[gname].map((t) => ({
        pos: 1,
        team: t.team,
        pts: 0,
        gf: 0,
        gc: 0,
        dg: 0
      }));
    });

    // Apply scores from matches
    matches.forEach((m) => {
      const gname = m.grupo;
      if (m.status === 'played' && m.res1 !== null && m.res2 !== null) {
        const team1Row = standings[gname]?.find((t) => t.team === m.equipo1);
        const team2Row = standings[gname]?.find((t) => t.team === m.equipo2);

        if (team1Row && team2Row) {
          team1Row.gf += m.res1;
          team1Row.gc += m.res2;
          team2Row.gf += m.res2;
          team2Row.gc += m.res1;

          if (m.res1 > m.res2) {
            team1Row.pts += 3;
          } else if (m.res2 > m.res1) {
            team2Row.pts += 3;
          } else {
            team1Row.pts += 1;
            team2Row.pts += 1;
          }
        }
      }
    });

    // Calculate goal differences and sort according to criteria: Pts -> DG -> GF -> Alphabetical
    Object.keys(standings).forEach((gname) => {
      standings[gname].forEach((t) => {
        t.dg = t.gf - t.gc;
      });

      standings[gname].sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.dg !== a.dg) return b.dg - a.dg;
        if (b.gf !== a.gf) return b.gf - a.gf;
        return a.team.toLowerCase().localeCompare(b.team.toLowerCase());
      });

      // Assign post-sort positions 1..4
      standings[gname].forEach((t, index) => {
        t.pos = index + 1;
      });
    });

    return standings;
  };

  const groupStandings = getGroupStandings();

  // 4. Calculate the 8 best third-place teams
  const getBestThirdPlaceTeams = (): (Standing & { group: string })[] => {
    const thirds: (Standing & { group: string })[] = [];
    Object.keys(groupStandings).forEach((gname) => {
      const thirdTeam = groupStandings[gname].find((t) => t.pos === 3);
      if (thirdTeam) {
        thirds.push({ ...thirdTeam, group: gname });
      }
    });

    // Sort thirds by same criteria: Pts -> DG -> GF -> Alphabetical
    thirds.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.dg !== a.dg) return b.dg - a.dg;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.team.toLowerCase().localeCompare(b.team.toLowerCase());
    });

    return thirds;
  };

  const bestThirds = getBestThirdPlaceTeams();
  const qualifiedThirds = bestThirds.slice(0, 8); // top 8 advance

  // Helper to check if a qualified third-place team is allowed in a slot
  const isGroupAllowedInSlot = (groupName: string, slotPlaceholder: string): boolean => {
    // e.g. slotPlaceholder = '3ABCDF' -> allowed groups: A, B, C, D, F
    const allowedLetters = slotPlaceholder.replace('3', '');
    return allowedLetters.includes(groupName);
  };

  // Get available qualified third place teams for a specific slot
  const getAvailableThirdsForSlot = (slotPlaceholder: string): (Standing & { group: string })[] => {
    return qualifiedThirds.filter(t => isGroupAllowedInSlot(t.group, slotPlaceholder));
  };

  // 5. Dynamic Scorers Compilation
  const getScorers = () => {
    const teamScorers: Record<string, Record<string, number>> = {};

    // Initialize teamScorers with Excel starting point
    Object.keys(initialData.initial_team_scorers).forEach((team) => {
      teamScorers[team] = {};
      initialData.initial_team_scorers[team].forEach((s) => {
        if (s.nombre.endsWith('(A.G.)')) return;
        teamScorers[team][s.nombre] = s.goles;
      });
    });

    // Add manual custom scorers added by the user
    Object.keys(customScorers).forEach((team) => {
      if (!teamScorers[team]) teamScorers[team] = {};
      customScorers[team].forEach((s) => {
        if (s.nombre.endsWith('(A.G.)')) return;
        if (!teamScorers[team][s.nombre]) {
          teamScorers[team][s.nombre] = 0;
        }
        teamScorers[team][s.nombre] += s.goles;
      });
    });

    // Compile into lists
    const pichichiList: { nombre: string; team: string; goles: number; pj: number }[] = [];

    // Let's populate the Pichichi list
    Object.keys(teamScorers).forEach((team) => {
      Object.keys(teamScorers[team]).forEach((player) => {
        const goals = teamScorers[team][player];
        if (goals > 0) {
          // Find if this player is in the Excel pichichi sheet
          // Let's see if we can calculate matches played (PJ)
          // Out of group stage matches that are played: count how many matches this team has played
          const teamMatchesCount = matches.filter(
            (m) => m.status === 'played' && (m.equipo1 === team || m.equipo2 === team)
          ).length;
          
          pichichiList.push({
            nombre: player,
            team: team,
            goles: goals,
            pj: Math.max(1, teamMatchesCount) // Default to at least 1 match played if they scored
          });
        }
      });
    });

    // Sort pichichiList by goals descending, then name ascending
    pichichiList.sort((a, b) => {
      if (b.goles !== a.goles) return b.goles - a.goles;
      return a.nombre.localeCompare(b.nombre);
    });

    // Find the maximum scorer(s) to highlight
    const maxGoals = pichichiList.length > 0 ? pichichiList[0].goles : 0;
    const topScorers = pichichiList.filter((s) => s.goles === maxGoals && maxGoals > 0);

    return {
      pichichi: pichichiList,
      teamScorers,
      topScorers
    };
  };

  const scorersData = getScorers();

  // 6. Resolve actual teams for bracket match cards dynamically
  const resolveBracketTeam = (placeholder: string | null): string => {
    if (!placeholder) return '';
    
    // Check if it is a simple group winner or runner up
    // e.g. '1A', '2B'
    if (/^[12][A-L]$/.test(placeholder)) {
      const pos = parseInt(placeholder[0]);
      const gname = placeholder[1];
      const standingsForGroup = groupStandings[gname];
      if (standingsForGroup && standingsForGroup.length >= pos) {
        return standingsForGroup[pos - 1].team;
      }
    }

    // Check if it is a third place placeholder slot
    // e.g. '3ABCDF'
    if (placeholder.startsWith('3')) {
      return thirdPlaceSelections[placeholder] || placeholder;
    }

    // Otherwise, it might be a winner placeholder from a previous match
    // e.g. 'B_R32_2' -> means winner of match at row 2 in R32 (R1)
    if (placeholder.startsWith('B_')) {
      const parts = placeholder.split('_'); // ['B', 'R32', '2'] etc
      const phase = parts[1];
      const match = bracket[phase]?.find(m => m.id === placeholder);
      if (match && match.status === 'played') {
        return getMatchWinner(match);
      }
    }

    return placeholder;
  };

  const getMatchWinner = (match: BracketMatch): string => {
    if (match.res1 === null || match.res2 === null) return '';
    const t1 = resolveBracketTeam(match.equipo1);
    const t2 = resolveBracketTeam(match.equipo2);
    if (match.res1 > match.res2) return t1;
    if (match.res2 > match.res1) return t2;
    // Draw -> check penalties/goles
    if (match.goles1 !== null && match.goles2 !== null) {
      return match.goles1 > match.goles2 ? t1 : t2;
    }
    return '';
  };

  // Helper to resolve all active teams in the bracket
  const getResolvedBracket = (): Record<string, BracketMatch[]> => {
    const resolved: Record<string, BracketMatch[]> = {};
    
    // R32 (first round of knockout)
    resolved.R32 = bracket.R32.map((m) => ({
      ...m,
      equipo1: resolveBracketTeam(m.equipo1),
      equipo2: resolveBracketTeam(m.equipo2)
    }));

    // Round of 16 (R16)
    // In R16, Match 0 is Winner of R32 Match 0 vs Winner of R32 Match 1, and so on.
    resolved.R16 = bracket.R16.map((m, idx) => {
      const r32Matches = resolved.R32;
      const t1 = r32Matches[idx * 2] && r32Matches[idx * 2].status === 'played' ? getMatchWinner(r32Matches[idx * 2]) : `Ganador M${idx * 2 + 49}`;
      const t2 = r32Matches[idx * 2 + 1] && r32Matches[idx * 2 + 1].status === 'played' ? getMatchWinner(r32Matches[idx * 2 + 1]) : `Ganador M${idx * 2 + 50}`;
      return {
        ...m,
        equipo1: t1,
        equipo2: t2
      };
    });

    // Quarterfinals (QF)
    resolved.QF = bracket.QF.map((m, idx) => {
      const r16Matches = resolved.R16;
      const t1 = r16Matches[idx * 2] && r16Matches[idx * 2].status === 'played' ? getMatchWinner(r16Matches[idx * 2]) : `Ganador Octavos ${idx * 2 + 1}`;
      const t2 = r16Matches[idx * 2 + 1] && r16Matches[idx * 2 + 1].status === 'played' ? getMatchWinner(r16Matches[idx * 2 + 1]) : `Ganador Octavos ${idx * 2 + 2}`;
      return {
        ...m,
        equipo1: t1,
        equipo2: t2
      };
    });

    // Semifinals (SF)
    resolved.SF = bracket.SF.map((m, idx) => {
      const qfMatches = resolved.QF;
      const t1 = qfMatches[idx * 2] && qfMatches[idx * 2].status === 'played' ? getMatchWinner(qfMatches[idx * 2]) : `Ganador Cuartos ${idx * 2 + 1}`;
      const t2 = qfMatches[idx * 2 + 1] && qfMatches[idx * 2 + 1].status === 'played' ? getMatchWinner(qfMatches[idx * 2 + 1]) : `Ganador Cuartos ${idx * 2 + 2}`;
      return {
        ...m,
        equipo1: t1,
        equipo2: t2
      };
    });

    // Third place and Final
    const getLoser = (resolvedMatch: BracketMatch): string => {
      if (resolvedMatch.status !== 'played') return '';
      const w = getMatchWinner(resolvedMatch);
      return (resolvedMatch.equipo1 === w ? resolvedMatch.equipo2 : resolvedMatch.equipo1) || '';
    };

    const sfMatchesResolved = resolved.SF;

    // Third place
    resolved.TP = bracket.TP.map((m) => {
      const t1 = sfMatchesResolved[0] && sfMatchesResolved[0].status === 'played' ? getLoser(sfMatchesResolved[0]) : 'Perdedor Semi 1';
      const t2 = sfMatchesResolved[1] && sfMatchesResolved[1].status === 'played' ? getLoser(sfMatchesResolved[1]) : 'Perdedor Semi 2';
      return {
        ...m,
        equipo1: t1,
        equipo2: t2
      };
    });

    // Final
    resolved.F = bracket.F.map((m) => {
      const t1 = sfMatchesResolved[0] && sfMatchesResolved[0].status === 'played' ? getMatchWinner(sfMatchesResolved[0]) : 'Ganador Semi 1';
      const t2 = sfMatchesResolved[1] && sfMatchesResolved[1].status === 'played' ? getMatchWinner(sfMatchesResolved[1]) : 'Ganador Semi 2';
      return {
        ...m,
        equipo1: t1,
        equipo2: t2
      };
    });

    return resolved;
  };

  const resolvedBracket = getResolvedBracket();

  // 7. Actions / State Modifiers
  
  // Edit group stage match result
  const updateMatchScore = (
    matchId: string, 
    res1: number | null, 
    res2: number | null, 
    scorers1: string[] = [], 
    scorers2: string[] = []
  ) => {
    // Update match score
    setMatches(prev => prev.map(m => {
      if (m.id === matchId) {
        const isPlayed = res1 !== null && res2 !== null;
        return {
          ...m,
          res1,
          res2,
          status: isPlayed ? 'played' : 'pending',
          scorers1,
          scorers2
        };
      }
      return m;
    }));

    // Update custom scorers list
    const match = matches.find(m => m.id === matchId);
    if (match) {
      const team1 = match.equipo1;
      const team2 = match.equipo2;

      setCustomScorers(prev => {
        // Count goals for team 1 scorers
        const countGoals = (list: string[]) => {
          const counts: Record<string, number> = {};
          list.forEach(p => { counts[p] = (counts[p] || 0) + 1; });
          return counts;
        };

        const t1Counts = countGoals(scorers1);
        const t2Counts = countGoals(scorers2);

        // Map scorers under team name and filter out previous ones
        const cleaned: Record<string, any[]> = {};
        Object.keys(prev).forEach(team => {
          cleaned[team] = prev[team].filter((s: any) => s.matchId !== matchId);
        });

        // Now add new ones
        Object.keys(t1Counts).forEach(pname => {
          if (!cleaned[team1]) cleaned[team1] = [];
          cleaned[team1].push({ nombre: pname, goles: t1Counts[pname], matchId });
        });

        Object.keys(t2Counts).forEach(pname => {
          if (!cleaned[team2]) cleaned[team2] = [];
          cleaned[team2].push({ nombre: pname, goles: t2Counts[pname], matchId });
        });

        return cleaned;
      });
    }
  };

  // Edit bracket match result
  const updateBracketMatchScore = (
    phase: string,
    matchId: string,
    res1: number | null,
    res2: number | null,
    goles1: number | null = null, // penalties or extra goals
    goles2: number | null = null,
    scorers1: string[] = [],
    scorers2: string[] = []
  ) => {
    setBracket(prev => {
      const next = { ...prev };
      next[phase] = prev[phase].map(m => {
        if (m.id === matchId) {
          const isPlayed = res1 !== null && res2 !== null;
          return {
            ...m,
            res1,
            res2,
            goles1,
            goles2,
            status: isPlayed ? 'played' : 'pending',
            scorers1,
            scorers2
          };
        }
        return m;
      });
      return next;
    });

    // Also update scorers for bracket matches if they exist
    const match = resolvedBracket[phase]?.find(m => m.id === matchId);
    if (match) {
      const team1 = match.equipo1;
      const team2 = match.equipo2;

      setCustomScorers(prev => {
        const cleaned: Record<string, any[]> = {};
        Object.keys(prev).forEach(team => {
          cleaned[team] = prev[team].filter((s: any) => s.matchId !== matchId);
        });

        // Count goals
        const countGoals = (list: string[]) => {
          const counts: Record<string, number> = {};
          list.forEach(p => { counts[p] = (counts[p] || 0) + 1; });
          return counts;
        };

        const t1Counts = countGoals(scorers1);
        Object.keys(t1Counts).forEach(pname => {
          if (team1 && !team1.startsWith('Ganador') && !team1.startsWith('Perdedor')) {
            if (!cleaned[team1]) cleaned[team1] = [];
            cleaned[team1].push({ nombre: pname, goles: t1Counts[pname], matchId });
          }
        });

        const t2Counts = countGoals(scorers2);
        Object.keys(t2Counts).forEach(pname => {
          if (team2 && !team2.startsWith('Ganador') && !team2.startsWith('Perdedor')) {
            if (!cleaned[team2]) cleaned[team2] = [];
            cleaned[team2].push({ nombre: pname, goles: t2Counts[pname], matchId });
          }
        });

        return cleaned;
      });
    }
  };

  // Select third place team for a R32 placeholder slot
  const selectThirdPlaceTeamForSlot = (slotPlaceholder: string, teamName: string) => {
    setThirdPlaceSelections(prev => ({
      ...prev,
      [slotPlaceholder]: teamName
    }));
  };

  const updatePlayer = (
    teamName: string,
    dorsal: number,
    newName: string,
    newFoto: string,
    newPosicion?: Player['posicion']
  ) => {
    setRosters(prev => {
      const squad = prev[teamName] || [];
      const updated = squad.map(p =>
        p.dorsal === dorsal
          ? { ...p, nombre: newName, foto: newFoto, posicion: newPosicion }
          : p
      );
      return {
        ...prev,
        [teamName]: updated
      };
    });
  };

  return {
    matches,
    bracket: resolvedBracket,
    groupStandings,
    bestThirds,
    qualifiedThirds,
    rosters,
    scorers: scorersData,
    thirdPlaceSelections,
    getAvailableThirdsForSlot,
    updateMatchScore,
    updateBracketMatchScore,
    selectThirdPlaceTeamForSlot,
    resetToInitial,
    errorCorrectionMode,
    setErrorCorrectionMode,
    updatePlayer
  };
}
