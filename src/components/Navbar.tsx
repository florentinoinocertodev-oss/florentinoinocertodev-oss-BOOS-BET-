import React, { useState } from 'react';
import { SessionData, SmsGatewayStatus } from '../types';
import { User } from 'firebase/auth';
import { AvatarDisplay } from './AvatarDisplay';
import { BoosLogo } from './brand/BoosLogo';
import { BoosDrawerMenu } from './brand/BoosDrawerMenu';
import {
  Menu,
  Wallet as WalletIcon,
  LogOut,
  Plus,
  ShieldCheck,
  Bell,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  session: SessionData | null;
  firebaseUser?: User | null;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAuth: () => void;
  onOpenWallet: () => void;
  onOpenSmsConfig: () => void;
  onLogout: () => void;
  smsStatus?: SmsGatewayStatus | null;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
}

/**
 * BOOS BET Official Compact Header (Prompt V2)
 * Estrutura:
 * ☰ (Menu/hamburger)  |  BOOS BET (Logo não comprimido)  |  [REGISTRAR] [ENTRAR]
 * Safe area padding, proporção compacta, área de toque >44px
 */
export const Navbar: React.FC<NavbarProps> = ({
  session,
  firebaseUser,
  activeTab,
  onSelectTab,
  onOpenAuth,
  onOpenWallet,
  onOpenSmsConfig,
  onLogout,
  smsStatus,
  onOpenNotifications,
  unreadNotificationsCount = 0
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#030D17]/95 backdrop-blur-md border-b border-[#143A52] safe-area-inset-top">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-15 sm:h-17 flex items-center justify-between gap-2 sm:gap-4">
          {/* Esquerda: ☰ Hamburger + Logo BOOS BET */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* ☰ Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 sm:p-2.5 rounded-xl text-[#F5F7FA] hover:text-[#F7B500] hover:bg-[#061827] border border-[#143A52] transition-all cursor-pointer select-none active:scale-95"
              aria-label="Abrir menu de navegação"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo BOOS BET (Nunca comprimido) */}
            <button
              type="button"
              onClick={() => onSelectTab('sports')}
              className="flex items-center gap-2 text-left hover:opacity-95 transition-opacity shrink-0 cursor-pointer select-none"
              title="BOOS BET · Plataforma Oficial"
            >
              <BoosLogo variant="full" size="md" className="hidden sm:inline-flex" />
              <BoosLogo variant="full" size="sm" className="sm:hidden" />
            </button>
          </div>

          {/* Centro (Desktop): Navegação Principal */}
          <nav className="hidden lg:flex items-center gap-6 text-xs sm:text-sm font-bold text-[#91A4B5]">
            <button
              onClick={() => onSelectTab('sports')}
              className={`transition-colors hover:text-[#F5F7FA] cursor-pointer py-1 ${
                activeTab === 'sports'
                  ? 'text-[#F7B500] border-b-2 border-[#F7B500]'
                  : ''
              }`}
            >
              Apostas Desportivas
            </button>
            <button
              onClick={() => onSelectTab('predictions')}
              className={`transition-colors hover:text-[#F5F7FA] cursor-pointer py-1 flex items-center gap-1.5 ${
                activeTab === 'predictions'
                  ? 'text-[#F7B500] border-b-2 border-[#F7B500]'
                  : ''
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#F7B500]" />
              <span>Previsões</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#F7B500] text-[#020D18] text-[9px] font-black font-mono">
                HOT
              </span>
            </button>
            <button
              onClick={() => onSelectTab('kyc')}
              className={`transition-colors hover:text-[#F5F7FA] cursor-pointer flex items-center gap-1.5 py-1 ${
                activeTab === 'kyc'
                  ? 'text-[#F7B500] border-b-2 border-[#F7B500]'
                  : ''
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              KYC Angola
            </button>
          </nav>

          {/* Direita: Notificações + [REGISTRAR] [ENTRAR] (ou Saldo + Perfil se autenticado) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Notification Bell Button */}
            {onOpenNotifications && (
              <button
                type="button"
                onClick={onOpenNotifications}
                className="relative p-2 rounded-xl bg-[#061827] hover:bg-[#0D2940] border border-[#143A52] text-[#91A4B5] hover:text-[#F5F7FA] transition-all cursor-pointer active:scale-95"
                title="Central de Notificações Push"
                aria-label="Notificações"
              >
                <Bell className="w-4 h-4 text-[#F7B500]" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 min-w-[17px] h-4 rounded-full bg-gradient-to-r from-[#FFD95A] to-[#F7B500] text-[#020D18] font-mono font-black text-[9px] flex items-center justify-center shadow-md animate-pulse">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}

            {firebaseUser || session ? (
              <div className="flex items-center gap-2">
                {session?.wallet ? (
                  /* Saldo da Carteira + Botão Rápido de Depósito se existir carteira real */
                  <div className="flex items-center rounded-xl bg-[#061827] border border-[#143A52] p-0.5 shadow-sm">
                    <button
                      type="button"
                      onClick={onOpenWallet}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-[#0D2940] rounded-lg transition-colors cursor-pointer text-xs"
                      title="Carteira"
                    >
                      <WalletIcon className="w-3.5 h-3.5 text-[#F7B500]" />
                      <span className="font-mono font-bold text-[#F5F7FA] text-xs sm:text-sm">
                        {session.wallet.balance.toLocaleString('pt-AO')}
                      </span>
                      <span className="font-mono text-[10px] text-[#F7B500] font-bold">
                        Kz
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={onOpenWallet}
                      className="p-1.5 rounded-lg bg-gradient-to-r from-[#FFD95A] to-[#F7B500] hover:brightness-110 text-[#020D18] transition-colors cursor-pointer"
                      title="Depositar via Multicaixa Express"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  </div>
                ) : (
                  /* Identidade Autoritativa Firebase Phone Auth (+244) - Sem saldo fabricado */
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#061827] border border-[#143A52] text-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-mono font-bold text-[#F5F7FA] text-xs">
                      {firebaseUser?.phoneNumber || (session?.user ? session.user.phone_e164 : 'Autenticado')}
                    </span>
                  </div>
                )}

                {/* Perfil do Jogador (se existir profile) */}
                {session?.profile && (
                  <button
                    type="button"
                    onClick={() => onSelectTab('profile')}
                    className="flex items-center gap-1.5 p-1 rounded-xl bg-[#061827] hover:bg-[#0D2940] border border-[#143A52] transition-colors cursor-pointer"
                    title="Meu Perfil"
                  >
                    <AvatarDisplay avatarId={session.profile.avatar_id} size="sm" />
                  </button>
                )}

                {/* Logout Oficial Firebase */}
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex p-2 text-[#91A4B5] hover:text-[#F04F5F] hover:bg-[#061827] rounded-xl transition-colors cursor-pointer"
                  title="Terminar Sessão"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* [REGISTRO] [ENTRAR] */
              <div className="flex items-center gap-2">
                {/* Entrar Button */}
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="px-3 sm:px-4 py-2 text-xs font-bold text-[#F5F7FA] hover:text-white bg-[#061827] hover:bg-[#0D2940] border border-[#143A52] rounded-xl transition-all cursor-pointer whitespace-nowrap active:scale-95"
                >
                  Entrar
                </button>

                {/* Registro Button (Metal Gold with #F7B500 radial glow on hover) */}
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="boos-btn-primary px-3.5 sm:px-4 py-2 text-xs font-black text-[#020D18] rounded-xl transition-all shadow-md shadow-[#F7B500]/25 cursor-pointer whitespace-nowrap active:scale-95"
                >
                  Registrar
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Slide-out Drawer Menu (☰) */}
      <BoosDrawerMenu
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        session={session}
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        onOpenAuth={onOpenAuth}
        onOpenWallet={onOpenWallet}
        onOpenSmsConfig={onOpenSmsConfig}
        onLogout={onLogout}
        smsStatus={smsStatus}
        onOpenNotifications={onOpenNotifications}
      />
    </>
  );
};
