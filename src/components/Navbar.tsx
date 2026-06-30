import React from 'react';
import type { ActiveTab } from '../types';
import { Trophy, Calendar, GitFork, Users, Award, RotateCcw, Lock, Unlock, Table, ArrowLeft } from 'lucide-react';
import { APP_REGISTRY } from '@galbahub/domain';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onReset: () => void;
  isSpainFocusOpen: boolean;
  setIsSpainFocusOpen: (open: boolean) => void;
  errorCorrectionMode: boolean;
  setErrorCorrectionMode: (mode: boolean) => void;
  saving: boolean;
  syncError: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onReset,
  isSpainFocusOpen,
  setIsSpainFocusOpen,
  errorCorrectionMode,
  setErrorCorrectionMode,
  saving,
  syncError
}) => {
  const followballApp = APP_REGISTRY.flatMap(cat => cat.apps).find(app => app.id === 'followball');
  const followballUrl = import.meta.env.DEV ? followballApp?.devUrl : followballApp?.prodUrl;

  return (
    <header className="navbar-header">
      <div className="logo-group">
        {/* Volver a Followball */}
        {followballUrl && (
          <a href={followballUrl} className="back-to-followball-btn">
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </a>
        )}

        {/* Brand logo highlighting Host Countries */}
        <div className="brand-block">
        <div className="brand-icon-wrapper">
          <img src="data:image/jpeg;base64,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"
           alt="Logo" />
        </div>
        <div>
          <span className="brand-name">
            MUNDIAL 2026
          </span>
          <span className="brand-sub">
            USA • CANADÁ • MÉXICO
          </span>
        </div>
      </div>
      </div>

      {/* Tabs */}
      <nav className="navbar-nav">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
        >
          <Trophy className="w-4 h-4 text-gray-400" />
          <span>Inicio</span>
        </button>

        <button
          onClick={() => setActiveTab('partidos')}
          className={`nav-link ${activeTab === 'partidos' ? 'active' : ''}`}
        >
          <Calendar className="w-4 h-4" />
          <span>Partidos</span>
        </button>

        <button
          onClick={() => setActiveTab('grupos')}
          className={`nav-link ${activeTab === 'grupos' ? 'active' : ''}`}
        >
          <Table className="w-4 h-4" />
          <span>Grupos</span>
        </button>

        <button
          onClick={() => setActiveTab('bracket')}
          className={`nav-link ${activeTab === 'bracket' ? 'active' : ''}`}
        >
          <GitFork className="w-4 h-4" />
          <span>Eliminatorias</span>
        </button>

        <button
          onClick={() => setActiveTab('squads')}
          className={`nav-link ${activeTab === 'squads' ? 'active' : ''}`}
        >
          <Users className="w-4 h-4" />
          <span>Plantillas</span>
        </button>

        <button
          onClick={() => setActiveTab('scorers')}
          className={`nav-link ${activeTab === 'scorers' ? 'active' : ''}`}
        >
          <Award className="w-4 h-4" />
          <span>Goleadores</span>
        </button>
      </nav>

      {/* Controls: Reset / Spain Focus badge / Error Correction */}
      <div className="navbar-controls">
        {/* Sync indicator */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-extrabold uppercase tracking-wider ${
          saving 
            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' 
            : syncError
              ? 'bg-red-500/15 text-red-400 border border-red-500/30 cursor-help'
              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
        }`} title={
          saving 
            ? 'Guardando cambios en Supabase...' 
            : syncError
              ? 'Error al guardar en Supabase. Se está usando localStorage local. Asegúrate de haber creado la tabla en tu consola de Supabase.'
              : 'Todos los cambios sincronizados en Supabase'
        }>
          <span className={`w-1.5 h-1.5 rounded-full ${
            saving 
              ? 'bg-amber-400 animate-pulse' 
              : syncError
                ? 'bg-red-400'
                : 'bg-emerald-400'
          }`}></span>
          <span>{saving ? 'Guardando...' : syncError ? 'Error Nube' : 'Sincronizado'}</span>
        </div>

        {/* Spain focus clickable button */}
        <button
          onClick={() => setIsSpainFocusOpen(!isSpainFocusOpen)}
          className={`spain-focus-btn px-4 py-2 rounded-xl text-[10px] flex items-center gap-2 transition-all ${
            isSpainFocusOpen ? 'spain-focus-active' : ''
          }`}
          title="Ver resumen y plantilla de España"
        >
          <span>España</span>
        </button>

        {/* Error Correction Mode Lock/Unlock Toggle */}
        <button
          onClick={() => setErrorCorrectionMode(!errorCorrectionMode)}
          className={`lock-unlock-btn ${
            errorCorrectionMode ? 'active-correction' : 'inactive-correction'
          }`}
          title={errorCorrectionMode ? "Modo Corrección Activo (Clic para Bloquear)" : "Modo Corrección Inactivo (Clic para Desbloquear)"}
        >
          {errorCorrectionMode ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
        </button>

        <button
          onClick={() => {
            if (window.confirm('¿Seguro que quieres restablecer todos los datos del torneo al estado inicial del Excel?')) {
              onReset();
            }
          }}
          className="reset-btn"
          title="Restablecer Datos"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
export default Navbar;
