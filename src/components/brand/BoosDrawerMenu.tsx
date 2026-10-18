import React from 'react';
import { BoosLogo } from './BoosLogo';
import { BoosButton } from './BoosButton';
import { BoosCharacter } from './BoosCharacter';
import { SessionData, SmsGatewayStatus } from '../../types';
import { AvatarDisplay } from '../AvatarDisplay';
import {
  X,
  Trophy,
  Activity,
  Dices,
  Rocket,
  ShieldCheck,
  Wallet as WalletIcon,
  Server,
  LogOut,
  User,
  ExternalLink,
  Crown,
  HelpCircle,
  ShieldAlert,
  Bell,
  Sparkles
} from 'lucide-react';

interface BoosDrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  session: SessionData | null;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAuth: () => void;
  onOpenWallet: () => void;
  onOpenSmsConfig: () => void;
  onLogout: () => void;
  smsStatus?: SmsGatewayStatus | null;
  onOpenNotifications?: () => void;
}

export const BoosDrawerMenu: React.FC<BoosDrawerMenuProps> = ({
  isOpen,
  onClose,
  session,
  activeTab,
  onSelectTab,
  onOpenAuth,
  onOpenWallet,
  onOpenSmsConfig,
  onLogout,
  smsStatus,
  onOpenNotifications
}) => {
  if (!isOpen) return null;

  const handleNav = (tab: string) => {
    onSelectTab(tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-4/5 max-w-xs bg-[#001426] border-r border-[#06345A] h-full flex flex-col justify-between shadow-2xl z-10 overflow-y-auto">
        {/* Top Header */}
        <div>
          <div className="p-4 border-b border-[#06345A] flex items-center justify-between">
            <BoosLogo variant="full" size="sm" />
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-[#06345A]/50 transition-colors cursor-pointer"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Section / Login Prompt */}
          <div className="p-4 border-b border-[#06345A] bg-[#06345A]/20">
            {session ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <AvatarDisplay avatarId={session.profile.avatar_id} size="md" />
                  <div className="overflow-hidden">
                    <div className="font-bold text-white text-sm truncate">
                      {session.profile.username}
                    </div>
                    <div className="text-[11px] font-mono text-[#FFC21A] flex items-center gap-1">
                      <Crown className="w-3 h-3 text-[#FFC21A]" />
                      Nível {session.profile.level} · {session.profile.xp} XP
                    </div>
                  </div>
                </div>

                {/* Wallet Balance Action */}
                <div className="p-3 bg-[#06345A]/60 border border-[#0d4a7c] rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Saldo Disponível
                    </span>
                    <span className="text-sm font-bold font-mono text-white">
                      {session.wallet.balance.toLocaleString('pt-AO')} Kz
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      onOpenWallet();
                      onClose();
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#F5A900] text-[#001426] hover:bg-[#FFC21A] transition-colors cursor-pointer"
                  >
                    Depositar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <BoosCharacter
                    pose="BOOS_WELCOME"
                    size="sm"
                    glow
                    showCrownBadge
                  />
                  <div>
                    <div className="text-xs font-bold text-white">
                      Bem-vindo à <span className="text-[#FFC21A]">BOOS BET</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      A Casa do Jogador Rei
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenAuth();
                      onClose();
                    }}
                    className="py-2.5 px-3 text-center text-xs font-bold text-[#001426] bg-gradient-to-r from-[#FFC21A] to-[#F5A900] rounded-xl hover:opacity-95 shadow cursor-pointer"
                  >
                    Registrar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenAuth();
                      onClose();
                    }}
                    className="py-2.5 px-3 text-center text-xs font-semibold text-white bg-[#06345A] border border-[#0d4a7c] rounded-xl hover:bg-[#083d6a] cursor-pointer"
                  >
                    Entrar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 text-sm font-medium">
            <button
              onClick={() => handleNav('sports')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'sports'
                  ? 'bg-[#F5A900] text-[#001426] font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-[#06345A]/50'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Apostas Desportivas</span>
            </button>

            <button
              onClick={() => handleNav('predictions')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                activeTab === 'predictions'
                  ? 'bg-gradient-to-r from-[#FFC21A] to-[#F5A900] text-[#001426] font-black'
                  : 'text-slate-300 hover:text-white hover:bg-[#06345A]/50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#FFC21A]" />
              <span>Previsões & Destaques</span>
              <span className="ml-auto text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#001426] text-[#FFC21A] font-black uppercase">
                HOT
              </span>
            </button>

            <button
              onClick={() => handleNav('sports')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-[#06345A]/50 transition-colors cursor-pointer"
            >
              <Activity className="w-4 h-4 text-rose-400" />
              <span>Jogos Ao Vivo</span>
              <span className="ml-auto text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-400">
                LIVE
              </span>
            </button>

            {session && (
              <>
                <button
                  onClick={() => handleNav('profile')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                    activeTab === 'profile'
                      ? 'bg-[#F5A900] text-[#001426] font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-[#06345A]/50'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Meu Perfil & Avatar</span>
                </button>

                <button
                  onClick={() => handleNav('kyc')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                    activeTab === 'kyc'
                      ? 'bg-[#F5A900] text-[#001426] font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-[#06345A]/50'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Verificação KYC (BI / Passaporte)</span>
                </button>
              </>
            )}

            {onOpenNotifications && (
              <button
                onClick={() => {
                  onOpenNotifications();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-[#06345A]/50 transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4 text-[#FFC21A]" />
                <span>Notificações & Alertas</span>
              </button>
            )}

            <button
              onClick={() => {
                onOpenSmsConfig();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-[#06345A]/40 transition-colors cursor-pointer font-mono text-xs"
            >
              <Server className="w-4 h-4 text-[#F5A900]" />
              <span>Gateway SMS Angola (+244)</span>
              <span
                className={`ml-auto w-2 h-2 rounded-full ${
                  smsStatus?.status === 'READY'
                    ? 'bg-emerald-400'
                    : 'bg-[#FFC21A]'
                }`}
              />
            </button>
          </nav>
        </div>

        {/* Bottom Regulatory & Responsible Gaming */}
        <div className="p-4 border-t border-[#06345A] space-y-3 bg-[#001426]">
          {session && (
            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full py-2.5 px-3 rounded-xl border border-rose-900/60 bg-rose-950/20 text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-rose-900/40 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Terminar Sessão
            </button>
          )}

          <div className="text-[11px] text-slate-400 space-y-1">
            <div className="font-bold text-[#FFC21A] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Licenciado pelo ISJ Angola
            </div>
            <div className="text-[10px] text-slate-500 leading-tight">
              Apostas exclusivas para maiores de 18 anos (+18). Jogue com moderação e responsabilidade.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
