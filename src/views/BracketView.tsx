import React, { useState } from 'react';
import type { BracketMatch, Player, Standing } from '../types';
import { Flag } from '../components/Flag';
import { CheckCircle2, Award, Plus, ShieldAlert } from 'lucide-react';

interface BracketViewProps {
  bracket: Record<string, BracketMatch[]>;
  rosters: Record<string, Player[]>;
  getAvailableThirdsForSlot: (slotPlaceholder: string) => (Standing & { group: string })[];
  selectThirdPlaceTeamForSlot: (slotPlaceholder: string, teamName: string) => void;
  updateBracketMatchScore: (
    phase: string,
    matchId: string,
    res1: number | null,
    res2: number | null,
    goles1: number | null,
    goles2: number | null,
    scorers1: string[],
    scorers2: string[]
  ) => void;
  errorCorrectionMode: boolean;
}

export const BracketView: React.FC<BracketViewProps> = ({
  bracket,
  rosters,
  getAvailableThirdsForSlot,
  selectThirdPlaceTeamForSlot,
  updateBracketMatchScore,
  errorCorrectionMode
}) => {
  const [selectedMatch, setSelectedMatch] = useState<{ phase: string; match: BracketMatch } | null>(null);
  const [localRes1, setLocalRes1] = useState('');
  const [localRes2, setLocalRes2] = useState('');
  const [localPens1, setLocalPens1] = useState('');
  const [localPens2, setLocalPens2] = useState('');
  const [localScorers1, setLocalScorers1] = useState<string[]>([]);
  const [localScorers2, setLocalScorers2] = useState<string[]>([]);
  const [editingScorersForTeam, setEditingScorersForTeam] = useState<1 | 2 | null>(null);

  const openEditModal = (phase: string, match: BracketMatch) => {
    // Check if both teams are resolved (i.e. not empty placeholders)
    if (!match.equipo1 || !match.equipo2 || match.equipo1.startsWith('Ganador') || match.equipo1.startsWith('Perdedor') || match.equipo2.startsWith('Ganador') || match.equipo2.startsWith('Perdedor')) {
      alert('Los equipos para este enfrentamiento no se han decidido todavía.');
      return;
    }
    
    // Check if they are third place placeholders that haven't been selected
    if (match.equipo1.startsWith('3') || match.equipo2.startsWith('3')) {
      alert('Por favor, selecciona primero los terceros equipos de grupo clasificados.');
      return;
    }

    setSelectedMatch({ phase, match });
    setLocalRes1(match.res1 !== null ? String(match.res1) : '');
    setLocalRes2(match.res2 !== null ? String(match.res2) : '');
    setLocalPens1(match.goles1 !== null ? String(match.goles1) : '');
    setLocalPens2(match.goles2 !== null ? String(match.goles2) : '');
    setLocalScorers1(match.scorers1 || []);
    setLocalScorers2(match.scorers2 || []);
    setEditingScorersForTeam(null);
  };

  const handleValidate = () => {
    if (!selectedMatch) return;
    const { phase, match } = selectedMatch;

    if (localRes1 === '' || localRes2 === '') {
      alert('Por favor, introduce los goles de ambos equipos para validar.');
      return;
    }

    const r1 = parseInt(localRes1);
    const r2 = parseInt(localRes2);
    let p1: number | null = null;
    let p2: number | null = null;

    // In bracket matches, there MUST be a winner (cannot be a draw)
    if (r1 === r2) {
      if (localPens1 === '' || localPens2 === '') {
        alert('En las eliminatorias debe haber un ganador. Introduce el resultado de la prórroga / penaltis.');
        return;
      }
      p1 = parseInt(localPens1);
      p2 = parseInt(localPens2);
      if (p1 === p2) {
        alert('El resultado de la prórroga / penaltis no puede ser un empate.');
        return;
      }
    }

    // Goleadores validation
    if (localScorers1.length > r1) {
      alert(`Has asignado ${localScorers1.length} goleadores para ${match.equipo1}, pero solo anotaron ${r1} goles.`);
      return;
    }
    if (localScorers2.length > r2) {
      alert(`Has asignado ${localScorers2.length} goleadores para ${match.equipo2}, pero solo anotaron ${r2} goles.`);
      return;
    }

    // Auto-fill unnamed scorers
    const finalScorers1 = [...localScorers1];
    while (finalScorers1.length < r1) {
      finalScorers1.push("GOLEADOR DESCONOCIDO");
    }

    const finalScorers2 = [...localScorers2];
    while (finalScorers2.length < r2) {
      finalScorers2.push("GOLEADOR DESCONOCIDO");
    }

    updateBracketMatchScore(phase, match.id, r1, r2, p1, p2, finalScorers1, finalScorers2);
    setSelectedMatch(null);
    alert('Partido de eliminatoria validado. Ganador propagado a la siguiente ronda.');
  };

  const renderMatchCard = (phase: string, match: BracketMatch) => {
    const isSpain = match.equipo1 === 'ESPAÑA' || match.equipo2 === 'ESPAÑA';
    const isPlayed = match.status === 'played';
    
    // Determine if team 1 is placeholder
    const isEq1Placeholder = !!(match.equipo1 && (match.equipo1.startsWith('3') || match.equipo1.startsWith('Ganador') || match.equipo1.startsWith('Perdedor')));
    const isEq2Placeholder = !!(match.equipo2 && (match.equipo2.startsWith('3') || match.equipo2.startsWith('Ganador') || match.equipo2.startsWith('Perdedor')));

    return (
      <div
        key={match.id}
        onClick={() => openEditModal(phase, match)}
        className={`bracket-match-card ${
          isSpain ? 'spain-highlight' : ''
        } ${isPlayed ? 'played' : ''}`}
      >

        {/* Teams rows */}
        <div className="bracket-match-teams">
          {/* Team 1 */}
          <div className="bracket-match-team-row">
            <div className="bracket-match-team-left">
              <Flag team={match.equipo1 || ''} className="w-4 h-3" />
              {isEq1Placeholder && match.equipo1 && match.equipo1.startsWith('3') ? (
                // Third place select dropdown triggers
                <div onClick={(e) => e.stopPropagation()} className="relative">
                  <select
                    value={match.equipo1 || ''}
                    onChange={(e) => selectThirdPlaceTeamForSlot(match.equipo1 || '', e.target.value)}
                    className="select-third-team"
                  >
                    <option value={match.equipo1 || ''}>{match.equipo1}</option>
                    {getAvailableThirdsForSlot(match.equipo1 || '').map((t) => (
                      <option key={t.team} value={t.team}>
                        {t.team} (Gr. {t.group})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <span className={isEq1Placeholder ? 'placeholder-team' : (isPlayed && match.res1! > match.res2! ? 'winner-team-text' : 'team-name-text')}>
                  {match.equipo1}
                </span>
              )}
            </div>

            {/* Score */}
            <div className="bracket-match-team-right">
              {match.res1 !== null && (
                <span className="score-val">
                  {match.res1}
                </span>
              )}
              {match.goles1 !== null && (
                <span className="pens-val">
                  ({match.goles1})
                </span>
              )}
            </div>
          </div>

          {/* Team 2 */}
          <div className="bracket-match-team-row">
            <div className="bracket-match-team-left">
              <Flag team={match.equipo2 || ''} className="w-4 h-3" />
              {isEq2Placeholder && match.equipo2 && match.equipo2.startsWith('3') ? (
                // Third place select dropdown triggers
                <div onClick={(e) => e.stopPropagation()} className="relative">
                  <select
                    value={match.equipo2 || ''}
                    onChange={(e) => selectThirdPlaceTeamForSlot(match.equipo2 || '', e.target.value)}
                    className="select-third-team"
                  >
                    <option value={match.equipo2 || ''}>{match.equipo2}</option>
                    {getAvailableThirdsForSlot(match.equipo2 || '').map((t) => (
                      <option key={t.team} value={t.team}>
                        {t.team} (Gr. {t.group})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <span className={isEq2Placeholder ? 'placeholder-team' : (isPlayed && match.res2! > match.res1! ? 'winner-team-text' : 'team-name-text')}>
                  {match.equipo2}
                </span>
              )}
            </div>

            {/* Score */}
            <div className="bracket-match-team-right">
              {match.res2 !== null && (
                <span className="score-val">
                  {match.res2}
                </span>
              )}
              {match.goles2 !== null && (
                <span className="pens-val">
                  ({match.goles2})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const isLocked = selectedMatch?.match.status === 'played' && !errorCorrectionMode;

  return (
    <div className="bracket-view-container">
      {/* Bracket scroll container */}
      <div className="bracket-scroll-wrapper">
        
        {/* Dieciseisavos (R32) */}
        <div className="bracket-column">
          <div className="bracket-column-title">
            Dieciseisavos
          </div>
          <div className="bracket-matches-flex">
            {bracket.R32?.map((m) => renderMatchCard('R32', m))}
          </div>
        </div>

        {/* Octavos (R16) */}
        <div className="bracket-column">
          <div className="bracket-column-title">
            Octavos de Final
          </div>
          <div className="bracket-matches-flex">
            {bracket.R16?.map((m) => renderMatchCard('R16', m))}
          </div>
        </div>

        {/* Cuartos (QF) */}
        <div className="bracket-column">
          <div className="bracket-column-title">
            Cuartos de Final
          </div>
          <div className="bracket-matches-flex">
            {bracket.QF?.map((m) => renderMatchCard('QF', m))}
          </div>
        </div>

        {/* Semifinales (SF) */}
        <div className="bracket-column">
          <div className="bracket-column-title">
            Semifinales
          </div>
          <div className="bracket-matches-flex">
            {bracket.SF?.map((m) => renderMatchCard('SF', m))}
          </div>
        </div>

        {/* Final & 3rd Place */}
        <div className="bracket-column">
          <div className="bracket-matches-flex">
            <div>
              <div className="bracket-column-title">
                Tercer Puesto
              </div>
              {bracket.TP?.map((m) => renderMatchCard('TP', m))}
            </div>

            <div>
              <div className="bracket-column-title gold-title">
                <Award className="w-3 h-3" /> Gran Final
              </div>
              {bracket.F?.map((m) => renderMatchCard('F', m))}
            </div>
          </div>
        </div>

      </div>

      {/* MATCH EDITING MODAL */}
      {selectedMatch && (
        <div className="modal-overlay" onClick={() => setSelectedMatch(null)}>
          <div
            className="modal-content p-6 animate-fade-in text-left max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
              <div>
                <h3 className="font-heading text-lg font-bold">
                  Editar Eliminatoria
                </h3>
              </div>
              <button
                onClick={() => setSelectedMatch(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Score Inputs */}
            <div className="flex flex-col gap-5 py-2">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 flex items-center gap-2.5 text-left">
                  <Flag team={selectedMatch.match.equipo1 || ''} className="w-6 h-4" />
                  <span className="font-bold text-sm text-white truncate">{selectedMatch.match.equipo1 || ''}</span>
                </div>
                <input
                  type="text"
                  maxLength={2}
                  value={localRes1}
                  onChange={(e) => setLocalRes1(e.target.value.replace(/\D/g, ''))}
                  disabled={isLocked}
                  className={`input-score ${isLocked ? 'bg-black/40 border-white/5 text-gray-400 cursor-not-allowed' : ''}`}
                  placeholder="-"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 flex items-center gap-2.5 text-left">
                  <Flag team={selectedMatch.match.equipo2 || ''} className="w-6 h-4" />
                  <span className="font-bold text-sm text-white truncate">{selectedMatch.match.equipo2 || ''}</span>
                </div>
                <input
                  type="text"
                  maxLength={2}
                  value={localRes2}
                  onChange={(e) => setLocalRes2(e.target.value.replace(/\D/g, ''))}
                  disabled={isLocked}
                  className={`input-score ${isLocked ? 'bg-black/40 border-white/5 text-gray-400 cursor-not-allowed' : ''}`}
                  placeholder="-"
                />
              </div>

              {/* Extra Time / Penalty Shooters inputs (only if score matches) */}
              {localRes1 && localRes2 && localRes1 === localRes2 && (
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex flex-col gap-3">
                  <span className="text-xs text-amber-400 font-bold block mb-1">
                    Definición Prórroga / Penaltis (Obligatorio)
                  </span>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-300 font-medium">{selectedMatch.match.equipo1 || ''}</span>
                    <input
                      type="text"
                      maxLength={2}
                      value={localPens1}
                      onChange={(e) => setLocalPens1(e.target.value.replace(/\D/g, ''))}
                      disabled={isLocked}
                      className={`input-score !w-10 !h-8 !text-sm border-amber-500/20 ${isLocked ? 'bg-black/40 text-gray-400 cursor-not-allowed' : ''}`}
                      placeholder="P"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-300 font-medium">{selectedMatch.match.equipo2 || ''}</span>
                    <input
                      type="text"
                      maxLength={2}
                      value={localPens2}
                      onChange={(e) => setLocalPens2(e.target.value.replace(/\D/g, ''))}
                      disabled={isLocked}
                      className={`input-score !w-10 !h-8 !text-sm border-amber-500/20 ${isLocked ? 'bg-black/40 text-gray-400 cursor-not-allowed' : ''}`}
                      placeholder="P"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Scorers Grid section in bracket */}
            <div className="grid grid-cols-2 gap-4 bg-black/25 p-3 rounded-2xl border border-white/5 my-3">
              {/* Team 1 Scorers */}
              <div className="flex flex-col gap-1 text-right border-r border-white/5 pr-2">
                <div className="flex items-center justify-end gap-1">
                  <span className="text-[9px] text-gray-400 font-bold">GOLEADORES</span>
                  {!isLocked && localRes1 && parseInt(localRes1) > localScorers1.length && (
                    <button
                      onClick={() => setEditingScorersForTeam(1)}
                      className="p-0.5 rounded bg-white/5 text-gray-300 hover:bg-white/10"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap justify-end gap-1">
                  {localScorers1.map((p, idx) => {
                    const isOwnGoal = p.endsWith('(A.G.)');
                    const displayName = p.replace(' (A.G.)', '');
                    return (
                      <span
                        key={idx}
                        className={`scorer-tag text-[9px] px-1 py-0.5 text-white ${
                          isOwnGoal ? 'own-goal-tag' : ''
                        }`}
                      >
                        {displayName} {isOwnGoal && <span className="text-[7px] text-red-400 font-extrabold uppercase">(Autogol)</span>}
                        {!isLocked && (
                          <button
                            onClick={() => setLocalScorers1(prev => prev.filter((_, i) => i !== idx))}
                            className="ml-1 text-red-400 hover:text-red-300"
                          >
                            ✕
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Team 2 Scorers */}
              <div className="flex flex-col gap-1 text-left pl-2">
                <div className="flex items-center justify-between gap-1">
                  {!isLocked && localRes2 && parseInt(localRes2) > localScorers2.length && (
                    <button
                      onClick={() => setEditingScorersForTeam(2)}
                      className="p-0.5 rounded bg-white/5 text-gray-300 hover:bg-white/10"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  )}
                  <span className="text-[9px] text-gray-400 font-bold ml-auto">GOLEADORES</span>
                </div>
                <div className="flex flex-wrap justify-start gap-1">
                  {localScorers2.map((p, idx) => {
                    const isOwnGoal = p.endsWith('(A.G.)');
                    const displayName = p.replace(' (A.G.)', '');
                    return (
                      <span
                        key={idx}
                        className={`scorer-tag text-[9px] px-1 py-0.5 text-white ${
                          isOwnGoal ? 'own-goal-tag' : ''
                        }`}
                      >
                        {displayName} {isOwnGoal && <span className="text-[7px] text-red-400 font-extrabold uppercase">(Autogol)</span>}
                        {!isLocked && (
                          <button
                            onClick={() => setLocalScorers2(prev => prev.filter((_, i) => i !== idx))}
                            className="ml-1 text-red-400 hover:text-red-300"
                          >
                            ✕
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Validate Button */}
            {isLocked ? (
              <div className="w-full py-2.5 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-center gap-2 mt-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> ELIMINATORIA BLOQUEADA Y VALIDADA
              </div>
            ) : (
              <button
                onClick={handleValidate}
                className="btn-primary w-full justify-center mt-3"
              >
                <CheckCircle2 className="w-4 h-4" /> Guardar y Registrar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Scorers Popover inside Bracket Modal (With Own Goal Support) */}
      {selectedMatch && editingScorersForTeam && (
        <div className="modal-overlay z-[1100]" onClick={() => setEditingScorersForTeam(null)}>
          <div
            className="modal-content p-6 animate-fade-in text-left max-w-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-3">
              <span className="text-xs font-bold text-gray-300">Añadir Goleador</span>
              <button onClick={() => setEditingScorersForTeam(null)} className="text-gray-400">✕</button>
            </div>
            
            <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto pr-1">
              {(() => {
                const team1 = selectedMatch.match.equipo1 || '';
                const team2 = selectedMatch.match.equipo2 || '';

                const teamName = editingScorersForTeam === 1 ? team1 : team2;
                const oppName = editingScorersForTeam === 1 ? team2 : team1;

                const squad: Player[] = rosters[teamName] || [];
                const oppSquad: Player[] = rosters[oppName] || [];

                return (
                  <>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                      Goleadores de {teamName}
                    </div>
                    <div className="flex flex-col gap-1 mb-2">
                      {squad.map((p: Player) => (
                        <button
                          key={p.dorsal}
                          onClick={() => {
                            if (editingScorersForTeam === 1) {
                              setLocalScorers1(prev => [...prev, p.nombre]);
                            } else {
                              setLocalScorers2(prev => [...prev, p.nombre]);
                            }
                            setEditingScorersForTeam(null);
                          }}
                          className="p-2 bg-white/5 rounded text-xs text-left hover:bg-indigo-500/10 text-white flex justify-between"
                        >
                          <span>{p.nombre}</span>
                          <span className="text-[9px] text-gray-400">#{p.dorsal}</span>
                        </button>
                      ))}
                    </div>

                    <div className="text-[10px] text-red-400 font-bold border-t border-white/5 pt-2 mt-1 uppercase tracking-wide flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                      Autogol de {oppName}
                    </div>
                    <div className="flex flex-col gap-1 mb-2">
                      {oppSquad.map((p: Player) => (
                        <button
                          key={p.dorsal}
                          onClick={() => {
                            if (editingScorersForTeam === 1) {
                              setLocalScorers1(prev => [...prev, p.nombre + ' (A.G.)']);
                            } else {
                              setLocalScorers2(prev => [...prev, p.nombre + ' (A.G.)']);
                            }
                            setEditingScorersForTeam(null);
                          }}
                          className="p-2 bg-red-500/5 rounded text-xs text-left hover:bg-red-500/15 text-red-300 flex justify-between"
                        >
                          <span>{p.nombre} (AUTOGOL)</span>
                          <span className="text-[9px] text-red-400/70">#{p.dorsal}</span>
                        </button>
                      ))}
                    </div>

                    <div className="border-t border-white/5 pt-2 mt-1">
                      <input
                        type="text"
                        placeholder="Nombre goleador alternativo..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            const val = e.currentTarget.value.trim().toUpperCase();
                            if (editingScorersForTeam === 1) {
                              setLocalScorers1(prev => [...prev, val]);
                            } else {
                              setLocalScorers2(prev => [...prev, val]);
                            }
                            setEditingScorersForTeam(null);
                          }
                        }}
                        className="w-full p-2 rounded bg-black/40 border border-white/10 text-xs text-white"
                      />
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
export default BracketView;
