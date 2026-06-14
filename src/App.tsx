import { useState } from 'react';
import { useTournamentState } from './hooks/useTournamentState';
import type { ActiveTab } from './types';
import Navbar from './components/Navbar';
import DashboardView from './views/DashboardView';
import PartidosView from './views/PartidosView';
import GruposView from './views/GruposView';
import BracketView from './views/BracketView';
import SquadsView from './views/SquadsView';
import ScorersView from './views/ScorersView';
import { SpainFocusModal } from './components/SpainFocusModal';

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSpainFocusOpen, setIsSpainFocusOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>('A');
  
  const {
    matches,
    bracket,
    groupStandings,
    bestThirds,
    rosters,
    scorers,
    getAvailableThirdsForSlot,
    updateMatchScore,
    updateBracketMatchScore,
    selectThirdPlaceTeamForSlot,
    resetToInitial,
    errorCorrectionMode,
    setErrorCorrectionMode,
    updatePlayer
  } = useTournamentState();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            matches={matches}
            bracket={bracket}
            groupStandings={groupStandings}
            scorers={scorers}
            setActiveTab={setActiveTab}
            onSelectGroup={setSelectedGroup}
          />
        );
      case 'partidos':
        return (
          <PartidosView
            matches={matches}
            rosters={rosters}
            updateMatchScore={updateMatchScore}
            errorCorrectionMode={errorCorrectionMode}
            bracket={bracket}
            updateBracketMatchScore={updateBracketMatchScore}
          />
        );
      case 'grupos':
        return (
          <GruposView
            matches={matches}
            groupStandings={groupStandings}
            bestThirds={bestThirds}
            activeGroup={selectedGroup}
            setActiveGroup={setSelectedGroup}
          />
        );
      case 'bracket':
        return (
          <BracketView
            bracket={bracket}
            rosters={rosters}
            getAvailableThirdsForSlot={getAvailableThirdsForSlot}
            selectThirdPlaceTeamForSlot={selectThirdPlaceTeamForSlot}
            updateBracketMatchScore={updateBracketMatchScore}
            errorCorrectionMode={errorCorrectionMode}
          />
        );
      case 'squads':
        return <SquadsView rosters={rosters} updatePlayer={updatePlayer} />;
      case 'scorers':
        return <ScorersView scorers={scorers} />;
      default:
        return (
          <DashboardView
            matches={matches}
            bracket={bracket}
            groupStandings={groupStandings}
            scorers={scorers}
            setActiveTab={setActiveTab}
            onSelectGroup={setSelectedGroup}
          />
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-app">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onReset={resetToInitial}
        isSpainFocusOpen={isSpainFocusOpen}
        setIsSpainFocusOpen={setIsSpainFocusOpen}
        errorCorrectionMode={errorCorrectionMode}
        setErrorCorrectionMode={setErrorCorrectionMode}
      />
      <main className="flex-1 overflow-x-hidden">
        {renderActiveView()}
      </main>
      
      {/* Spain Focus Summary Modal overlay */}
      <SpainFocusModal
        isOpen={isSpainFocusOpen}
        onClose={() => setIsSpainFocusOpen(false)}
        matches={matches}
        bracket={bracket}
        groupStandings={groupStandings}
        rosters={rosters}
        scorers={scorers}
      />

      <footer className="w-full py-6 text-center text-[10px] text-gray-500 font-bold border-t border-white/5 bg-black/20 uppercase tracking-widest mt-auto">
        Diseñado para el Mundial de Fútbol 2026 • USA • Canadá • México • Todos los derechos reservados
      </footer>
    </div>
  );
}

export default App;
