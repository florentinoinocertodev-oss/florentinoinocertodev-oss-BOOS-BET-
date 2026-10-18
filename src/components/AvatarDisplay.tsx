import React from 'react';

interface AvatarDisplayProps {
  avatarId: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  avatarId,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl'
  };

  // Render stylized SVG based on avatarId
  const renderSvg = () => {
    switch (avatarId) {
      case 'boos_mascot_king':
        return (
          <img
            src="/assets/brand/boos_mascot_symbol.svg"
            alt="Mascote Rei BOOS BET"
            className="w-full h-full object-contain filter drop-shadow-sm select-none"
            draggable={false}
          />
        );

      case 'fimser_palanca':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1.5" fill="none">
            <defs>
              <linearGradient id="palancaGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="46" fill="url(#palancaGrad)" />
            {/* Curved long horns of the giant black sable antelope (Palanca Negra Gigante) */}
            <path d="M42 45 C35 30 20 18 10 22 C18 30 30 40 40 50" stroke="#f8fafc" strokeWidth="4" strokeLinecap="round" />
            <path d="M58 45 C65 30 80 18 90 22 C82 30 70 40 60 50" stroke="#f8fafc" strokeWidth="4" strokeLinecap="round" />
            <circle cx="50" cy="62" r="16" fill="#0f172a" />
            <path d="M44 60 L48 64 L52 60 L56 64" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        );

      case 'fimser_cyber_falcon':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1.5" fill="none">
            <defs>
              <linearGradient id="falconGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="46" fill="url(#falconGrad)" />
            <polygon points="50,20 68,52 50,44 32,52" fill="#ecfdf5" />
            <polygon points="50,44 60,78 50,70 40,78" fill="#34d399" />
            <circle cx="50" cy="42" r="3" fill="#064e3b" />
          </svg>
        );

      case 'fimser_sol_benguela':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1.5" fill="none">
            <defs>
              <linearGradient id="sunGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="46" fill="url(#sunGrad)" />
            <circle cx="50" cy="50" r="20" fill="#fffbeb" />
            <path d="M50 15 L50 25 M50 75 L50 85 M15 50 L25 50 M75 50 L85 50 M25 25 L32 32 M68 68 L75 75 M25 75 L32 68 M68 32 L75 25" stroke="#fef3c7" strokeWidth="4" strokeLinecap="round" />
          </svg>
        );

      case 'fimser_diamante_lunda':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1.5" fill="none">
            <defs>
              <linearGradient id="diaGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#5b21b6" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="46" fill="url(#diaGrad)" />
            <polygon points="30,35 70,35 85,50 50,82 15,50" fill="#f5f3ff" opacity="0.9" />
            <polygon points="30,35 50,50 70,35" fill="#ddd6fe" />
            <polygon points="15,50 50,50 50,82" fill="#c4b5fd" />
            <polygon points="85,50 50,50 50,82" fill="#a78bfa" />
          </svg>
        );

      case 'gaming_neon_striker':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1.5" fill="none">
            <defs>
              <linearGradient id="strikeGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#9d174d" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="46" fill="url(#strikeGrad)" />
            <polygon points="50,18 78,42 62,42 72,78 30,50 46,50" fill="#fdf2f8" />
          </svg>
        );

      case 'gaming_apex_champion':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1.5" fill="none">
            <defs>
              <linearGradient id="apexGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#0e7490" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="46" fill="url(#apexGrad)" />
            <path d="M50 20 L28 42 L36 78 L50 85 L64 78 L72 42 Z" fill="#ecfeff" />
            <path d="M50 32 L40 68 L50 72 L60 68 Z" fill="#0891b2" />
          </svg>
        );

      case 'gaming_phantom_byte':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1.5" fill="none">
            <defs>
              <linearGradient id="phantomGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#3730a3" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="46" fill="url(#phantomGrad)" />
            <path d="M30 40 C30 25 70 25 70 40 C70 65 65 75 50 75 C35 75 30 65 30 40 Z" fill="#e0e7ff" />
            <circle cx="42" cy="42" r="5" fill="#312e81" />
            <circle cx="58" cy="42" r="5" fill="#312e81" />
            <circle cx="43" cy="43" r="2" fill="#818cf8" />
            <circle cx="59" cy="43" r="2" fill="#818cf8" />
          </svg>
        );

      case 'geo_poly_gold':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1.5" fill="none">
            <defs>
              <linearGradient id="polyGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#854d0e" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="46" fill="url(#polyGrad)" />
            <polygon points="50,22 76,36 76,64 50,78 24,64 24,36" stroke="#fef9c3" strokeWidth="4" fill="#ca8a04" />
            <circle cx="50" cy="50" r="10" fill="#fef08a" />
          </svg>
        );

      case 'geo_emerald_matrix':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1.5" fill="none">
            <defs>
              <linearGradient id="matGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#059669" />
                <stop offset="100%" stopColor="#064e3b" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="46" fill="url(#matGrad)" />
            <rect x="30" y="30" width="40" height="40" rx="4" stroke="#a7f3d0" strokeWidth="3" transform="rotate(45 50 50)" fill="#047857" />
            <circle cx="50" cy="50" r="6" fill="#ecfdf5" />
          </svg>
        );

      case 'geo_quantum_shield':
      default:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full p-1.5" fill="none">
            <defs>
              <linearGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#1e3a8a" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="46" fill="url(#shieldGrad)" />
            <path d="M50 24 L72 34 V52 C72 68 50 78 50 78 C50 78 28 68 28 52 V34 Z" fill="#dbeafe" />
            <path d="M50 32 L64 40 V52 C64 62 50 70 50 70 C50 70 36 62 36 52 V40 Z" fill="#1d4ed8" />
          </svg>
        );
    }
  };

  return (
    <div className={`relative shrink-0 rounded-xl overflow-hidden shadow-sm ${sizeClasses[size]} ${className}`}>
      {renderSvg()}
    </div>
  );
};
