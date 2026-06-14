import React, { useState } from 'react';
import type { Player } from '../types';
import { Flag } from '../components/Flag';
import { Users, Star, Shield, Edit2, X, Check } from 'lucide-react';

interface SquadsViewProps {
  rosters: Record<string, Player[]>;
  updatePlayer: (
    teamName: string,
    dorsal: number,
    newName: string,
    newFoto: string,
    newPosicion?: Player['posicion']
  ) => void;
}

export const SquadsView: React.FC<SquadsViewProps> = ({ rosters, updatePlayer }) => {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  
  // Local edit states
  const [editName, setEditName] = useState('');
  const [editPosition, setEditPosition] = useState<Player['posicion']>(undefined);
  const [editFotoInput, setEditFotoInput] = useState('');

  const teams = Object.keys(rosters).sort();

  // Search filter
  const filteredTeams = teams.filter((t) =>
    t.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startEditing = (player: Player) => {
    setEditingPlayer(player);
    setEditName(player.nombre);
    
    // Position
    setEditPosition(player.posicion || ((player.dorsal === 1 || player.dorsal === 13 || player.dorsal === 25) ? 'POR' : 'MC'));
    
    // Extract seed if it's a dicebear url, otherwise show full url/Base64
    const seedMatch = player.foto.match(/seed=([^&]+)/);
    if (seedMatch) {
      setEditFotoInput(decodeURIComponent(seedMatch[1]));
    } else {
      setEditFotoInput(player.foto);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        alert('La imagen seleccionada es demasiado grande. Elige una menor a 1.5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditFotoInput(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!selectedTeam || !editingPlayer) return;
    if (!editName.trim()) {
      alert('El nombre del jugador no puede estar vacío.');
      return;
    }

    let finalFoto = editFotoInput.trim();
    if (
      finalFoto && 
      !finalFoto.startsWith('http://') && 
      !finalFoto.startsWith('https://') && 
      !finalFoto.startsWith('data:image/')
    ) {
      // Treat as seed for Dicebear
      finalFoto = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(finalFoto)}`;
    } else if (!finalFoto) {
      // Fallback
      finalFoto = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(editName.trim())}`;
    }

    updatePlayer(selectedTeam, editingPlayer.dorsal, editName.trim().toUpperCase(), finalFoto, editPosition);
    setEditingPlayer(null);
  };

  return (
    <div className="squads-container">

      {/* Grid of 48 Teams */}
      <div className="squads-teams-grid">
        {filteredTeams.map((teamName) => {
          const isSpain = teamName === 'ESPAÑA';
          const size = rosters[teamName]?.length || 0;

          return (
            <div
              key={teamName}
              onClick={() => setSelectedTeam(teamName)}
              className={`squad-team-card ${
                isSpain ? 'spain-highlight' : ''
              }`}
            >
              <Flag team={teamName} className="squad-team-avatar" />
              <h4 className="squad-team-name">
                {teamName}
              </h4>
              <span className="squad-team-badge">
                {isSpain ? (
                  <>
                    <Star className="star-gold" />
                    <span className="badge-gold-text">25 Jugadores</span>
                  </>
                ) : (
                  `${size} Jugadores`
                )}
              </span>
            </div>
          );
        })}

        {filteredTeams.length === 0 && (
          <div className="no-teams-found">
            No se encontraron selecciones con ese nombre.
          </div>
        )}
      </div>

      {/* SQUAD ROSTER MODAL */}
      {selectedTeam && (
        <div className="modal-overlay" onClick={() => { setSelectedTeam(null); setEditingPlayer(null); }}>
          <div
            className={`modal-content roster-modal-content p-6 animate-fade-in text-left max-w-2xl relative ${
              selectedTeam === 'ESPAÑA' ? 'spain-theme' : ''
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <Flag team={selectedTeam} className="w-10 h-7 rounded border border-white/10" />
                <div>
                  <h3 className="font-heading text-xl font-extrabold text-white flex items-center gap-2">
                    {selectedTeam}
                    {selectedTeam === 'ESPAÑA' && (
                      <span className="spain-badge">La Roja</span>
                    )}
                  </h3>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Plantilla Oficial • 25 Jugadores (Haz clic en un jugador para editar)</span>
                </div>
              </div>
              <button
                onClick={() => { setSelectedTeam(null); setEditingPlayer(null); }}
                className="text-gray-400 hover:text-white bg-white/5 p-2 rounded-full border border-white/5 hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {/* Players Grid */}
            <div className="players-list-grid">
              {rosters[selectedTeam]?.map((player) => {
                const isGK = player.posicion === 'POR' || (!player.posicion && (player.dorsal === 1 || player.dorsal === 13 || player.dorsal === 25));
                const isSpain = selectedTeam === 'ESPAÑA';

                return (
                  <div
                    key={player.dorsal}
                    onClick={() => startEditing(player)}
                    className={`player-row-card ${
                      isSpain ? 'spain-card' : ''
                    }`}
                  >
                    {/* Dorsal Circular badge */}
                    <div className={`player-dorsal-badge ${
                      isSpain ? 'spain-dorsal' : (isGK ? 'gk-dorsal' : 'regular-dorsal')
                    }`}>
                      {player.dorsal}
                    </div>

                    <div className="player-info-block">
                      <span className="player-name-val">
                        {player.nombre}
                      </span>
                      <span className="player-position-val">
                        {isGK ? (
                          <Shield className="gk-icon" />
                        ) : null}
                        {player.posicion || (isGK ? 'POR' : 'MC')}
                      </span>
                    </div>

                    {/* Render Player Avatar */}
                    <div className="player-avatar-wrapper">
                      <img
                        src={player.foto}
                        alt={player.nombre}
                        className="player-avatar-img"
                      />
                      <div className="player-avatar-overlay">
                        <Edit2 className="edit-icon" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* NESTED PLAYER EDIT POPUP OVERLAY */}
            {editingPlayer && (
              <div className="nested-player-editor">
                <div className="nested-editor-box">
                  <div className="nested-editor-header">
                    <h4 className="header-title">
                      <Edit2 className="icon-edit" /> EDITAR JUGADOR #{editingPlayer.dorsal}
                    </h4>
                    <button
                      onClick={() => setEditingPlayer(null)}
                      className="close-editor-btn"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Preview of current edits */}
                  <div className="preview-player-row">
                    <div className="preview-avatar-circle">
                      <img
                        src={
                          editFotoInput.trim().startsWith('http') || editFotoInput.trim().startsWith('data:image/')
                            ? editFotoInput.trim()
                            : `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(editFotoInput.trim() || editName.trim())}`
                        }
                        alt="Preview"
                        className="preview-img"
                        onError={(e) => {
                          e.currentTarget.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=fallback`;
                        }}
                      />
                    </div>
                    <div className="preview-player-details">
                      <div className="preview-name">{editName || 'SIN NOMBRE'}</div>
                      <div className="preview-position">
                        {editPosition === 'POR' ? <Shield className="shield-icon" /> : null}
                        {editPosition || 'MC'}
                      </div>
                    </div>
                  </div>

                  <div className="editor-fields-col">
                    <div>
                      <label className="input-label">Nombre</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="text-input"
                        placeholder="Nombre completo"
                      />
                    </div>

                    <div>
                      <label className="input-label">Posición</label>
                      <select
                        value={editPosition || ''}
                        onChange={(e) => setEditPosition(e.target.value as Player['posicion'])}
                        className="select-input"
                      >
                        <option value="POR" className="bg-slate-900">POR (Portero)</option>
                        <option value="LD" className="bg-slate-900">LD (Lateral Derecho)</option>
                        <option value="LI" className="bg-slate-900">LI (Lateral Izquierdo)</option>
                        <option value="DFC" className="bg-slate-900">DFC (Defensa Central)</option>
                        <option value="MCD" className="bg-slate-900">MCD (Mediocentro Defensivo)</option>
                        <option value="MC" className="bg-slate-900">MC (Mediocentro)</option>
                        <option value="MCO" className="bg-slate-900">MCO (Mediocentro Ofensivo)</option>
                        <option value="ED" className="bg-slate-900">ED (Extremo Derecho)</option>
                        <option value="EI" className="bg-slate-900">EI (Extremo Izquierdo)</option>
                        <option value="DC" className="bg-slate-900">DC (Delantero Centro)</option>
                      </select>
                    </div>

                    <div>
                      <label className="input-label">Subir Imagen desde dispositivo</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="file-input"
                      />
                    </div>

                    <div>
                      <label className="input-label">O usar Semilla de Avatar o URL</label>
                      <input
                        type="text"
                        value={editFotoInput.startsWith('data:image/') ? '' : editFotoInput}
                        onChange={(e) => setEditFotoInput(e.target.value)}
                        className="text-input"
                        placeholder={editFotoInput.startsWith('data:image/') ? 'Imagen subida (borra para usar semilla)' : 'Semilla (ej: "Leo") o URL'}
                      />
                      <span className="info-note">Si prefieres usar Dicebear o una URL externa, ingresa el texto aquí.</span>
                    </div>
                  </div>

                  <div className="actions-row">
                    <button
                      onClick={handleSave}
                      className="action-btn-save"
                    >
                      <Check className="w-3.5 h-3.5" /> GUARDAR
                    </button>
                    <button
                      onClick={() => setEditingPlayer(null)}
                      className="action-btn-cancel"
                    >
                      <X className="w-3.5 h-3.5" /> CANCELAR
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default SquadsView;
