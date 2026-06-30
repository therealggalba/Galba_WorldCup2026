import React from 'react';
import type { Match, BracketMatch, GroupStandings, ActiveTab } from '../types';
import { Flag, flagCodeMap } from '../components/Flag';
import { Trophy, Star, Users, Flame, Calendar, Award } from 'lucide-react';

interface DashboardViewProps {
  matches: Match[];
  bracket: Record<string, BracketMatch[]>;
  groupStandings: GroupStandings;
  scorers: { pichichi: any[]; topScorers: any[] };
  setActiveTab: (tab: ActiveTab) => void;
  onSelectGroup: (group: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  matches,
  bracket,
  groupStandings,
  scorers,
  setActiveTab,
  onSelectGroup
}) => {
  // Statistics
  const groupTotal = matches.length;
  const groupPlayed = matches.filter((m) => m.status === 'played').length;

  const bracketMatches = Object.values(bracket || {}).flat();
  const bracketTotal = bracketMatches.length;
  const bracketPlayed = bracketMatches.filter((m) => m.status === 'played').length;

  const totalMatches = groupTotal + bracketTotal;
  const playedMatches = groupPlayed + bracketPlayed;
  const pendingMatches = totalMatches - playedMatches;
  
  const groupGoals = matches.reduce((acc, m) => {
    if (m.status === 'played') {
      return acc + (m.res1 || 0) + (m.res2 || 0);
    }
    return acc;
  }, 0);

  const bracketGoals = bracketMatches.reduce((acc, m) => {
    if (m.status === 'played') {
      return acc + (m.res1 || 0) + (m.res2 || 0);
    }
    return acc;
  }, 0);

  const totalGoals = groupGoals + bracketGoals;

  const avgGoals = playedMatches > 0 ? (totalGoals / playedMatches).toFixed(2) : '0.00';

  // Spain details
  const spainGroupMatches = matches.filter(
    (m) => m.equipo1 === 'ESPAÑA' || m.equipo2 === 'ESPAÑA'
  );
  const spainBracketMatches = Object.values(bracket || {}).flat().filter(
    (m) => m.equipo1 === 'ESPAÑA' || m.equipo2 === 'ESPAÑA'
  );
  const allSpainMatches = [...spainGroupMatches, ...spainBracketMatches];

  const spainGroup = 'H';
  const spainStanding = groupStandings[spainGroup]?.find((t) => t.team === 'ESPAÑA');
  
  // Find top scorer of Spain
  const spainScorers = scorers.pichichi.filter((s) => s.team === 'ESPAÑA');
  const spainTopScorer = spainScorers.length > 0 ? spainScorers[0] : null;

  // Next match of Spain (group + bracket)
  const nextSpainMatch = allSpainMatches.find((m) => m.status === 'pending');

  // Champion details
  const CURRENT_STARS_MAP: Record<string, number> = {
    "BRASIL": 5,
    "ALEMANIA": 4,
    "ARGENTINA": 3,
    "FRANCIA": 2,
    "URUGUAY": 2,
    "INGLATERRA": 1,
    "ESPAÑA": 1
  };

  const finalMatch = bracket.F?.[0];
  const isFinalPlayed = finalMatch && finalMatch.status === 'played';
  
  const getWinner = (match: BracketMatch): string => {
    if (match.res1 === null || match.res2 === null) return '';
    if (match.res1 > match.res2) return match.equipo1 || '';
    if (match.res2 > match.res1) return match.equipo2 || '';
    if (match.goles1 !== null && match.goles2 !== null) {
      return match.goles1 > match.goles2 ? (match.equipo1 || '') : (match.equipo2 || '');
    }
    return '';
  };
  
  const champion = isFinalPlayed ? getWinner(finalMatch) : '';
  const currentStars = champion ? (CURRENT_STARS_MAP[champion.toUpperCase()] || 0) : 0;
  const totalStars = currentStars + 1;

  // Calculate Spain total stats (Group + Bracket)
  const groupGf = spainStanding ? spainStanding.gf : 0;
  const bracketGf = spainBracketMatches.reduce((acc, m) => {
    if (m.status === 'played') {
      const isEq1 = m.equipo1 === 'ESPAÑA';
      return acc + (isEq1 ? m.res1 || 0 : m.res2 || 0);
    }
    return acc;
  }, 0);
  const totalGf = groupGf + bracketGf;

  const groupGc = spainStanding ? spainStanding.gc : 0;
  const bracketGc = spainBracketMatches.reduce((acc, m) => {
    if (m.status === 'played') {
      const isEq1 = m.equipo1 === 'ESPAÑA';
      return acc + (isEq1 ? m.res2 || 0 : m.res1 || 0);
    }
    return acc;
  }, 0);
  const totalGc = groupGc + bracketGc;

  let spainPhaseLabel = '-';
  if (spainStanding) {
    spainPhaseLabel = `${spainStanding.pos}º Lugar (Grupo)`;
  }

  if (spainBracketMatches.length > 0) {
    const phasesOrder = ['R32', 'R16', 'QF', 'SF', 'TP', 'F'];
    let highestPhase = '';
    phasesOrder.forEach((phase) => {
      const hasMatch = (bracket[phase] || []).some(
        (m) => m.equipo1 === 'ESPAÑA' || m.equipo2 === 'ESPAÑA'
      );
      if (hasMatch) {
        highestPhase = phase;
      }
    });

    if (highestPhase) {
      const phaseNames: Record<string, string> = {
        R32: '1/16 Final',
        R16: 'Octavos',
        QF: 'Cuartos',
        SF: 'Semifinal',
        TP: '3º Puesto',
        F: 'Final'
      };

      const matchInHighest = (bracket[highestPhase] || []).find(
        (m) => m.equipo1 === 'ESPAÑA' || m.equipo2 === 'ESPAÑA'
      );

      if (matchInHighest) {
        if (matchInHighest.status === 'played') {
          const winner = getWinner(matchInHighest);
          const isWinner = winner === 'ESPAÑA';
          if (highestPhase === 'F') {
            spainPhaseLabel = isWinner ? '¡CAMPEÓN!' : 'Subcampeón';
          } else if (highestPhase === 'TP') {
            spainPhaseLabel = isWinner ? '3º Puesto' : '4º Puesto';
          } else {
            spainPhaseLabel = isWinner ? `Ganador ${phaseNames[highestPhase]}` : `Eliminado en ${phaseNames[highestPhase]}`;
          }
        } else {
          spainPhaseLabel = `Clasificado a ${phaseNames[highestPhase]}`;
        }
      }
    }
  }

  // Get all played matches (Group + Bracket) for Recent section
  const playedGroupMatches = matches
    .filter((m) => m.status === 'played')
    .map((m) => ({
      ...m,
      phaseOrGroup: `GRUPO ${m.grupo}`,
      goles1: null,
      goles2: null
    }));

  const bracketPhaseLabels: Record<string, string> = {
    R32: '1/16 FINAL',
    R16: 'OCTAVOS DE FINAL',
    QF: 'CUARTOS DE FINAL',
    SF: 'SEMIFINALES',
    TP: 'TERCER PUESTO',
    F: 'FINAL'
  };

  const playedBracketMatches: any[] = [];
  Object.keys(bracket || {}).forEach((phase) => {
    (bracket[phase] || []).forEach((m) => {
      if (m.status === 'played') {
        playedBracketMatches.push({
          ...m,
          phaseOrGroup: bracketPhaseLabels[phase] || phase
        });
      }
    });
  });

  const allPlayedMatches = [...playedGroupMatches, ...playedBracketMatches];
  const sortedPlayedMatches = allPlayedMatches.sort((a, b) => a.fecha.localeCompare(b.fecha));
  const recentPlayedMatches = sortedPlayedMatches.slice(-4).reverse();

  return (
    <div className="dashboard-container">
      {/* Hero Header */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <div className="star-badge">
            <Star className="star-badge-icon" /> Edición Histórica: 48 Equipos
          </div>
          <h1 className="hero-title">
            Copa Mundial de la FIFA 2026
          </h1>
          <p className="hero-description">
            Diseña el camino a la gloria desde la fase de grupos hasta la gran final en los estadios de USA, Canadá y México.
          </p>
        </div>

        {/* Host cards */}
        <div className="host-flags">
          <div className="host-card">
            <Flag team="ESTADOS UNIDOS" className="flag-icon-lg" />
            <span className="host-label">USA</span>
          </div>
          <div className="host-card">
            <Flag team="CANADÁ" className="flag-icon-lg" />
            <span className="host-label">Canadá</span>
          </div>
          <div className="host-card">
            <Flag team="MÉXICO" className="flag-icon-lg" />
            <span className="host-label">México</span>
          </div>
        </div>
      </div>

      {/* Main Grid: stats, Spain highlight, pichichi */}
      <div className="dashboard-grid">
        {/* SPAIN SPECIAL HIGHLIGHT PANEL */}
        <div className="spain-special-highlight">
          <div className="spain-header">
            <div className="spain-header-info">
              <Flag team="ESPAÑA" className="flag-icon-lg spain-flag-border" />
              <div className="spain-header-text">
                <h3 className="spain-title">SELECCIÓN ESPAÑOLA</h3>
                <p className="spain-subtitle">Grupo H • Resumen Global</p>
              </div>
            </div>
            <div className="spain-badge">
              <Star className="spain-badge-icon" />
              <span>La Roja</span>
            </div>
          </div>

          <div className="spain-stats-grid">
            <div className="spain-stat-card">
              <span className="stat-label">Clasificación</span>
              <span className="stat-value gold text-sm font-black truncate max-w-full block pt-1.5" title={spainPhaseLabel}>
                {spainPhaseLabel}
              </span>
            </div>
            <div className="spain-stat-card">
              <span className="stat-label">Puntos</span>
              <span className="stat-value white">
                {spainStanding ? spainStanding.pts : 0}
              </span>
            </div>
            <div className="spain-stat-card">
              <span className="stat-label">Goles Favor</span>
              <span className="stat-value white">
                {totalGf}
              </span>
            </div>
            <div className="spain-stat-card">
              <span className="stat-label">Goles Contra</span>
              <span className="stat-value white">
                {totalGc}
              </span>
            </div>
            <div className="spain-stat-card">
              <span className="stat-label">Máx. Goleador</span>
              <span className="truncate-text">
                {spainTopScorer ? `${spainTopScorer.nombre} (${spainTopScorer.goles})` : 'Ninguno'}
              </span>
            </div>
          </div>

          <div className="spain-next-match">
            <div className="next-match-details">
              <span className="stat-label">Próximo Compromiso</span>
              {nextSpainMatch ? (
                <div className="next-match-teams">
                  <span className="next-match-team">
                    <Flag team={nextSpainMatch.equipo1 || ''} className="flag-icon" />
                    {nextSpainMatch.equipo1}
                  </span>
                  <span className="vs-badge">VS</span>
                  <span className="next-match-team">
                    <Flag team={nextSpainMatch.equipo2 || ''} className="flag-icon" />
                    {nextSpainMatch.equipo2}
                  </span>
                </div>
              ) : (
                <span className="group-completed-label">Participación completada</span>
              )}
            </div>

            {nextSpainMatch && (
              <div className="next-match-info">
                <span className="next-match-date">{nextSpainMatch.fecha} • {nextSpainMatch.horario}</span>
                <span className="next-match-tv">TV: {nextSpainMatch.tv}</span>
              </div>
            )}
          </div>

          <div className="spain-buttons">
            <button
              onClick={() => {
                onSelectGroup('H');
                setActiveTab('grupos');
              }}
              className="btn-spain flex-grow"
            >
              <Calendar className="btn-icon" /> Ver Partidos del Grupo H
            </button>
            <button
              onClick={() => setActiveTab('squads')}
              className="btn-secondary px-6"
            >
              <Users className="btn-icon" /> Plantilla de España
            </button>
          </div>
        </div>

        {/* Global stats */}
        <div className="summary-card">
          <h3 className="summary-title">
            <Trophy className="summary-title-icon" /> RESUMEN TORNEO
          </h3>

          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Partidos Jugados</span>
              <span className="summary-value">{playedMatches}</span>
              <span className="summary-sublabel">de {totalMatches} en total</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Partidos Pendientes</span>
              <span className="summary-value">{pendingMatches}</span>
              <span className="summary-sublabel">restantes</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Goles Totales</span>
              <span className="summary-value">{totalGoals}</span>
              <span className="summary-sublabel">anotados</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Promedio Goles</span>
              <span className="summary-value">{avgGoals}</span>
              <span className="summary-sublabel">por partido</span>
            </div>
          </div>
        </div>
      </div>

      {/* Underneath: Top Scorers (Pichichi) Showcase & Upcoming Matches */}
      <div className="dashboard-grid">
        
        {/* Played / Recent matches list */}
        <div className="recent-matches-card">
          <h3 className="recent-matches-title">
            <Flame className="recent-matches-title-icon" /> ÚLTIMOS PARTIDOS JUGADOS
          </h3>

          <div className="recent-matches-grid">
            {recentPlayedMatches.map((m) => (
                <div key={m.id} className="recent-match-item">
                  <div className="recent-match-header">
                    <span className="group-badge">{m.phaseOrGroup}</span>
                    <span>{m.fecha}</span>
                  </div>

                  <div className="recent-matches-teams">
                    <div className="recent-match-team-row">
                      <span className="recent-match-team-name">
                        <Flag team={m.equipo1 || ''} className="flag-icon" />
                        {m.equipo1}
                      </span>
                      <span className="recent-match-team-score">
                        {m.res1}
                        {m.goles1 !== null && (
                          <span className="text-[10px] text-gray-400 ml-1">({m.goles1})</span>
                        )}
                      </span>
                    </div>
                    <div className="recent-match-team-row">
                      <span className="recent-match-team-name">
                        <Flag team={m.equipo2 || ''} className="flag-icon" />
                        {m.equipo2}
                      </span>
                      <span className="recent-match-team-score">
                        {m.res2}
                        {m.goles2 !== null && (
                          <span className="text-[10px] text-gray-400 ml-1">({m.goles2})</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

            {allPlayedMatches.length === 0 && (
              <span className="no-matches-msg">No hay partidos jugados todavía.</span>
            )}
          </div>

          <button
            onClick={() => setActiveTab('grupos')}
            className="btn-secondary w-full justify-center text-xs"
          >
            Ver Todos los Grupos
          </button>
        </div>

        {/* Pichichi highlights */}
                <div className="pichichi-summary-card">
                  <h3 className="pichichi-title">
                    <Award className="pichichi-title-icon" /> MÁXIMOS GOLEADORES
                  </h3>

                  <div className="pichichi-list">
                    {(() => {
                      const maxGoals = scorers.pichichi.length > 0 ? scorers.pichichi[0].goles : 0;
                      return scorers.pichichi.slice(0, 4).map((s, idx) => {
                        const isTop = s.goles === maxGoals && maxGoals > 0;
                        return (
                          <div
                            key={idx}
                            className={`pichichi-row ${
                              isTop ? 'pichichi-highlight-card' : 'pichichi-normal-row'
                            }`}
                          >
                            <div className="pichichi-row-left">
                              <div className="pichichi-rank">
                                {idx + 1}
                              </div>
                              <div className="pichichi-info">
                                <span className="pichichi-name">{s.nombre}</span>
                                <span className="pichichi-team">
                                  <Flag team={s.team} className="flag-icon" /> {s.team}
                                </span>
                              </div>
                            </div>

                            <div className="pichichi-row-right">
                              <div className="pichichi-goals-container">
                                <span className="pichichi-goals-val">{s.goles}</span>
                                <span className="pichichi-goals-lbl">goles</span>
                              </div>
                              {isTop && (
                                <div className="pichichi-crown">
                                  <Flame className="crown-icon" />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}

                    {scorers.pichichi.length === 0 && (
                      <span className="no-scorers-msg">No hay goleadores registrados todavía.</span>
                    )}
                  </div>

                  <button
                    onClick={() => setActiveTab('scorers')}
                    className="btn-secondary w-full justify-center text-xs"
                  >
                    Ver Pichichi Completo
                  </button>
                </div>
      </div>

      {/* Champion Celebration Section */}
      {isFinalPlayed && champion && (
        <div className="champion-section animate-fade-in">
          <div className="champion-gold-glow" />
          <div className="champion-content">
            <div className="champion-flag-container">
              {flagCodeMap[champion.toUpperCase()] ? (
                <img
                  src={`https://flagcdn.com/w160/${flagCodeMap[champion.toUpperCase()]}.png`}
                  srcSet={`https://flagcdn.com/w320/${flagCodeMap[champion.toUpperCase()]}.png 2x`}
                  alt={`Bandera de ${champion}`}
                  className="champion-flag-img"
                />
              ) : (
                <Flag team={champion} className="champion-flag-fallback" />
              )}
            </div>

            <h2 className="champion-title-text">
              ¡{champion.toUpperCase()} CAMPEÓN DEL MUNDO 2026!
            </h2>
            <div className="champion-stars-container">
              {Array.from({ length: totalStars }).map((_, index) => (
                <Star key={index} className="champion-star" />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default DashboardView;
