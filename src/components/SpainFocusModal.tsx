import React from 'react';
import type { Match, BracketMatch, Standing, Player } from '../types';
import { Flag } from './Flag';
import { X, Award, Users, Calendar, Trophy, Flame } from 'lucide-react';

interface SpainFocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: Match[];
  bracket: Record<string, BracketMatch[]>;
  groupStandings: Record<string, Standing[]>;
  rosters: Record<string, Player[]>;
  scorers: {
    pichichi: { nombre: string; team: string; goles: number; pj: number }[];
  };
}

export const SpainFocusModal: React.FC<SpainFocusModalProps> = ({
  isOpen,
  onClose,
  matches,
  bracket,
  groupStandings,
  rosters,
  scorers
}) => {
  if (!isOpen) return null;

  const spainGroupMatches = matches.filter(
    (m) => m.equipo1 === 'ESPAÑA' || m.equipo2 === 'ESPAÑA'
  );

  // Find Spain's group name dynamically
  const spainGroup = spainGroupMatches[0]?.grupo || 'H';

  // Get standings for Spain's group
  const spainGroupStandings = groupStandings[spainGroup] || [];

  // Filter bracket matches for Spain
  const spainBracketMatches: { phase: string; match: BracketMatch }[] = [];
  Object.keys(bracket).forEach((phase) => {
    bracket[phase].forEach((m) => {
      if (m.equipo1 === 'ESPAÑA' || m.equipo2 === 'ESPAÑA') {
        spainBracketMatches.push({ phase, match: m });
      }
    });
  });

  const spainRoster = rosters['ESPAÑA'] || [];

  // Filter scorers for Spain
  const spainScorers = scorers.pichichi.filter((s) => s.team === 'ESPAÑA');

  return (
    <div className="modal-overlay z-[2000]" onClick={onClose}>
      <div
        className="modal-content spain-focus-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Spain flag and gold title */}
        <div className="spain-modal-header">
          <div className="header-left">
            <Flag team="ESPAÑA" className="header-flag" />
            <div className="header-title-text">
              <h2 className="header-title">
                ESPAÑA FOCUS <Flame className="icon-flame" />
              </h2>
              <p className="header-subtitle">
                Seguimiento de la Selección Española • Mundial 2026
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="close-modal-btn"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal body divided in scrollable grids */}
        <div className="spain-modal-body">
          
          {/* TOP SECTION: Group standings & matches list */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Standings */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <h3 className="spain-modal-section-title">
                <Trophy className="w-4 h-4 text-amber-500" /> Clasificación Grupo {spainGroup}
              </h3>
              
              <div className="spain-group-card">
                <table className="standings-table">
                  <thead>
                    <tr>
                      <th className="!p-1 text-center w-8">#</th>
                      <th className="!p-1 pl-2">Equipo</th>
                      <th className="!p-1 text-center w-8">GF</th>
                      <th className="!p-1 text-center w-8">DG</th>
                      <th className="!p-1 text-center w-8">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {spainGroupStandings.map((t) => {
                      const isRowSpain = t.team === 'ESPAÑA';
                      return (
                        <tr
                          key={t.team}
                          className={`${
                            isRowSpain ? 'text-yellow-400 font-extrabold bg-red-500/10 border-l-2 border-l-red-500' : ''
                          }`}
                        >
                          <td className="!p-2 text-center text-xs font-bold font-heading text-gray-500">
                            {t.pos}
                          </td>
                          <td className="!p-2 pl-2 text-xs font-semibold text-white flex items-center gap-2">
                            <Flag team={t.team} className="w-5 h-3.5 rounded-sm" />
                            <span className="truncate max-w-[120px]">{t.team}</span>
                          </td>
                          <td className="!p-2 text-center text-xs font-bold text-gray-300">
                            {t.gf}
                          </td>
                          <td className={`!p-2 text-center text-xs font-bold ${
                            t.dg > 0 ? 'text-emerald-400' : t.dg < 0 ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {t.dg > 0 ? `+${t.dg}` : t.dg}
                          </td>
                          <td className="!p-2 text-center text-xs font-heading font-black text-white">
                            {t.pts}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Dynamic Spain Scorers section */}
              <h3 className="spain-modal-section-title mt-4">
                <Award className="w-4 h-4 text-amber-500" /> Goleadores Españoles
              </h3>
              
              <div className="spain-scorers-box">
                {spainScorers.map((s) => (
                  <div key={s.nombre} className="spain-scorer-row">
                    <span className="scorer-name">{s.nombre}</span>
                    <span className="spain-scorer-badge">
                      {s.goles} {s.goles === 1 ? 'Gol' : 'Goles'}
                    </span>
                  </div>
                ))}
                {spainScorers.length === 0 && (
                  <span className="text-xs text-gray-500 italic text-center py-4">No hay goleadores registrados todavía</span>
                )}
              </div>
            </div>

            {/* Matches list */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              <h3 className="spain-modal-section-title">
                <Calendar className="w-4 h-4 text-amber-500" /> Agenda y Resultados
              </h3>

              <div className="flex flex-col gap-4">
                {/* Group Matches */}
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-left">Fase de Grupos</span>
                  {spainGroupMatches.map((m) => (
                    <div key={m.id} className="spain-match-card group-match">
                      <div className="spain-match-time-row">
                        <span>Jornada {m.jornada.replace('J', '')} • {m.fecha} — {m.horario}</span>
                        <span className="match-tv-badge">
                          TV: {m.tv}
                        </span>
                      </div>

                      <div className="spain-match-teams-row">
                        <div className="team-block-left">
                          <Flag team={m.equipo1} className="flag-icon" />
                          <span className={`team-name-text ${m.equipo1 === 'ESPAÑA' ? 'spain-highlight' : ''}`}>{m.equipo1}</span>
                        </div>

                        <div className="spain-score-badge">
                          {m.status === 'played' ? `${m.res1} - ${m.res2}` : 'VS'}
                        </div>

                        <div className="team-block-right">
                          <span className={`team-name-text ${m.equipo2 === 'ESPAÑA' ? 'spain-highlight' : ''}`}>{m.equipo2}</span>
                          <Flag team={m.equipo2} className="flag-icon" />
                        </div>
                      </div>

                      {/* Match Scorers list */}
                      {m.status === 'played' && (
                        <div className="spain-match-scorers-grid">
                          <div className="scorers-left">
                            {(m.scorers1 || []).map((s, idx) => (
                              <div key={idx} className={s.endsWith('(A.G.)') ? 'own-goal' : ''}>
                                {s.replace(' (A.G.)', '')} {s.endsWith('(A.G.)') && '(Autogol)'}
                              </div>
                            ))}
                          </div>
                          <div className="scorers-right">
                            {(m.scorers2 || []).map((s, idx) => (
                              <div key={idx} className={s.endsWith('(A.G.)') ? 'own-goal' : ''}>
                                {s.replace(' (A.G.)', '')} {s.endsWith('(A.G.)') && '(Autogol)'}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Bracket Knockout Matches */}
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-left">Fase Eliminatoria</span>
                  {spainBracketMatches.map(({ phase, match }) => (
                    <div key={match.id} className="spain-match-card knockout-match">
                      <div className="spain-match-time-row">
                        <span>{phase} • {match.fecha} — {match.horario}</span>
                        <span className="match-tv-badge">
                          TV: {match.tv}
                        </span>
                      </div>

                      <div className="spain-match-teams-row">
                        <div className="team-block-left">
                          <Flag team={match.equipo1 || ''} className="flag-icon" />
                          <span className={`team-name-text ${match.equipo1 === 'ESPAÑA' ? 'spain-highlight' : ''}`}>{match.equipo1}</span>
                        </div>

                        <div className="flex flex-col items-center">
                          <div className="spain-score-badge">
                            {match.status === 'played' ? `${match.res1} - ${match.res2}` : 'VS'}
                          </div>
                          {match.goles1 !== null && match.goles2 !== null && (
                            <span className="spain-penalties-badge">
                              Pen: ({match.goles1} - {match.goles2})
                            </span>
                          )}
                        </div>

                        <div className="team-block-right">
                          <span className={`team-name-text ${match.equipo2 === 'ESPAÑA' ? 'spain-highlight' : ''}`}>{match.equipo2}</span>
                          <Flag team={match.equipo2 || ''} className="flag-icon" />
                        </div>
                      </div>

                      {/* Bracket Scorers list */}
                      {match.status === 'played' && (
                        <div className="spain-match-scorers-grid">
                          <div className="scorers-left">
                            {(match.scorers1 || []).map((s, idx) => (
                              <div key={idx} className={s.endsWith('(A.G.)') ? 'own-goal' : ''}>
                                {s.replace(' (A.G.)', '')} {s.endsWith('(A.G.)') && '(Autogol)'}
                              </div>
                            ))}
                          </div>
                          <div className="scorers-right">
                            {(match.scorers2 || []).map((s, idx) => (
                              <div key={idx} className={s.endsWith('(A.G.)') ? 'own-goal' : ''}>
                                {s.replace(' (A.G.)', '')} {s.endsWith('(A.G.)') && '(Autogol)'}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {spainBracketMatches.length === 0 && (
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center text-xs text-gray-500 italic">
                      Pendiente de clasificación para las siguientes rondas eliminatorias.
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* BOTTOM SECTION: 26 Players Roster */}
          <div className="flex flex-col gap-3">
            <h3 className="spain-modal-section-title">
              <Users className="w-4 h-4 text-amber-500" /> Plantilla Oficial (26 Jugadores)
            </h3>
            
            <div className="spain-players-grid">
              {spainRoster.map((player) => {
                const isGK = player.posicion === 'POR' || (!player.posicion && (player.dorsal === 1 || player.dorsal === 13 || player.dorsal === 25));
                return (
                  <div
                    key={player.dorsal}
                    className={`spain-player-card ${
                      isGK ? 'gk-card' : ''
                    }`}
                  >
                    <div className="spain-player-avatar-circle">
                      <img
                        src={player.foto}
                        alt={player.nombre}
                        className="spain-player-avatar-img"
                      />
                    </div>
                    <div>
                      <span className="spain-player-dorsal">
                        #{player.dorsal}
                      </span>
                      <span className="spain-player-name" title={player.nombre}>
                        {player.nombre}
                      </span>
                      <span className="spain-player-position">
                        {player.posicion || (isGK ? 'POR' : 'MC')}
                      </span>
                    </div>
                  </div>
                );
              })}
              {spainRoster.length === 0 && (
                <span className="col-span-full text-xs text-gray-500 italic">No se pudo cargar la plantilla</span>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
