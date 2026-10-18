import React from 'react';
import { AvatarOption } from '../types';
import { AvatarDisplay } from './AvatarDisplay';
import { X, Check } from 'lucide-react';

interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  avatars: AvatarOption[];
  currentAvatarId: string;
  onSelectAvatar: (avatarId: string) => void;
}

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  isOpen,
  onClose,
  avatars,
  currentAvatarId,
  onSelectAvatar
}) => {
  const [selected, setSelected] = React.useState(currentAvatarId);

  React.useEffect(() => {
    setSelected(currentAvatarId);
  }, [currentAvatarId]);

  if (!isOpen) return null;

  const categories = [
    { key: 'FIMSER_UNIVERSE', label: 'Universo FIMSER & Angola' },
    { key: 'GAMING', label: 'Gamer & Cyber' },
    { key: 'GEOMETRIC', label: 'Abstrato & Geométrico' }
  ];

  const handleConfirm = () => {
    onSelectAvatar(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-100">Escolha o seu Avatar FIMSER</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Identidade visual pública. Não utilizamos fotografias pessoais.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto py-4 space-y-6 pr-1">
          {categories.map(cat => {
            const group = avatars.filter(a => a.category === cat.key);
            if (group.length === 0) return null;

            return (
              <div key={cat.key}>
                <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3">
                  {cat.label}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {group.map(avatar => {
                    const isPicked = selected === avatar.id;
                    return (
                      <button
                        key={avatar.id}
                        type="button"
                        onClick={() => setSelected(avatar.id)}
                        className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all ${
                          isPicked
                            ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                            : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <div className="relative mb-2">
                          <AvatarDisplay avatarId={avatar.id} size="lg" />
                          {isPicked && (
                            <div className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 p-0.5 rounded-full shadow">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-medium text-slate-200 line-clamp-1">
                          {avatar.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition-all shadow-sm"
          >
            Confirmar Avatar
          </button>
        </div>
      </div>
    </div>
  );
};
