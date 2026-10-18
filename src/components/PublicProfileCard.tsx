import React, { useState } from 'react';
import { PublicProfile, AvatarOption } from '../types';
import { AvatarDisplay } from './AvatarDisplay';
import { AvatarPickerModal } from './AvatarPickerModal';
import { apiClient } from '../services/api';
import {
  Trophy,
  Flame,
  Award,
  Edit3,
  ShieldCheck,
  Check,
  X,
  Lock,
  Sparkles
} from 'lucide-react';

interface PublicProfileCardProps {
  profile: PublicProfile;
  avatars: AvatarOption[];
  onProfileUpdated: (updated: PublicProfile) => void;
}

export const PublicProfileCard: React.FC<PublicProfileCardProps> = ({
  profile,
  avatars,
  onProfileUpdated
}) => {
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(profile.username);
  const [usernameError, setUsernameError] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);

  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError('');
    if (!newUsername.trim()) {
      setUsernameError('O username não pode estar vazio.');
      return;
    }

    setSavingUsername(true);
    try {
      const res = await apiClient.updatePublicProfile({ username: newUsername.trim() });
      if (res.success) {
        onProfileUpdated(res.profile);
        setIsEditingUsername(false);
      }
    } catch (err: any) {
      setUsernameError(err.message || 'Erro ao atualizar username.');
    } finally {
      setSavingUsername(false);
    }
  };

  const handleAvatarSelected = async (avatarId: string) => {
    try {
      const res = await apiClient.updatePublicProfile({ avatar_id: avatarId });
      if (res.success) {
        onProfileUpdated(res.profile);
      }
    } catch (err) {
      console.error('Falha ao atualizar avatar:', err);
    }
  };

  const currentAvatar = avatars.find(a => a.id === profile.avatar_id);

  return (
    <div className="p-6 bg-[#001426] border border-[#06345A] rounded-3xl shadow-2xl">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-[#06345A]">
        {/* Avatar with switch action */}
        <div className="relative group shrink-0">
          <AvatarDisplay avatarId={profile.avatar_id} size="xl" />
          <button
            type="button"
            onClick={() => setIsAvatarPickerOpen(true)}
            className="absolute -bottom-2 -right-2 bg-[#F5A900] hover:bg-[#FFC21A] text-[#001426] p-2 rounded-full shadow-lg transition-transform hover:scale-110 cursor-pointer"
            title="Trocar Avatar Público"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Identity Details */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            {!isEditingUsername ? (
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl font-extrabold text-white tracking-tight font-display">
                  {profile.username}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setNewUsername(profile.username);
                    setIsEditingUsername(true);
                  }}
                  className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Personalizar pseudónimo"
                >
                  <Edit3 className="w-4 h-4 text-[#FFC21A]" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveUsername} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    placeholder="Novo username"
                    className="px-3 py-1 bg-[#06345A] border border-[#0d4a7c] rounded-xl text-sm font-semibold text-white outline-none focus:border-[#F5A900] font-mono"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={savingUsername}
                    className="p-1.5 bg-[#F5A900] text-[#001426] rounded-lg hover:bg-[#FFC21A] transition-colors cursor-pointer"
                  >
                    <Check className="w-4 h-4 font-bold" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingUsername(false)}
                    className="p-1.5 bg-[#06345A] text-slate-300 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {usernameError && (
                  <span className="text-[11px] text-rose-400">{usernameError}</span>
                )}
              </form>
            )}

            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#FFC21A]/10 border border-[#FFC21A]/30 text-[#FFC21A] w-fit mx-auto sm:mx-0 font-bold">
              Nível {profile.level}
            </span>
          </div>

          <div className="text-xs text-slate-300 flex items-center justify-center sm:justify-start gap-2">
            <span>Avatar: <strong className="text-white">{currentAvatar?.name || 'Mascote Rei BOOS'}</strong></span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-[#FFC21A] font-mono">Identificador Oficial BOOS BET</span>
          </div>

          {/* Badges list */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
            {profile.badges.map((badge, idx) => (
              <span
                key={idx}
                className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#06345A]/70 text-slate-200 border border-[#0d4a7c] uppercase font-mono"
              >
                {badge.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Public Statistics Allowed */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6">
        <div className="p-3 bg-[#06345A]/30 rounded-2xl border border-[#0d4a7c] text-center">
          <div className="w-8 h-8 rounded-xl bg-[#FFC21A]/10 text-[#FFC21A] flex items-center justify-center mx-auto mb-1.5">
            <Trophy className="w-4 h-4" />
          </div>
          <div className="text-lg font-bold text-white font-mono">
            {profile.rank_points}
          </div>
          <div className="text-[11px] text-slate-300">Pontos de Ranking</div>
        </div>

        <div className="p-3 bg-[#06345A]/30 rounded-2xl border border-[#0d4a7c] text-center">
          <div className="w-8 h-8 rounded-xl bg-[#F5A900]/10 text-[#F5A900] flex items-center justify-center mx-auto mb-1.5">
            <Flame className="w-4 h-4" />
          </div>
          <div className="text-lg font-bold text-white font-mono">
            {profile.win_streak}
          </div>
          <div className="text-[11px] text-slate-300">Sequência de Vitórias</div>
        </div>

        <div className="p-3 bg-[#06345A]/30 rounded-2xl border border-[#0d4a7c] text-center">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-1.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-lg font-bold text-white font-mono">
            {profile.xp} XP
          </div>
          <div className="text-[11px] text-slate-300">Experiência</div>
        </div>

        <div className="p-3 bg-[#06345A]/30 rounded-2xl border border-[#0d4a7c] text-center">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-300 flex items-center justify-center mx-auto mb-1.5">
            <Award className="w-4 h-4" />
          </div>
          <div className="text-lg font-bold text-white font-mono">
            Tier {Math.ceil(profile.level / 5)}
          </div>
          <div className="text-[11px] text-slate-300">Escalão Oficial</div>
        </div>
      </div>

      {/* Strict Privacy Notice */}
      <div className="mt-6 p-3 bg-[#06345A]/20 rounded-2xl border border-[#0d4a7c] flex items-center gap-2.5 text-xs text-slate-300">
        <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          Privacidade do Utilizador: O seu nome legal, número de telemóvel (+244), e-mail e saldo bancário permanecem estritamente isolados na camada privada e nunca são partilhados publicamente.
        </span>
      </div>

      {/* Avatar Picker Modal */}
      <AvatarPickerModal
        isOpen={isAvatarPickerOpen}
        onClose={() => setIsAvatarPickerOpen(false)}
        avatars={avatars}
        currentAvatarId={profile.avatar_id}
        onSelectAvatar={handleAvatarSelected}
      />
    </div>
  );
};
