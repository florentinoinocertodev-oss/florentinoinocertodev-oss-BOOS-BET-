import React, { useState, useEffect } from 'react';
import {
  notificationService,
  NotificationItem,
  NotificationCategory,
  NotificationPreferences
} from '../../services/notificationService';
import { BoosButton } from './BoosButton';
import {
  Bell,
  BellRing,
  CheckCheck,
  Trash2,
  X,
  Volume2,
  VolumeX,
  Settings,
  Sparkles,
  Trophy,
  Flame,
  Rocket,
  ShieldCheck,
  AlertTriangle,
  Play,
  Check
} from 'lucide-react';

interface BoosNotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const BoosNotificationCenter: React.FC<BoosNotificationCenterProps> = ({
  isOpen,
  onClose,
  onNavigateTab
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    notificationService.getPreferences()
  );
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    notificationService.getPermission()
  );
  const [activeCategory, setActiveCategory] = useState<NotificationCategory | 'ALL'>('ALL');
  const [showSettings, setShowSettings] = useState(false);
  const [requestingPermission, setRequestingPermission] = useState(false);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(items => {
      setNotifications(items);
    });
    setPermission(notificationService.getPermission());
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    setRequestingPermission(true);
    try {
      const res = await notificationService.requestPermission();
      setPermission(res);
    } finally {
      setRequestingPermission(false);
    }
  };

  const handleTogglePref = (key: keyof NotificationPreferences) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    notificationService.updatePreferences(updated);
  };

  // Test triggers
  const triggerTestGoal = () => {
    notificationService.notifyGoal('Petro de Luanda 2 - 1 1º de Agosto', 78, '2 - 1');
  };

  const triggerTestBetWin = () => {
    const testId = Math.floor(1000 + Math.random() * 9000).toString();
    notificationService.notifyBetWon(testId, 45200);
  };

  const triggerTestPromo = () => {
    notificationService.notifyPromo(
      '👑 Super Odds do Fim de Semana!',
      'Multiplicadores turbinados em +20% no clássico do Girabola e bónus Multicaixa Express.'
    );
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeCategory === 'ALL') return true;
    return n.category === activeCategory;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'MATCH_RESULT':
        return <Trophy className="w-4 h-4 text-emerald-400" />;
      case 'BET_STATUS':
        return <Flame className="w-4 h-4 text-[#F5A900]" />;
      case 'PROMOTION':
        return <Sparkles className="w-4 h-4 text-[#FFC21A]" />;
      default:
        return <Bell className="w-4 h-4 text-slate-300" />;
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const diffSeconds = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSeconds < 60) return 'Agora mesmo';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `Há ${diffMinutes} min`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Há ${diffHours} h`;
    return new Date(timestamp).toLocaleDateString('pt-AO');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#001426] border border-[#06345A] rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#06345A] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#06345A] border border-[#0d4a7c] flex items-center justify-center text-[#FFC21A]">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Notificações Push
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-[#FFC21A] to-[#F5A900] text-[#001426] font-mono font-black text-[10px]">
                    {unreadCount} novas
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Web Notification API · Alertas em tempo real
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                showSettings
                  ? 'bg-[#F5A900] text-[#001426]'
                  : 'text-slate-400 hover:text-white hover:bg-[#06345A]'
              }`}
              title="Preferências de notificação"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-[#06345A] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Browser Web Notification API Banner */}
        <div className="pt-3 pb-2 shrink-0">
          {permission === 'granted' ? (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold">
                  Notificações do navegador ativas
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400/80">
                Web Notification API
              </span>
            </div>
          ) : permission === 'denied' ? (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-2xl flex items-center gap-2 text-xs text-rose-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>
                Notificações bloqueadas no navegador. Receberá os alertas diretamente na aplicação.
              </span>
            </div>
          ) : (
            <div className="p-3 bg-gradient-to-r from-[#06345A]/90 to-[#001426] border border-[#F5A900]/50 rounded-2xl flex items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-white block">
                  Ativar Notificações no Dispositivo
                </span>
                <span className="text-[11px] text-slate-300">
                  Receba avisos de golos, resultados e boletins premiados instantaneamente.
                </span>
              </div>
              <button
                type="button"
                onClick={handleRequestPermission}
                disabled={requestingPermission}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FFC21A] to-[#F5A900] text-[#001426] font-extrabold text-xs shrink-0 shadow-md hover:brightness-110 cursor-pointer active:scale-95 transition-all"
              >
                {requestingPermission ? 'A solicitar...' : 'Ativar'}
              </button>
            </div>
          )}
        </div>

        {/* Settings Panel (Collapsible) */}
        {showSettings && (
          <div className="p-3.5 my-2 bg-[#06345A]/30 border border-[#06345A] rounded-2xl space-y-3 shrink-0 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs font-bold text-white pb-1.5 border-b border-[#06345A]">
              <span>Preferências de Alerta</span>
              <span className="text-[10px] text-slate-400 font-normal">
                Personalize o que deseja receber
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.matchResults}
                  onChange={() => handleTogglePref('matchResults')}
                  className="rounded text-[#F5A900] focus:ring-0 bg-[#001426] border-[#06345A]"
                />
                <span>Resultados de Jogos</span>
              </label>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.betStatus}
                  onChange={() => handleTogglePref('betStatus')}
                  className="rounded text-[#F5A900] focus:ring-0 bg-[#001426] border-[#06345A]"
                />
                <span>Estados de Boletins</span>
              </label>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.promotions}
                  onChange={() => handleTogglePref('promotions')}
                  className="rounded text-[#F5A900] focus:ring-0 bg-[#001426] border-[#06345A]"
                />
                <span>Promoções & Bónus</span>
              </label>

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.soundEnabled}
                  onChange={() => handleTogglePref('soundEnabled')}
                  className="rounded text-[#F5A900] focus:ring-0 bg-[#001426] border-[#06345A]"
                />
                <span>Sons de Alerta</span>
              </label>
            </div>

            {/* Test Triggers Area */}
            <div className="pt-2 border-t border-[#06345A] flex items-center justify-between flex-wrap gap-2 text-[11px]">
              <span className="text-slate-400 font-semibold">Testar Alertas:</span>
              <div className="flex gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={triggerTestGoal}
                  className="px-2 py-1 bg-[#06345A] hover:bg-[#083d6a] text-slate-200 rounded-lg cursor-pointer"
                >
                  ⚽ Golo Girabola
                </button>
                <button
                  type="button"
                  onClick={triggerTestBetWin}
                  className="px-2 py-1 bg-[#06345A] hover:bg-[#083d6a] text-slate-200 rounded-lg cursor-pointer"
                >
                  🎟️ Boletim Ganho
                </button>
                <button
                  type="button"
                  onClick={triggerTestPromo}
                  className="px-2 py-1 bg-[#06345A] hover:bg-[#083d6a] text-slate-200 rounded-lg cursor-pointer"
                >
                  👑 Super Odd
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 py-2 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setActiveCategory('ALL')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeCategory === 'ALL'
                ? 'bg-[#FFC21A] text-[#001426]'
                : 'bg-[#06345A]/50 text-slate-300 hover:text-white'
            }`}
          >
            Todas ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('BET_STATUS')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeCategory === 'BET_STATUS'
                ? 'bg-[#FFC21A] text-[#001426]'
                : 'bg-[#06345A]/50 text-slate-300 hover:text-white'
            }`}
          >
            Boletins
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('MATCH_RESULT')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeCategory === 'MATCH_RESULT'
                ? 'bg-[#FFC21A] text-[#001426]'
                : 'bg-[#06345A]/50 text-slate-300 hover:text-white'
            }`}
          >
            Resultados
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('PROMOTION')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeCategory === 'PROMOTION'
                ? 'bg-[#FFC21A] text-[#001426]'
                : 'bg-[#06345A]/50 text-slate-300 hover:text-white'
            }`}
          >
            Promoções
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 my-2 pr-1 no-scrollbar">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs space-y-2">
              <Bell className="w-8 h-8 mx-auto text-slate-500 opacity-40" />
              <p>Nenhuma notificação encontrada nesta categoria.</p>
              <p className="text-[11px] text-slate-500">
                Os alertas de golos, apostas e prémios aparecerão aqui.
              </p>
            </div>
          ) : (
            filteredNotifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => {
                  notificationService.markAsRead(notif.id);
                  if (notif.linkTab && onNavigateTab) {
                    onNavigateTab(notif.linkTab);
                    onClose();
                  }
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none relative group ${
                  notif.read
                    ? 'bg-[#06345A]/25 border-[#06345A]/60 hover:bg-[#06345A]/40'
                    : 'bg-[#06345A]/60 border-[#F5A900]/40 hover:border-[#FFC21A] shadow-md'
                }`}
              >
                {!notif.read && (
                  <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#FFC21A] shadow-sm shadow-[#FFC21A]/80" />
                )}

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#001426] border border-[#06345A] flex items-center justify-center shrink-0 mt-0.5">
                    {getCategoryIcon(notif.category)}
                  </div>

                  <div className="flex-1 overflow-hidden pr-3">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-white text-xs truncate">
                        {notif.title}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {formatTimeAgo(notif.timestamp)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {notif.body}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom Actions */}
        <div className="pt-3 border-t border-[#06345A] flex items-center justify-between text-xs text-slate-400 shrink-0">
          <button
            type="button"
            onClick={() => notificationService.markAllAsRead()}
            disabled={unreadCount === 0}
            className="flex items-center gap-1.5 hover:text-white transition-colors disabled:opacity-40 cursor-pointer"
          >
            <CheckCheck className="w-4 h-4 text-[#FFC21A]" />
            <span>Marcar lidas</span>
          </button>

          <button
            type="button"
            onClick={() => notificationService.clearAll()}
            disabled={notifications.length === 0}
            className="flex items-center gap-1.5 hover:text-rose-400 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpar histórico</span>
          </button>
        </div>
      </div>
    </div>
  );
};
