import React, { useState } from 'react';
import type { Match, GroupStandings, Standing } from '../types';
import { Flag } from '../components/Flag';
import { Trophy, Calendar } from 'lucide-react';

interface GruposViewProps {
  matches: Match[];
  groupStandings: GroupStandings;
  bestThirds: (Standing & { group: string })[];
  activeGroup?: string;
  setActiveGroup?: (group: string) => void;
}

export const GruposView: React.FC<GruposViewProps> = ({
  matches,
  groupStandings,
  bestThirds,
  activeGroup: propActiveGroup,
  setActiveGroup: propSetActiveGroup
}) => {
  const [localActiveGroup, setLocalActiveGroup] = useState<string>('A');
  const [showBestThirds, setShowBestThirds] = useState<boolean>(false);

  const activeGroup = propActiveGroup !== undefined ? propActiveGroup : localActiveGroup;
  const setActiveGroup = propSetActiveGroup !== undefined ? propSetActiveGroup : setLocalActiveGroup;

  const groupsList = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  // Standings for current active group
  const currentStandings = groupStandings[activeGroup] || [];

  // Matches for current active group
  const currentGroupMatches = matches.filter((m) => m.grupo === activeGroup);

  return (
    <div className="grupos-container">

      {/* Index Navigation Bar at the top */}
      <div className="groups-tabs">
        {groupsList.map((gname) => (
          <button
            key={gname}
            onClick={() => setActiveGroup(gname)}
            className={`group-tab-btn ${
              activeGroup === gname ? 'active' : 'inactive'
            }`}
          >
            GRUPO {gname}
          </button>
        ))}
      </div>

      {/* Split Panel: Left Standings (Large), Right Matches */}
      <div className="grupos-split-grid">
        
        {/* Left Side: Large Group Standings Table */}
        <div className="standings-column">
          <h3 className="column-title">
            <Trophy className="w-4 h-4" /> Tabla de Posiciones — Grupo {activeGroup}
          </h3>

          <div className="standings-card">
            <table className="standings-table w-full">
              <thead>
                <tr>
                  <th className="p-3 text-center w-12 text-xs font-bold text-gray-500 uppercase tracking-wider">Pos</th>
                  <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider pl-4">Selección</th>
                  <th className="p-3 text-center w-16 text-xs font-heading font-black text-gray-500 uppercase tracking-wider">Pts</th>
                  <th className="p-3 text-center w-14 text-xs font-bold text-gray-500 uppercase tracking-wider">GF</th>
                  <th className="p-3 text-center w-14 text-xs font-bold text-gray-500 uppercase tracking-wider">GC</th>
                  <th className="p-3 text-center w-14 text-xs font-bold text-gray-500 uppercase tracking-wider">DG</th>
                </tr>
              </thead>
              <tbody>
                {currentStandings.map((t) => {
                  const isRowSpain = t.team === 'ESPAÑA';
                  const isTop2 = t.pos <= 2;
                  const isTop3 = t.pos === 3;

                  return (
                    <tr
                      key={t.team}
                      className={`border-b border-white/5 last:border-b-0 transition-all duration-300 ${
                        isRowSpain 
                          ? 'text-yellow-400 font-extrabold bg-red-500/10 border-l-2 border-l-red-500' 
                          : isTop2
                          ? 'hover:bg-white/5'
                          : 'opacity-75 hover:bg-white/5'
                      }`}
                    >
                      <td className="p-4 text-center text-sm font-bold font-heading">
                        {t.pos}
                      </td>
                      <td className="p-4 pl-4 text-sm font-bold text-white flex items-center gap-3">
                        <Flag team={t.team} className="w-6 h-4 rounded shadow-sm border border-white/10" />
                        <span className="truncate max-w-[180px]">{t.team}</span>
                        {isTop2 && (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.5 rounded font-black tracking-widest uppercase ml-1.5">
                            Q
                          </span>
                        )}
                        {isTop3 && (
                          <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/25 px-1.5 py-0.5 rounded font-black tracking-widest uppercase ml-1.5">
                            ?
                          </span>
                        )}
                      </td>
                      <td className={`p-4 text-center text-sm font-heading font-black ${
                        isRowSpain ? 'text-yellow-400' : 'text-white'
                      }`}>
                        {t.pts}
                      </td>
                      <td className="p-4 text-center text-sm font-bold text-gray-300">
                        {t.gf}
                      </td>
                      <td className="p-4 text-center text-sm font-bold text-gray-300">
                        {t.gc}
                      </td>
                      <td className={`p-4 text-center text-sm font-bold ${
                        t.dg > 0 ? 'text-emerald-400' : t.dg < 0 ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {t.dg > 0 ? `+${t.dg}` : t.dg}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="standings-legend">
              <span className="legend-item">
                <span className="color-box green"></span> Clasifica (1º y 2º)
              </span>
              <button 
                onClick={() => setShowBestThirds(!showBestThirds)}
                className="interactive-legend-btn"
                title={showBestThirds ? "Ocultar tabla de mejores terceros" : "Mostrar tabla de mejores terceros"}
              >
                <span className="color-box yellow"></span> Posible Mejor 3º
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Group Matches List */}
        <div className="matches-column">
          <h3 className="column-title">
            <Calendar className="w-4 h-4" /> Partidos — Grupo {activeGroup}
          </h3>

          <div className="matches-scroll-container">
            {currentGroupMatches.map((m) => {
              const isSpain = m.equipo1 === 'ESPAÑA' || m.equipo2 === 'ESPAÑA';
              return (
                <div
                  key={m.id}
                  className={`match-group-card ${
                    isSpain ? 'spain-match' : 'normal-match'
                  }`}
                >
                  <div className="match-group-teams">
                    <div className="match-group-team team1">
                      <Flag team={m.equipo1} className="w-6 h-4 rounded shadow-sm border border-white/5" />
                      <span className={`text-xs font-bold ${m.equipo1 === 'ESPAÑA' ? 'spain-team-text' : 'normal-team-text'}`}>{m.equipo1}</span>
                    </div>

                    <div className="match-group-score">
                      {m.status === 'played' ? `${m.res1} - ${m.res2}` : 'VS'}
                    </div>

                    <div className="match-group-team team2">
                      <span className={`text-xs font-bold ${m.equipo2 === 'ESPAÑA' ? 'spain-team-text' : 'normal-team-text'}`}>{m.equipo2}</span>
                      <Flag team={m.equipo2} className="w-6 h-4 rounded shadow-sm border border-white/5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* BOTTOM SECTION: Comparison Table for Mejores Terceros */}
      {showBestThirds && (
        <div className="thirds-comparison-section animate-fade-in">
          <h3 className="column-title">
            <Trophy className="w-4 h-4 text-yellow-500" /> Comparativa de Mejores Terceros
          </h3>

        <div className="thirds-comparison-card">
          <table className="standings-table w-full text-center">
            <thead>
              <tr>
                <th className="p-3 text-center w-12 text-xs font-bold text-gray-500 uppercase tracking-wider">Pos</th>
                <th className="p-3 text-center w-22 text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider pl-4">Selección</th>
                <th className="p-3 text-center w-22 text-xs font-bold text-gray-500 uppercase tracking-wider">Grupo</th>
                <th className="p-3 text-center w-24 text-xs font-heading font-black text-gray-500 uppercase tracking-wider">Pts</th>
                <th className="p-3 text-center w-20 text-xs font-bold text-gray-500 uppercase tracking-wider">GF</th>
                <th className="p-3 text-center w-20 text-xs font-bold text-gray-500 uppercase tracking-wider">DG</th>
              </tr>
            </thead>
            <tbody>
              {bestThirds.map((t, idx) => {
                const qualifies = idx < 8; // Top 8 qualify

                return (
                  <tr
                    key={t.team}
                    className={`border-b border-white/5 last:border-b-0 transition-all duration-300 ${
                      qualifies
                        ? 'bg-emerald-500/5 hover:bg-emerald-500/10'
                        : 'opacity-60 hover:bg-white/5'
                    }`}
                  >
                    <td className="p-3.5 text-center text-sm font-bold font-heading text-gray-400">
                      {idx + 1}
                    </td>
                    <td className="p-3.5 text-center text-xs">
                      {qualifies ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold uppercase tracking-wider text-[12px]">
                          Clasificado
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-bold uppercase tracking-wider text-[12px]">
                          Eliminado
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 pl-4 text-sm font-bold text-white text-left flex items-center gap-3">
                      <Flag team={t.team} className="w-6 h-4 rounded shadow-sm border border-white/10" />
                      <span>{t.team}</span>
                    </td>
                    <td className="p-3.5 text-center text-sm font-semibold text-gray-300">
                      Grupo {t.group}
                    </td>
                    <td className="p-3.5 text-center text-sm font-bold text-gray-300">
                      {t.gf}
                    </td>
                    <td className={`p-3.5 text-center text-sm font-bold ${
                      t.dg > 0 ? 'text-emerald-400' : t.dg < 0 ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {t.dg > 0 ? `+${t.dg}` : t.dg}
                    </td>
                    <td className={`p-3.5 text-center text-sm font-heading font-black text-white`}>
                      {t.pts}
                    </td>
                    
                  </tr>
                );
              })}
              {bestThirds.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-sm text-gray-500 italic">
                    No hay suficientes datos todavía para calcular los mejores terceros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

    </div>
  );
};
export default GruposView;
