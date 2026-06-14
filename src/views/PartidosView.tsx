import React, { useState } from 'react';
import type { Match, BracketMatch, Player } from '../types';
import { Flag } from '../components/Flag';
import { Plus, Trash2, CheckCircle2, ShieldAlert } from 'lucide-react';

interface PartidosViewProps {
  matches: Match[];
  rosters: Record<string, Player[]>;
  updateMatchScore: (
    matchId: string,
    res1: number | null,
    res2: number | null,
    scorers1: string[],
    scorers2: string[]
  ) => void;
  errorCorrectionMode: boolean;
  bracket?: Record<string, BracketMatch[]>;
  updateBracketMatchScore?: (
    phase: string,
    matchId: string,
    res1: number | null,
    res2: number | null,
    goles1: number | null,
    goles2: number | null,
    scorers1: string[],
    scorers2: string[]
  ) => void;
}

export const PartidosView: React.FC<PartidosViewProps> = ({
  matches,
  rosters,
  updateMatchScore,
  errorCorrectionMode,
  bracket,
  updateBracketMatchScore
}) => {
  const [activeJornada, setActiveJornada] = useState<string>('J1');
  
  // Track inputs locally per match so changes aren't validated until the button is clicked
  const [localScores, setLocalScores] = useState<Record<string, { res1: string; res2: string; goles1?: string; goles2?: string }>>({});
  const [localScorers1, setLocalScorers1] = useState<Record<string, string[]>>({});
  const [localScorers2, setLocalScorers2] = useState<Record<string, string[]>>({});
  const [editingScorersFor, setEditingScorersFor] = useState<{ matchId: string; team: 1 | 2 } | null>(null);

  // Initialize local state for a match if not done yet
  const initMatchState = (match: Match | BracketMatch) => {
    if (localScores[match.id] === undefined) {
      const bm = match as BracketMatch;
      setLocalScores((prev) => ({
        ...prev,
        [match.id]: {
          res1: match.res1 !== null ? String(match.res1) : '',
          res2: match.res2 !== null ? String(match.res2) : '',
          goles1: bm.goles1 !== null ? String(bm.goles1) : '',
          goles2: bm.goles2 !== null ? String(bm.goles2) : ''
        }
      }));
      setLocalScorers1((prev) => ({
        ...prev,
        [match.id]: match.scorers1 || []
      }));
      setLocalScorers2((prev) => ({
        ...prev,
        [match.id]: match.scorers2 || []
      }));
    }
  };

  const handleScoreChange = (matchId: string, team: 1 | 2, value: string) => {
    // Only allow digits or empty string
    const cleaned = value.replace(/\D/g, '');
    setLocalScores((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [team === 1 ? 'res1' : 'res2']: cleaned
      }
    }));
  };

  const handlePensChange = (matchId: string, team: 1 | 2, value: string) => {
    const cleaned = value.replace(/\D/g, '');
    setLocalScores((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [team === 1 ? 'goles1' : 'goles2']: cleaned
      }
    }));
  };

  const addScorer = (matchId: string, team: 1 | 2, playerName: string) => {
    if (team === 1) {
      setLocalScorers1((prev) => ({
        ...prev,
        [matchId]: [...(prev[matchId] || []), playerName]
      }));
    } else {
      setLocalScorers2((prev) => ({
        ...prev,
        [matchId]: [...(prev[matchId] || []), playerName]
      }));
    }
    setEditingScorersFor(null);
  };

  const removeScorer = (matchId: string, team: 1 | 2, index: number) => {
    if (team === 1) {
      setLocalScorers1((prev) => ({
        ...prev,
        [matchId]: (prev[matchId] || []).filter((_, i) => i !== index)
      }));
    } else {
      setLocalScorers2((prev) => ({
        ...prev,
        [matchId]: (prev[matchId] || []).filter((_, i) => i !== index)
      }));
    }
  };

  const handleValidate = (match: Match) => {
    const scoreState = localScores[match.id] || { res1: '', res2: '' };
    const s1 = localScorers1[match.id] || [];
    const s2 = localScorers2[match.id] || [];

    if (scoreState.res1 === '' || scoreState.res2 === '') {
      alert('Por favor, introduce los goles de ambos equipos para validar el partido.');
      return;
    }

    const r1 = parseInt(scoreState.res1);
    const r2 = parseInt(scoreState.res2);

    if (s1.length > r1) {
      alert(`Has asignado ${s1.length} goleadores para ${match.equipo1}, pero solo anotaron ${r1} goles.`);
      return;
    }
    if (s2.length > r2) {
      alert(`Has asignado ${s2.length} goleadores para ${match.equipo2}, pero solo anotaron ${r2} goles.`);
      return;
    }

    // Auto-fill unnamed scorers if they did not specify all scorers
    const finalScorers1 = [...s1];
    while (finalScorers1.length < r1) {
      finalScorers1.push("GOLEADOR DESCONOCIDO");
    }

    const finalScorers2 = [...s2];
    while (finalScorers2.length < r2) {
      finalScorers2.push("GOLEADOR DESCONOCIDO");
    }

    updateMatchScore(match.id, r1, r2, finalScorers1, finalScorers2);
    
    setLocalScorers1(prev => ({ ...prev, [match.id]: finalScorers1 }));
    setLocalScorers2(prev => ({ ...prev, [match.id]: finalScorers2 }));

    alert('Partido validado con éxito. Clasificaciones y goleadores actualizados.');
  };

  const handleValidateBracket = (m: BracketMatch, phase: string) => {
    const scoreState = localScores[m.id] || { res1: '', res2: '', goles1: '', goles2: '' };
    const s1 = localScorers1[m.id] || [];
    const s2 = localScorers2[m.id] || [];

    if (scoreState.res1 === '' || scoreState.res2 === '') {
      alert('Por favor, introduce los goles de ambos equipos para validar.');
      return;
    }

    const r1 = parseInt(scoreState.res1);
    const r2 = parseInt(scoreState.res2);
    let p1: number | null = null;
    let p2: number | null = null;

    if (r1 === r2) {
      if (!scoreState.goles1 || !scoreState.goles2) {
        alert('En las eliminatorias debe haber un ganador. Introduce el resultado de la prórroga / penaltis.');
        return;
      }
      p1 = parseInt(scoreState.goles1);
      p2 = parseInt(scoreState.goles2);
      if (p1 === p2) {
        alert('El resultado de la prórroga / penaltis no puede ser un empate.');
        return;
      }
    }

    if (s1.length > r1) {
      alert(`Has asignado ${s1.length} goleadores para ${m.equipo1}, pero solo anotaron ${r1} goles.`);
      return;
    }
    if (s2.length > r2) {
      alert(`Has asignado ${s2.length} goleadores para ${m.equipo2}, pero solo anotaron ${r2} goles.`);
      return;
    }

    const finalScorers1 = [...s1];
    while (finalScorers1.length < r1) {
      finalScorers1.push("GOLEADOR DESCONOCIDO");
    }

    const finalScorers2 = [...s2];
    while (finalScorers2.length < r2) {
      finalScorers2.push("GOLEADOR DESCONOCIDO");
    }

    if (updateBracketMatchScore) {
      updateBracketMatchScore(phase, m.id, r1, r2, p1, p2, finalScorers1, finalScorers2);
      
      setLocalScorers1(prev => ({ ...prev, [m.id]: finalScorers1 }));
      setLocalScorers2(prev => ({ ...prev, [m.id]: finalScorers2 }));

      alert('Partido de eliminatoria validado con éxito. Ganador propagado a la siguiente ronda.');
    }
  };

  const getPhaseKey = (jornada: string): string | null => {
    switch (jornada) {
      case 'Dieciseisavos': return 'R32';
      case 'Octavos': return 'R16';
      case 'Cuartos': return 'QF';
      case 'Semifinales': return 'SF';
      case '3er puesto': return 'TP';
      case 'Final': return 'F';
      default: return null;
    }
  };

  const getPhaseLabel = (jornada: string): string => {
    switch (jornada) {
      case 'Dieciseisavos': return 'Dieciseisavos (1/16)';
      case 'Octavos': return 'Octavos de Final';
      case 'Cuartos': return 'Cuartos de Final';
      case 'Semifinales': return 'Semifinal';
      case '3er puesto': return 'Tercer Puesto';
      case 'Final': return 'Final';
      default: return 'Fase de Grupos';
    }
  };

  const tabsList = ['J1', 'J2', 'J3', 'Dieciseisavos', 'Octavos', 'Cuartos', 'Semifinales', '3er puesto', 'Final'];

  const phaseKey = getPhaseKey(activeJornada);
  const currentMatches = phaseKey 
    ? (bracket ? bracket[phaseKey] || [] : [])
    : matches.filter((m) => m.jornada === activeJornada);

  return (
    <div className="partidos-container">

      {/* Tab Controls for Jornadas */}
      <div className="jornadas-tabs-row">
        <div className="jornadas-tabs">
          {tabsList.map((j) => (
            <button
              key={j}
              onClick={() => setActiveJornada(j)}
              className={`jornada-tab-btn ${
                activeJornada === j ? 'active' : 'inactive'
              }`}
            >
              {j.startsWith('J') ? `Jornada ${j.replace('J', '')}` : j}
            </button>
          ))}
        </div>
        <span className="matches-count-badge">
          {currentMatches.length} Partidos
        </span>
      </div>

      {/* Matches List */}
      <div className="matches-editor-grid">
        {currentMatches.map((m) => {
          initMatchState(m);
          const scoreState = localScores[m.id] || { res1: '', res2: '', goles1: '', goles2: '' };
          const mScorers1 = localScorers1[m.id] || [];
          const mScorers2 = localScorers2[m.id] || [];
          const isSpain = m.equipo1 === 'ESPAÑA' || m.equipo2 === 'ESPAÑA';
          const isLocked = m.status === 'played' && !errorCorrectionMode;

          // Check if playable (not a bracket placeholder)
          const isPlayable = phaseKey 
            ? !!(m.equipo1 && m.equipo2 && !m.equipo1.startsWith('Ganador') && !m.equipo1.startsWith('Perdedor') && !m.equipo2.startsWith('Ganador') && !m.equipo2.startsWith('Perdedor') && !m.equipo1.startsWith('3') && !m.equipo2.startsWith('3'))
            : true;

          return (
            <div
              key={m.id}
              className={`match-editor-card ${
                isSpain ? 'spain-highlight' : ''
              } ${isLocked ? 'locked' : ''}`}
            >
              {/* Match Info Header */}
              <div className="match-editor-header">
                <div className="flex items-center gap-2">
                  <span className="group-badge">
                    {phaseKey ? getPhaseLabel(activeJornada) : `Grupo ${(m as Match).grupo}`}
                  </span>
                  <span>•</span>
                  <span className="match-time">
                    {m.fecha} ({m.dia}) — {m.horario}
                  </span>
                </div>
                <div className="match-editor-status">
                  <span className="tv-badge">
                    TV: {m.tv}
                  </span>
                  {m.status === 'played' && (
                    <span className="validated-badge">
                      <CheckCircle2 className="w-3 h-3" /> VALIDADO
                    </span>
                  )}
                </div>
              </div>

              {/* Main Score Editor Row */}
              <div className="match-editor-teams">
                {/* Team 1 */}
                <div className="match-editor-team team1">
                  <span className="team-name">
                    {m.equipo1 || 'TBD'}
                  </span>
                  <Flag team={m.equipo1 || ''} className="w-8 h-5 rounded shadow" />
                </div>

                {/* Score Inputs */}
                <div className="score-inputs-wrapper flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={2}
                      value={scoreState.res1}
                      onChange={(e) => handleScoreChange(m.id, 1, e.target.value)}
                      disabled={isLocked || !isPlayable}
                      className="input-score"
                      placeholder="-"
                    />
                    <span className="vs-divider">VS</span>
                    <input
                      type="text"
                      maxLength={2}
                      value={scoreState.res2}
                      onChange={(e) => handleScoreChange(m.id, 2, e.target.value)}
                      disabled={isLocked || !isPlayable}
                      className="input-score"
                      placeholder="-"
                    />
                  </div>
                </div>

                {/* Team 2 */}
                <div className="match-editor-team team2">
                  <Flag team={m.equipo2 || ''} className="w-8 h-5 rounded shadow" />
                  <span className="team-name">
                    {m.equipo2 || 'TBD'}
                  </span>
                </div>
              </div>

              {/* Penalties inputs under scores for bracket matches when drawn */}
              {phaseKey && isPlayable && scoreState.res1 !== '' && scoreState.res2 !== '' && parseInt(scoreState.res1) === parseInt(scoreState.res2) && (
                <div className="flex flex-col gap-2 border-t border-white/5 pt-3 animate-fade-in text-center w-full mt-2">
                  <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider">
                    Desempate (Prórroga / Penaltis)
                  </span>
                  <div className="flex items-center justify-center gap-3">
                    <input
                      type="text"
                      maxLength={2}
                      value={scoreState.goles1 || ''}
                      onChange={(e) => handlePensChange(m.id, 1, e.target.value)}
                      disabled={isLocked}
                      className="w-12 h-10 text-center rounded-lg bg-black/40 border border-yellow-500/20 text-sm font-bold text-yellow-400"
                      placeholder="Pens 1"
                    />
                    <span className="text-xs text-gray-500 font-bold">-</span>
                    <input
                      type="text"
                      maxLength={2}
                      value={scoreState.goles2 || ''}
                      onChange={(e) => handlePensChange(m.id, 2, e.target.value)}
                      disabled={isLocked}
                      className="w-12 h-10 text-center rounded-lg bg-black/40 border border-yellow-500/20 text-sm font-bold text-yellow-400"
                      placeholder="Pens 2"
                    />
                  </div>
                </div>
              )}

              {/* Locked/Playable message */}
              {!isPlayable && (
                <div className="text-center text-xs text-gray-400 bg-white/5 p-3 rounded-xl border border-white/5">
                  Esperando a que se decidan los equipos clasificados.
                </div>
              )}

              {/* Scorers Section */}
              {isPlayable && (
                <div className="match-scorers-grid">
                  {/* Team 1 Scorers */}
                  <div className="team-scorers-col team1">
                    <div className="header-actions">
                      {!isLocked && scoreState.res1 && parseInt(scoreState.res1) > mScorers1.length && (
                        <button
                          onClick={() => setEditingScorersFor({ matchId: m.id, team: 1 })}
                          className="add-scorer-btn"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="scorers-tags-list">
                      {mScorers1.map((name, idx) => {
                        const isOwnGoal = name.endsWith('(A.G.)');
                        const displayName = name.replace(' (A.G.)', '');
                        return (
                          <span
                            key={idx}
                            className={`scorer-tag ${
                              isOwnGoal ? 'own-goal-tag' : ''
                            }`}
                          >
                            {displayName} {isOwnGoal && <span className="text-[9px] font-bold text-red-400 uppercase">(Autogol)</span>}
                            {!isLocked && (
                              <button
                                onClick={() => removeScorer(m.id, 1, idx)}
                                className="remove-scorer-btn"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Team 2 Scorers */}
                  <div className="team-scorers-col team2">
                    <div className="header-actions">
                      {!isLocked && scoreState.res2 && parseInt(scoreState.res2) > mScorers2.length && (
                        <button
                          onClick={() => setEditingScorersFor({ matchId: m.id, team: 2 })}
                          className="add-scorer-btn"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="scorers-tags-list">
                      {mScorers2.map((name, idx) => {
                        const isOwnGoal = name.endsWith('(A.G.)');
                        const displayName = name.replace(' (A.G.)', '');
                        return (
                          <span
                            key={idx}
                            className={`scorer-tag ${
                              isOwnGoal ? 'own-goal-tag' : ''
                            }`}
                          >
                            {displayName} {isOwnGoal && <span className="text-[9px] font-bold text-red-400 uppercase">(Autogol)</span>}
                            {!isLocked && (
                              <button
                                onClick={() => removeScorer(m.id, 2, idx)}
                                className="remove-scorer-btn"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Validate button */}
              {!isLocked && isPlayable && (
                <button
                  onClick={() => {
                    if (phaseKey) {
                      handleValidateBracket(m as BracketMatch, phaseKey);
                    } else {
                      handleValidate(m as Match);
                    }
                  }}
                  className={`validate-btn ${
                    isSpain ? 'spain-btn' : 'normal-btn'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" /> VALIDAR PARTIDO
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Scorers Selection Modal (Supports both standard players & Own Goals) */}
      {editingScorersFor && (
        <div className="modal-overlay" onClick={() => setEditingScorersFor(null)}>
          <div
            className="modal-content p-6 animate-fade-in text-left max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
              <h3 className="font-heading text-base font-bold">
                Asignar Goleador
              </h3>
              <button
                onClick={() => setEditingScorersFor(null)}
                className="text-gray-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-1">
              {(() => {
                let match: Match | BracketMatch | undefined;
                if (phaseKey) {
                  match = bracket?.[phaseKey]?.find((item) => item.id === editingScorersFor.matchId);
                } else {
                  match = matches.find((item) => item.id === editingScorersFor.matchId);
                }
                if (!match) return null;
                const team1 = match.equipo1 || 'TBD';
                const team2 = match.equipo2 || 'TBD';
                
                const teamName = editingScorersFor.team === 1 ? team1 : team2;
                const oppName = editingScorersFor.team === 1 ? team2 : team1;

                const squad = rosters[teamName] || [];
                const oppSquad = rosters[oppName] || [];

                return (
                  <>
                    {/* Normal Scorer List */}
                    <div className="text-xs text-gray-400 font-bold mb-1 flex items-center gap-1.5 uppercase tracking-wide">
                      <Flag team={teamName} className="w-4 h-3" />
                      Goleadores de {teamName}
                    </div>
                    
                    <div className="flex flex-col gap-1.5 mb-2">
                      {squad.map((p) => (
                        <button
                          key={p.dorsal}
                          onClick={() => addScorer(editingScorersFor.matchId, editingScorersFor.team, p.nombre)}
                          className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-indigo-500/10 hover:border-indigo-500/30 text-xs font-semibold text-left text-white flex items-center justify-between transition-all"
                        >
                          <span>{p.nombre}</span>
                          <span className="text-[10px] text-gray-400 font-heading">#{p.dorsal}</span>
                        </button>
                      ))}
                    </div>

                    {/* Own Goals Section */}
                    <div className="text-xs text-red-400 font-bold border-t border-white/5 pt-3 mb-1 flex items-center gap-1.5 uppercase tracking-wide">
                      <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                      Autogol de {oppName}
                    </div>

                    <div className="flex flex-col gap-1.5 mb-2">
                      {oppSquad.map((p) => (
                        <button
                          key={p.dorsal}
                          onClick={() => addScorer(editingScorersFor.matchId, editingScorersFor.team, p.nombre + ' (A.G.)')}
                          className="p-2.5 rounded-xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/15 hover:border-red-500/30 text-xs font-semibold text-left text-red-300 flex items-center justify-between transition-all"
                        >
                          <span>{p.nombre} (AUTOGOL)</span>
                          <span className="text-[10px] text-red-400/70 font-heading">#{p.dorsal}</span>
                        </button>
                      ))}
                    </div>

                    {/* Alternative Custom Scorer input */}
                    <div className="border-t border-white/5 pt-3 mt-1">
                      <input
                        type="text"
                        placeholder="Nombre de goleador alternativo..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            addScorer(
                              editingScorersFor.matchId,
                              editingScorersFor.team,
                              e.currentTarget.value.trim().toUpperCase()
                            );
                            e.currentTarget.value = '';
                          }
                        }}
                        className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-gray-500"
                      />
                      <span className="text-[9px] text-gray-500 mt-1 block">Presiona Enter para añadir</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default PartidosView;
