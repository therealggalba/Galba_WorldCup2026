import { useState, useEffect, useRef } from 'react';
import type { Match, BracketMatch, Standing, GroupStandings, Player, Scorer } from '../types';
import initialDataRaw from '../../world_cup_data.json';
import { competitionRepository } from '../infrastructure/competitionRepository';

// Parse raw data from JSON
const initialData = (initialDataRaw as unknown) as {
  groups: Record<string, { pos: number; team: string; pts: number; gf: number; gc: number; dg: number }[]>;
  matches: Match[];
  bracket: Record<string, BracketMatch[]>;
  rosters: Record<string, Player[]>;
  initial_team_scorers: Record<string, { nombre: string; goles: number }[]>;
};

const sanitizeBracket = (loadedBracket: any): Record<string, BracketMatch[]> => {
  if (!loadedBracket) return initialData.bracket;
  const sortedBracket: any = {};
  Object.keys(initialData.bracket).forEach((phase) => {
    const initialMatches = (initialData.bracket as any)[phase];
    const loadedMatches = loadedBracket[phase] || [];
    sortedBracket[phase] = initialMatches.map((initM: any) => {
      const found = loadedMatches.find((m: any) => m.id === initM.id);
      return found ? { ...initM, ...found } : initM;
    });
  });
  return sortedBracket;
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
  const [rosters, setRosters] = useState<Record<string, Player[]>>({});
  const [customScorers, setCustomScorers] = useState<Record<string, Scorer[]>>({});
  const [errorCorrectionMode, setErrorCorrectionMode] = useState<boolean>(false);
  
  // Loading and saving states
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<boolean>(false);
  const isFirstRender = useRef(true);

  // 1. Load state from Supabase on init (with automatic localStorage migration and fallback)
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    competitionRepository.getCompetitionState('worldcup2026', initialData)
      .then(async (state) => {
        if (!isMounted) return;

        let finalState = state;
        const localSaved = localStorage.getItem('world_cup_2026_state');

        if (localSaved) {
          try {
            const parsed = JSON.parse(localSaved);
            const matchesWithScores = parsed.matches ? parsed.matches.filter((m: any) => m.res1 !== null || m.res2 !== null) : [];
            const dbMatchesWithScores = state.matches ? state.matches.filter((m: any) => m.res1 !== null || m.res2 !== null) : [];

            // If local storage has results but DB does not, migrate local storage to DB
            if (matchesWithScores.length > 0 && dbMatchesWithScores.length === 0) {
              console.log('Migrating local storage tournament state to Supabase...');
              const localRosters = localStorage.getItem('world_cup_2026_state_rosters');
              const localError = localStorage.getItem('world_cup_2026_state_error_correction') === 'true';

              finalState = {
                matches: parsed.matches || state.matches,
                bracket: parsed.bracket || state.bracket,
                third_place_selections: parsed.thirdPlaceSelections || state.third_place_selections,
                custom_scorers: parsed.customScorers || state.custom_scorers,
                rosters: localRosters ? JSON.parse(localRosters) : state.rosters,
                error_correction_mode: localError
              };

              // Perform immediate sync to Supabase
              await competitionRepository.updateCompetitionState('worldcup2026', finalState);
            }
          } catch (e) {
            console.error('Failed to parse or migrate local storage state:', e);
          }
        }

        setMatches(finalState.matches);
        setBracket(sanitizeBracket(finalState.bracket));
        setThirdPlaceSelections(finalState.third_place_selections);
        setCustomScorers(finalState.custom_scorers);
        setRosters(finalState.rosters);
        setErrorCorrectionMode(finalState.error_correction_mode);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading state from Supabase, attempting localStorage fallback:', err);
        if (!isMounted) return;

        // Try falling back to localStorage to prevent data loss
        const localSaved = localStorage.getItem('world_cup_2026_state');
        if (localSaved) {
          try {
            const parsed = JSON.parse(localSaved);
            const localRosters = localStorage.getItem('world_cup_2026_state_rosters');
            const localError = localStorage.getItem('world_cup_2026_state_error_correction') === 'true';

            setMatches(parsed.matches || initialData.matches);
            setBracket(sanitizeBracket(parsed.bracket));
            setThirdPlaceSelections(parsed.thirdPlaceSelections || {});
            setCustomScorers(parsed.customScorers || {});
            setRosters(localRosters ? JSON.parse(localRosters) : initialData.rosters);
            setErrorCorrectionMode(localError);
            setLoading(false);
            return;
          } catch (e) {
            console.error('Failed to load fallback localStorage state:', e);
          }
        }

        // Final fallback to initial data
        setMatches(initialData.matches);
        setBracket(sanitizeBracket(initialData.bracket));
        setThirdPlaceSelections({});
        setCustomScorers({});
        setRosters(initialData.rosters);
        setErrorCorrectionMode(false);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Save state to Supabase whenever it changes (Debounced)
  useEffect(() => {
    if (loading) return;
    
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const saveState = async () => {
      setSaving(true);
      setSyncError(false);
      try {
        await competitionRepository.updateCompetitionState('worldcup2026', {
          matches,
          bracket,
          third_place_selections: thirdPlaceSelections,
          custom_scorers: customScorers,
          rosters,
          error_correction_mode: errorCorrectionMode
        });
      } catch (err) {
        console.error('Error updating state in Supabase:', err);
        setSyncError(true);
      } finally {
        setSaving(false);
        // Write to localStorage as backup/fallback in all cases so the user never loses data!
        try {
          const stateToSave = {
            matches,
            bracket,
            thirdPlaceSelections,
            customScorers
          };
          localStorage.setItem('world_cup_2026_state', JSON.stringify(stateToSave));
          localStorage.setItem('world_cup_2026_state_rosters', JSON.stringify(rosters));
          localStorage.setItem('world_cup_2026_state_error_correction', String(errorCorrectionMode));
        } catch (e) {
          console.error('Failed to save backup to localStorage:', e);
        }
      }
    };

    const timer = setTimeout(saveState, 800);
    return () => clearTimeout(timer);
  }, [matches, bracket, thirdPlaceSelections, customScorers, rosters, errorCorrectionMode, loading]);

  // Reset function to revert to Excel starting point in Supabase
  const resetToInitial = async () => {
    setSaving(true);
    setSyncError(false);
    try {
      const state = await competitionRepository.resetCompetitionState('worldcup2026', initialData);
      setMatches(state.matches);
      setBracket(sanitizeBracket(state.bracket));
      setThirdPlaceSelections(state.third_place_selections);
      setCustomScorers(state.custom_scorers);
      setRosters(state.rosters);
      setErrorCorrectionMode(state.error_correction_mode);

      // Also reset localStorage
      localStorage.removeItem('world_cup_2026_state');
      localStorage.removeItem('world_cup_2026_state_rosters');
      localStorage.removeItem('world_cup_2026_state_error_correction');
    } catch (err) {
      console.error('Error resetting state in Supabase:', err);
      setSyncError(true);
      // Fallback reset for local data even if DB reset fails
      setMatches(initialData.matches);
      setBracket(sanitizeBracket(initialData.bracket));
      setThirdPlaceSelections({});
      setCustomScorers({});
      setRosters(initialData.rosters);
      setErrorCorrectionMode(false);
      localStorage.removeItem('world_cup_2026_state');
      localStorage.removeItem('world_cup_2026_state_rosters');
      localStorage.removeItem('world_cup_2026_state_error_correction');
    } finally {
      setSaving(false);
    }
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
    // Order matches the top-to-bottom layout of the images
    resolved.R16 = bracket.R16.map((m, idx) => {
      const r32Matches = resolved.R32;
      const idx1 = idx * 2;
      const idx2 = idx * 2 + 1;
      const t1 = r32Matches[idx1] && r32Matches[idx1].status === 'played' ? getMatchWinner(r32Matches[idx1]) : `G. 1/16 ${idx1 + 1}`;
      const t2 = r32Matches[idx2] && r32Matches[idx2].status === 'played' ? getMatchWinner(r32Matches[idx2]) : `G. 1/16 ${idx2 + 1}`;
      return {
        ...m,
        equipo1: t1,
        equipo2: t2
      };
    });

    // Quarterfinals (QF)
    // Order matches the top-to-bottom layout of the images
    const r16IndexToNum = [1, 2, 5, 6, 3, 4, 7, 8];

    resolved.QF = bracket.QF.map((m, idx) => {
      const r16Matches = resolved.R16;
      const idx1 = idx * 2;
      const idx2 = idx * 2 + 1;
      const t1 = r16Matches[idx1] && r16Matches[idx1].status === 'played' ? getMatchWinner(r16Matches[idx1]) : `G. octavos ${r16IndexToNum[idx1]}`;
      const t2 = r16Matches[idx2] && r16Matches[idx2].status === 'played' ? getMatchWinner(r16Matches[idx2]) : `G. octavos ${r16IndexToNum[idx2]}`;
      return {
        ...m,
        equipo1: t1,
        equipo2: t2
      };
    });

    // Semifinals (SF)
    resolved.SF = bracket.SF.map((m, idx) => {
      const qfMatches = resolved.QF;
      const idx1 = idx * 2;
      const idx2 = idx * 2 + 1;
      const t1 = qfMatches[idx1] && qfMatches[idx1].status === 'played' ? getMatchWinner(qfMatches[idx1]) : `G. cuartos ${idx1 + 1}`;
      const t2 = qfMatches[idx2] && qfMatches[idx2].status === 'played' ? getMatchWinner(qfMatches[idx2]) : `G. cuartos ${idx2 + 1}`;
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
      const t1 = sfMatchesResolved[0] && sfMatchesResolved[0].status === 'played' ? getLoser(sfMatchesResolved[0]) : 'P. semifinal 1';
      const t2 = sfMatchesResolved[1] && sfMatchesResolved[1].status === 'played' ? getLoser(sfMatchesResolved[1]) : 'P. semifinal 2';
      return {
        ...m,
        equipo1: t1,
        equipo2: t2
      };
    });

    // Final
    resolved.F = bracket.F.map((m) => {
      const t1 = sfMatchesResolved[0] && sfMatchesResolved[0].status === 'played' ? getMatchWinner(sfMatchesResolved[0]) : 'G. semifinal 1';
      const t2 = sfMatchesResolved[1] && sfMatchesResolved[1].status === 'played' ? getMatchWinner(sfMatchesResolved[1]) : 'G. semifinal 2';
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
    updatePlayer,
    loading,
    saving,
    syncError
  };
}
