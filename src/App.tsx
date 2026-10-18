import React, { useState, useEffect } from 'react';
import { SessionData, AvatarOption, SmsGatewayStatus, BetSelection, SportMatch } from './types';
import { apiClient } from './services/api';
import {
  subscribeToAuthState,
  signOut,
  getCurrentUser,
  getIdToken,
  buildSessionFromFirebaseUser
} from './services/firebaseAuthService';
import type { User as FirebaseUser } from 'firebase/auth';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { WalletModal } from './components/WalletModal';
import { SmsGatewayModal } from './components/SmsGatewayModal';
import { Sportsbook } from './components/Sportsbook';
import { KycSection } from './components/KycSection';
import { PublicProfileCard } from './components/PublicProfileCard';
import { SecuritySection } from './components/SecuritySection';
import { BoosBottomNav } from './components/brand/BoosBottomNav';
import { BoosNotificationCenter } from './components/brand/BoosNotificationCenter';
import { BoosNotificationToast } from './components/brand/BoosNotificationToast';
import { BoosLoyaltySection } from './components/brand/BoosLoyaltySection';
import { BoosWelcomeModal } from './components/brand/BoosWelcomeModal';
import { BoosCelebration } from './components/brand/BoosCelebration';
import { BoosLoading } from './components/brand/BoosLoading';
import { notificationService } from './services/notificationService';
import {
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Lock,
  Server,
  User,
  Settings,
  Sparkles,
  Trophy,
  Dices,
  Rocket
} from 'lucide-react';

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(getCurrentUser());
  const [session, setSession] = useState<SessionData | null>(null);
  const [activeTab, setActiveTab] = useState<string>('sports');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [avatars, setAvatars] = useState<AvatarOption[]>([]);
  const [smsStatus, setSmsStatus] = useState<SmsGatewayStatus | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Global bet selections for persistent bet slip & mobile bottom nav badge
  const [selections, setSelections] = useState<BetSelection[]>([]);
  const [isMobileBetSlipOpen, setIsMobileBetSlipOpen] = useState(false);

  // Notification Center & Push Alertas
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(
    notificationService.getUnreadCount()
  );

  // Official BOOS Welcome Onboarding & Celebration Modal States
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{
    isOpen: boolean;
    payoutAmount: number;
    betTicketId?: string;
  } | null>(null);

  // Check first visit for BOOS welcome onboarding
  useEffect(() => {
    try {
      const seen = localStorage.getItem('boos_welcome_seen');
      if (!seen) {
        setIsWelcomeModalOpen(true);
      }
    } catch {
      // Ignore storage errors in restricted iframes
    }
  }, []);

  // Subscribe to notification updates
  useEffect(() => {
    const unsubscribe = notificationService.subscribe(items => {
      setUnreadNotificationsCount(items.filter(n => !n.read).length);
    });
    return unsubscribe;
  }, []);

  // Subscribe to authoritative Firebase Authentication state
  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (u: FirebaseUser | null) => {
      setFirebaseUser(u);
      if (u) {
        try {
          const syncRes = await apiClient.syncFirebaseUser(u.phoneNumber || '', u.uid);
          setSession({
            token: syncRes.token,
            user: syncRes.user,
            profile: syncRes.profile,
            privateIdentity: syncRes.privateIdentity,
            kyc: syncRes.kyc,
            wallet: syncRes.wallet
          });
        } catch {
          const token = await getIdToken().catch(() => null);
          const built = buildSessionFromFirebaseUser(u, token || undefined);
          setSession(built);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Initialize session, avatars and SMS status
  useEffect(() => {
    async function init() {
      try {
        const [activeSession, avData, smsData] = await Promise.all([
          apiClient.getSession().catch(() => null),
          apiClient.getAvatars().catch(() => ({ avatars: [] })),
          apiClient.getSmsGatewayStatus().catch(() => null)
        ]);

        if (activeSession) setSession(activeSession);
        if (avData?.avatars) setAvatars(avData.avatars);
        if (smsData) setSmsStatus(smsData as any);
      } catch (err) {
        console.error('Erro na inicialização:', err);
      } finally {
        setLoadingInitial(false);
      }
    }
    init();
  }, []);

  const handleLogout = async () => {
    try {
      await apiClient.logout();
    } catch {
      // Ignore
    }
    try {
      await signOut(); // Firebase Auth official signOut()
    } catch (err) {
      console.error('Erro no logout do Firebase:', err);
    }
    setFirebaseUser(null);
    setSession(null);
    setActiveTab('sports');
  };

  const handleAuthSuccess = (u: FirebaseUser, newSession?: SessionData) => {
    setFirebaseUser(u);
    if (newSession) {
      setSession(newSession);
    } else {
      setSession(buildSessionFromFirebaseUser(u));
    }
    setIsAuthModalOpen(false);
  };

  const handleToggleSelection = (match: SportMatch, type: 'HOME' | 'DRAW' | 'AWAY', odd: number) => {
    const label = type === 'HOME' ? match.home_team : type === 'AWAY' ? match.away_team : 'Empate';
    const existingIndex = selections.findIndex(s => s.match_id === match.id);

    if (existingIndex > -1) {
      if (selections[existingIndex].selection === type) {
        // Remove
        setSelections(selections.filter((_, idx) => idx !== existingIndex));
      } else {
        // Update selection
        const updated = [...selections];
        updated[existingIndex] = {
          match_id: match.id,
          match_title: `${match.home_team} vs ${match.away_team}`,
          selection: type,
          selection_label: label,
          odd
        };
        setSelections(updated);
      }
    } else {
      setSelections([
        ...selections,
        {
          match_id: match.id,
          match_title: `${match.home_team} vs ${match.away_team}`,
          selection: type,
          selection_label: label,
          odd
        }
      ]);
    }
  };

  const handleRemoveSelection = (matchId: string) => {
    setSelections(selections.filter(s => s.match_id !== matchId));
  };

  const handleClearSelections = () => {
    setSelections([]);
  };

  return (
    <div className="min-h-screen bg-[#030D17] text-[#F5F7FA] flex flex-col font-sans selection:bg-[#F7B500] selection:text-[#020D18] pb-18 lg:pb-0">
      {/* 1. Header Oficial BOOS BET */}
      <Navbar
        session={session}
        firebaseUser={firebaseUser}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenWallet={() => setIsWalletModalOpen(true)}
        onOpenSmsConfig={() => setIsSmsModalOpen(true)}
        onLogout={handleLogout}
        smsStatus={smsStatus}
        onOpenNotifications={() => setIsNotificationCenterOpen(true)}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      {/* 2. Banner de Segurança, Identidade & ISJ Angola */}
      <div className="bg-[#061827] border-b border-[#143A52] text-[11px] text-[#91A4B5] py-1.5 px-4 text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 flex-wrap">
          <span className="flex items-center gap-1 text-[#F7B500] font-bold">
            <Smartphone className="w-3.5 h-3.5" />
            Acesso Oficial Angola (+244) via Telemóvel + OTP
          </span>
          <span aria-hidden="true" className="text-[#5F7485] hidden sm:inline">·</span>
          <span className="hidden sm:inline">Identidade Pública Pseudónima Baseada em Avatar</span>
          <span aria-hidden="true" className="text-[#5F7485]">·</span>
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            ISJ Angola Licenciado · Jogo Responsável (+18)
          </span>
        </div>
      </div>

      {/* 3. Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {loadingInitial ? (
          <div className="py-24">
            <BoosLoading message="A carregar plataforma oficial BOOS BET..." size="lg" />
          </div>
        ) : (
          <>
            {/* TAB: SPORTSBOOK (APOSTAS DESPORTIVAS) */}
            {activeTab === 'sports' && (
              <Sportsbook
                session={session}
                onOpenAuth={() => setIsAuthModalOpen(true)}
                onOpenWallet={() => setIsWalletModalOpen(true)}
                onBetPlaced={(ticket, newBalance) => {
                  if (session) {
                    setSession({
                      ...session,
                      wallet: { ...session.wallet, balance: newBalance }
                    });
                  }
                }}
                onSelectTab={setActiveTab}
                selections={selections}
                onToggleSelection={handleToggleSelection}
                onRemoveSelection={handleRemoveSelection}
                onClearSelections={handleClearSelections}
                isMobileBetSlipOpen={isMobileBetSlipOpen}
                setIsMobileBetSlipOpen={setIsMobileBetSlipOpen}
                initialSubTab="MATCHES"
              />
            )}

            {/* TAB: PREVISÕES & INTELIGÊNCIA BOOS (SISTEMA HÍBRIDO) */}
            {activeTab === 'predictions' && (
              <Sportsbook
                session={session}
                onOpenAuth={() => setIsAuthModalOpen(true)}
                onOpenWallet={() => setIsWalletModalOpen(true)}
                onBetPlaced={(ticket, newBalance) => {
                  if (session) {
                    setSession({
                      ...session,
                      wallet: { ...session.wallet, balance: newBalance }
                    });
                  }
                }}
                onSelectTab={setActiveTab}
                selections={selections}
                onToggleSelection={handleToggleSelection}
                onRemoveSelection={handleRemoveSelection}
                onClearSelections={handleClearSelections}
                isMobileBetSlipOpen={isMobileBetSlipOpen}
                setIsMobileBetSlipOpen={setIsMobileBetSlipOpen}
                initialSubTab="PREDICTIONS"
              />
            )}

            {/* TAB: KYC VERIFICATION */}
            {activeTab === 'kyc' && (
              session ? (
                <KycSection
                  privateIdentity={session.privateIdentity}
                  kyc={session.kyc}
                  onKycUpdated={(newIdentity, newKyc) => {
                    setSession({
                      ...session,
                      privateIdentity: newIdentity,
                      kyc: newKyc
                    });
                  }}
                />
              ) : (
                <div className="p-8 bg-[#001426] border border-[#06345A] rounded-3xl text-center max-w-md mx-auto my-12 space-y-4 shadow-2xl">
                  <div className="w-12 h-12 bg-[#F5A900]/10 border border-[#F5A900]/30 text-[#FFC21A] rounded-2xl flex items-center justify-center mx-auto">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    Autenticação Requerida
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Para aceder à sua área de verificação de identidade (KYC) e validar o seu BI angolano ou Passaporte, entre com o seu número de telemóvel.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="w-full py-3 bg-gradient-to-r from-[#FFC21A] to-[#F5A900] text-[#001426] font-black text-xs rounded-xl shadow cursor-pointer active:scale-95"
                  >
                    Entrar com Telemóvel (+244)
                  </button>
                </div>
              )
            )}

            {/* TAB: PROFILE */}
            {activeTab === 'profile' && (
              session ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 border-b border-[#06345A] pb-3">
                    <button
                      onClick={() => setActiveTab('profile')}
                      className="px-4 py-2 rounded-xl text-xs font-black bg-[#F5A900] text-[#001426] shadow"
                    >
                      Perfil Público
                    </button>
                    <button
                      onClick={() => setActiveTab('security')}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#06345A]"
                    >
                      Segurança & E-mail
                    </button>
                    <button
                      onClick={() => setActiveTab('kyc')}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#06345A]"
                    >
                      Verificação KYC
                    </button>
                  </div>

                  <PublicProfileCard
                    profile={session.profile}
                    avatars={avatars}
                    onProfileUpdated={updated => {
                      setSession({
                        ...session,
                        profile: updated
                      });
                    }}
                  />

                  {/* BOOS Loyalty Tier Tracking Section */}
                  <BoosLoyaltySection
                    profile={session.profile}
                    wallet={session.wallet}
                  />
                </div>
              ) : (
                <div className="p-8 bg-[#001426] border border-[#06345A] rounded-3xl text-center max-w-md mx-auto my-12 space-y-4 shadow-2xl">
                  <h3 className="text-lg font-bold text-white">Perfil do Jogador Rei</h3>
                  <p className="text-xs text-slate-300">
                    Entre na sua conta para consultar o seu perfil público, nível, avatar e histórico de vitórias.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="w-full py-3 bg-gradient-to-r from-[#FFD65A] to-[#F7B500] text-[#001426] font-black text-xs rounded-xl shadow cursor-pointer active:scale-95"
                  >
                    Criar Conta / Entrar
                  </button>
                </div>
              )
            )}

            {/* TAB: SECURITY */}
            {activeTab === 'security' && (
              session ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 border-b border-[#06345A] pb-3">
                    <button
                      onClick={() => setActiveTab('profile')}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#06345A]"
                    >
                      Perfil Público
                    </button>
                    <button
                      onClick={() => setActiveTab('security')}
                      className="px-4 py-2 rounded-xl text-xs font-black bg-[#F5A900] text-[#001426] shadow"
                    >
                      Segurança & E-mail
                    </button>
                    <button
                      onClick={() => setActiveTab('kyc')}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#06345A]"
                    >
                      Verificação KYC
                    </button>
                  </div>

                  <SecuritySection
                    privateIdentity={session.privateIdentity}
                    onIdentityUpdated={updated => {
                      setSession({
                        ...session,
                        privateIdentity: updated
                      });
                    }}
                  />
                </div>
              ) : null
            )}
          </>
        )}
      </main>

      {/* 4. Footer Oficial */}
      <footer className="border-t border-[#143A52] bg-[#061827] py-8 px-4 text-xs text-[#91A4B5] mb-14 lg:mb-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap text-center md:text-left">
            <span className="font-extrabold text-[#F7B500] font-display">BOOS BET</span>
            <span aria-hidden="true" className="text-[#5F7485]">·</span>
            <span>Plataforma de Apostas Desportivas</span>
            <span aria-hidden="true" className="text-[#5F7485]">·</span>
            <span>Entretenimento & Competição</span>
          </div>

          <div className="flex items-center gap-4 text-[#91A4B5] flex-wrap justify-center">
            <span>Jogo Responsável (+18)</span>
            <span aria-hidden="true" className="text-[#5F7485]">·</span>
            <span>Termos e Condições</span>
            <span aria-hidden="true" className="text-[#5F7485]">·</span>
            <span>Política de Privacidade</span>
          </div>
        </div>
      </footer>

      {/* 5. Mobile Fixed Bottom Navigation (Prompt V2: Esportes, Ao Vivo, Casino, Boletim, Perfil) */}
      <BoosBottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        selectionsCount={selections.length}
        onOpenBetSlip={() => setIsMobileBetSlipOpen(true)}
        session={session}
        firebaseUser={firebaseUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* 6. Modals */}
      {/* Auth Modal (Phone + OTP Angola) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        onOpenSmsConfig={() => {
          setIsAuthModalOpen(false);
          setIsSmsModalOpen(true);
        }}
        avatars={avatars}
      />

      {/* Wallet Modal */}
      {session && (
        <WalletModal
          isOpen={isWalletModalOpen}
          onClose={() => setIsWalletModalOpen(false)}
          wallet={session.wallet}
          kycStatus={session.kyc.status}
          onWalletUpdated={newWallet => {
            setSession({
              ...session,
              wallet: newWallet
            });
          }}
          onGoToKyc={() => setActiveTab('kyc')}
        />
      )}

      {/* SMS Gateway Modal */}
      <SmsGatewayModal
        isOpen={isSmsModalOpen}
        onClose={() => setIsSmsModalOpen(false)}
        onStatusUpdated={async () => {
          const status = await apiClient.getSmsGatewayStatus();
          setSmsStatus(status as any);
        }}
      />

      {/* Central de Notificações Push & Alertas */}
      <BoosNotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        onNavigateTab={setActiveTab}
      />

      {/* Toast Flutuante em Tempo Real */}
      <BoosNotificationToast
        onOpenCenter={() => setIsNotificationCenterOpen(true)}
      />

      {/* BOOS BET Welcome Onboarding Modal */}
      <BoosWelcomeModal
        isOpen={isWelcomeModalOpen}
        onClose={() => {
          try {
            localStorage.setItem('boos_welcome_seen', 'true');
          } catch {}
          setIsWelcomeModalOpen(false);
        }}
        onStart={() => {
          try {
            localStorage.setItem('boos_welcome_seen', 'true');
          } catch {}
          setIsWelcomeModalOpen(false);
          setActiveTab('sports');
        }}
      />

      {/* BOOS BET Winning Bet Celebration */}
      {celebrationData && (
        <BoosCelebration
          isOpen={celebrationData.isOpen}
          payoutAmount={celebrationData.payoutAmount}
          betTicketId={celebrationData.betTicketId}
          onClose={() => setCelebrationData(null)}
        />
      )}
    </div>
  );
}
