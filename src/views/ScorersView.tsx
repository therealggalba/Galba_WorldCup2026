import React, { useState } from 'react';
import { Flag } from '../components/Flag';
import { Award, Flame, Search, User } from 'lucide-react';

interface ScorersViewProps {
  scorers: {
    pichichi: { nombre: string; team: string; goles: number; pj: number }[];
    teamScorers: Record<string, Record<string, number>>;
    topScorers: { nombre: string; team: string; goles: number }[];
  };
}

export const ScorersView: React.FC<ScorersViewProps> = ({ scorers }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamTab, setSelectedTeamTab] = useState<string | null>(null);

  const filteredPichichi = scorers.pichichi.filter((s) =>
    s.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.team.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const maxGoals = scorers.topScorers[0]?.goles || 0;
  const goldenBootLeaders = scorers.topScorers.filter((s) => s.goles === maxGoals && maxGoals > 0);

  return (
    <div className="scorers-container">
      
      {/* Top Banner: Golden Boot Leader(s) */}
      {goldenBootLeaders.length > 0 && (
        <div className="scorers-top-banner">
          <div className="golden-boot-leaders-section">
            <div className="award-circle-badge">
              <Award className="w-8 h-8 fill-current" />
            </div>
            
            <div className="flex flex-col gap-3">
              <span className="golden-boot-title">
                {goldenBootLeaders.length > 1 ? 'CO-LÍDERES BOTA DE ORO (EMPATE)' : 'LÍDER BOTA DE ORO'}
              </span>
              
              <div className="golden-boot-leaders-list">
                {goldenBootLeaders.map((leader, index) => (
                  <div key={index} className="golden-boot-leader-card">
                    <div className="text-left">
                      <h2 className="leader-name">
                        {leader.nombre}
                      </h2>
                      <span className="leader-team-block">
                        <Flag team={leader.team} className="w-4 h-2.5 rounded-sm" />
                        {leader.team}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="golden-boot-stats">
            <div className="goals-count-text">
              <span className="goals-num">
                {maxGoals}
              </span>
              <span className="goals-lbl">
                Goles Anotados
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="scorers-main-grid">
        
        {/* Pichichi Global Table */}
        <div className="scorers-table-panel">
          <div className="scorers-panel-header">
            <div className="title-block">
              <h3 className="panel-title">
                <Award className="w-5 h-5 text-yellow-400" /> Tabla de Goleadores
              </h3>
              <p className="panel-subtitle">
                Clasificación global de los goleadores de la Copa del Mundo 2026.
              </p>
            </div>

            <div className="search-input-wrapper">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Buscar goleador..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input-scorers"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="table-scroll-wrapper">
            <table className="standings-table">
              <thead>
                <tr>
                  <th className="w-12 text-xs text-center">Pos</th>
                  <th className='text-xs'>Jugador</th>
                  <th className="w-20 text-xs text-center">Goles</th>
                  <th className='text-xs'>Selección</th>
                </tr>
              </thead>
              <tbody>
                {filteredPichichi.map((s, idx) => {
                  const isTop = s.goles === maxGoals && maxGoals > 0;
                  const isSpain = s.team === 'ESPAÑA';

                  return (
                    <tr
                      key={idx}
                      className={`${isSpain ? 'bg-yellow-400/5' : ''} ${
                        isTop ? 'font-bold' : ''
                      }`}
                    >
                      <td className="text-center font-heading font-bold text-xs text-white">
                        {idx + 1}
                      </td>
                      <td className={`text-m flex items-center gap-2 ${isTop ? 'text-yellow-400' : 'text-white'}`}>
                        <div className={`p-1 rounded bg-white/5 `}>
                          <User className="w-3.5 h-3.5" />
                        </div>
                        {s.nombre}
                      </td>
                      <td className={`text-center font-heading font-black text-m ${isTop ? 'text-yellow-400' : 'text-white'}`}>
                        {s.goles}
                      </td>
                      <td className="text-sm text-gray-300">
                        <div className="flex items-center gap-2">
                          <Flag team={s.team} className="w-5 h-3.5" />
                          <span>{s.team}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredPichichi.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-gray-500 py-12 text-xs italic">
                      No se encontraron goleadores.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Team Scorers Sidebar */}
        <div className="team-scorers-panel">
          <h3 className="panel-title">
            <Flame className="w-4 h-4 text-emerald-400" /> Goleadores por Equipo
          </h3>

          <div className="team-scorers-list">
            {Object.keys(scorers.teamScorers)
              .map((teamName) => {
                const teamGoalsMap = scorers.teamScorers[teamName];
                const playerNames = Object.keys(teamGoalsMap).filter(p => teamGoalsMap[p] > 0);
                const totalTeamGoals = playerNames.reduce((acc, p) => acc + teamGoalsMap[p], 0);
                return { teamName, playerNames, totalTeamGoals, teamGoalsMap };
              })
              .filter(item => item.playerNames.length > 0)
              .sort((a, b) => {
                if (b.totalTeamGoals !== a.totalTeamGoals) return b.totalTeamGoals - a.totalTeamGoals;
                return a.teamName.localeCompare(b.teamName);
              })
              .map(({ teamName, playerNames, totalTeamGoals, teamGoalsMap }) => {
                const isSelected = selectedTeamTab === teamName;
                const isSpain = teamName === 'ESPAÑA';

                return (
                  <div key={teamName} className="flex flex-col gap-1.5">
                    {/* Header bar */}
                    <button
                      onClick={() => setSelectedTeamTab(isSelected ? null : teamName)}
                      className={`team-tab-btn ${
                        isSpain ? 'spain-theme' : ''
                      }`}
                    >
                      <div className="team-info-left">
                        <Flag team={teamName} className="w-5 h-3.5" />
                        <span className="team-name">
                          {teamName}
                        </span>
                      </div>
                      <span className="total-goals-badge">
                        {totalTeamGoals} G
                      </span>
                    </button>

                    {/* Expandable Scorer Details */}
                    {isSelected && (
                      <div className="team-scorers-expandable-box">
                        {playerNames.map((pname) => (
                          <div key={pname} className="scorer-row">
                            <span className="scorer-name">{pname}</span>
                            <span className="scorer-goals">{teamGoalsMap[pname]} goles</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

      </div>
    </div>
  );
};
export default ScorersView;
