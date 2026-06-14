import React from 'react';

// Maps our standardized team names to ISO country codes used by flagcdn.com
const flagCodeMap: Record<string, string> = {
  "ALEMANIA": "de",
  "ARABIA SAUDÍ": "sa",
  "ARGELIA": "dz",
  "ARGENTINA": "ar",
  "AUSTRALIA": "au",
  "AUSTRIA": "at",
  "BÉLGICA": "be",
  "BOSNIA & HERZEGOVINA": "ba",
  "BRASIL": "br",
  "CANADÁ": "ca",
  "CATAR": "qa",
  "CHEQUIA": "cz",
  "COLOMBIA": "co",
  "COSTA DE MARFIL": "ci",
  "CROACIA": "hr",
  "CURAZAO": "cw",
  "ECUADOR": "ec",
  "EGIPTO": "eg",
  "ESCOCIA": "gb-sct",
  "ESPAÑA": "es",
  "ESTADOS UNIDOS": "us",
  "FRANCIA": "fr",
  "GHANA": "gh",
  "HAITÍ": "ht",
  "INGLATERRA": "gb-eng",
  "IRAK": "iq",
  "IRÁN": "ir",
  "CABO VERDE": "cv",
  "JAPÓN": "jp",
  "JORDANIA": "jo",
  "MARRUECOS": "ma",
  "MÉXICO": "mx",
  "NORUEGA": "no",
  "NUEVA ZELANDA": "nz",
  "PAÍSES BAJOS": "nl",
  "PANAMÁ": "pa",
  "PARAGUAY": "py",
  "PORTUGAL": "pt",
  "RD CONGO": "cd",
  "REPÚBLICA DE COREA": "kr",
  "SENEGAL": "sn",
  "SUDÁFRICA": "za",
  "SUECIA": "se",
  "SUIZA": "ch",
  "TÚNEZ": "tn",
  "TURQUÍA": "tr",
  "URUGUAY": "uy",
  "UZBEKISTÁN": "uz"
};

interface FlagProps {
  team: string;
  className?: string;
}

export const Flag: React.FC<FlagProps> = ({ team, className = '' }) => {
  const cleanName = team ? team.trim().toUpperCase() : '';
  const code = flagCodeMap[cleanName];

  if (!code) {
    // Return a generic dark grey flag placeholder to avoid double-rendering team text
    return (
      <div 
        className={`inline-block bg-white/10 rounded-[2px] border border-white/10 flex-shrink-0 ${className}`}
        style={{ aspectRatio: '3/2' }}
        title={team || 'TBD'}
      />
    );
  }

  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
      alt={`Bandera de ${team}`}
      className={`flag-icon ${className}`}
      loading="lazy"
      onError={(e) => {
        // Fallback to empty space
        (e.target as HTMLElement).style.display = 'none';
      }}
    />
  );
};
export default Flag;
export { flagCodeMap };
