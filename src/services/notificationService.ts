/**
 * BOOS BET — Web Notification API & In-App Alert Service
 * Gere permissões de notificações push do navegador, histórico local e alertas em tempo real:
 * - Resultados de jogos (Girabola ZAP, Liga dos Campeões)
 * - Estados de boletins de apostas (Apostas ganhas, liquidadas, confirmadas)
 * - Promoções exclusivas e super odds
 */

export type NotificationCategory = 'MATCH_RESULT' | 'BET_STATUS' | 'PROMOTION';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  timestamp: number;
  read: boolean;
  linkTab?: string;
  data?: any;
}

export interface NotificationPreferences {
  matchResults: boolean;
  betStatus: boolean;
  promotions: boolean;
  soundEnabled: boolean;
}

type NotificationListener = (items: NotificationItem[]) => void;
type ToastListener = (notification: NotificationItem) => void;

const STORAGE_KEY_NOTIFICATIONS = 'boos_bet_notifications_v1';
const STORAGE_KEY_PREFS = 'boos_bet_notif_prefs_v1';

class NotificationService {
  private notifications: NotificationItem[] = [];
  private preferences: NotificationPreferences = {
    matchResults: true,
    betStatus: true,
    promotions: true,
    soundEnabled: true
  };
  private listeners: Set<NotificationListener> = new Set();
  private toastListeners: Set<ToastListener> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const savedPrefs = localStorage.getItem(STORAGE_KEY_PREFS);
      if (savedPrefs) {
        this.preferences = { ...this.preferences, ...JSON.parse(savedPrefs) };
      }

      const savedNotifs = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
      if (savedNotifs) {
        this.notifications = JSON.parse(savedNotifs);
      } else {
        // Inicializar com notificações de boas-vindas do sistema BOOS BET
        this.notifications = [
          {
            id: 'notif_welcome',
            title: '👑 Bem-vindo à BOOS BET Angola!',
            body: 'A Casa Oficial do Jogador Rei. Aproveite o bónus de boas-vindas e Super Odds no Girabola ZAP.',
            category: 'PROMOTION',
            timestamp: Date.now() - 1000 * 60 * 30, // 30 min atrás
            read: false,
            linkTab: 'sports'
          },
          {
            id: 'notif_girabola_live',
            title: '⚽ Girabola ZAP: Petro vs 1º de Agosto',
            body: 'O grande clássico de Luanda está AO VIVO com Super Odds de 2.40!',
            category: 'MATCH_RESULT',
            timestamp: Date.now() - 1000 * 60 * 15,
            read: false,
            linkTab: 'sports'
          }
        ];
        this.saveNotifications();
      }
    } catch (e) {
      console.error('Erro ao carregar notificações do armazenamento:', e);
    }
  }

  private saveNotifications() {
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(this.notifications));
      this.notifyListeners();
    } catch (e) {
      console.error('Erro ao guardar notificações:', e);
    }
  }

  private savePreferences() {
    try {
      localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(this.preferences));
    } catch (e) {
      console.error('Erro ao guardar preferências de notificação:', e);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(fn => fn([...this.notifications]));
  }

  /**
   * Verifica se o navegador suporta a Web Notification API
   */
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Obtém o estado atual da permissão de notificações do navegador
   */
  public getPermission(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  /**
   * Solicita permissão ao utilizador através do prompt nativo do navegador
   */
  public async requestPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (!this.isSupported()) return 'unsupported';

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.sendNotification({
          title: '🔔 Notificações Ativadas com Sucesso!',
          body: 'Receberá alertas em tempo real sobre golos do Girabola, estados de apostas e promoções.',
          category: 'PROMOTION',
          linkTab: 'sports'
        });
      }
      return permission;
    } catch (e) {
      console.error('Erro ao solicitar permissão de notificações:', e);
      return 'denied';
    }
  }

  /**
   * Toca som sutil de alerta com Web Audio API
   */
  public playAlertSound() {
    if (!this.preferences.soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, audioCtx.currentTime + 0.12); // G5

      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.28);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.28);
    } catch {
      // AudioContext não permitido antes de interação
    }
  }

  /**
   * Envia uma notificação (Web Notification API se concedido + histórico interno + toast)
   */
  public sendNotification(item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>): NotificationItem | null {
    // Verificar filtro de preferências
    if (item.category === 'MATCH_RESULT' && !this.preferences.matchResults) return null;
    if (item.category === 'BET_STATUS' && !this.preferences.betStatus) return null;
    if (item.category === 'PROMOTION' && !this.preferences.promotions) return null;

    const newNotification: NotificationItem = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      read: false,
      ...item
    };

    // Adiciona ao topo do histórico
    this.notifications.unshift(newNotification);
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }
    this.saveNotifications();

    // Tocar áudio
    this.playAlertSound();

    // 1. Web Notification API do navegador nativa (se suportada e permitida)
    if (this.isSupported() && Notification.permission === 'granted') {
      try {
        const nativeNotif = new Notification(newNotification.title, {
          body: newNotification.body,
          icon: '/assets/brand/boos_mascot_symbol.svg',
          badge: '/assets/brand/boos_favicon.svg',
          tag: newNotification.category
        });

        nativeNotif.onclick = () => {
          window.focus();
          nativeNotif.close();
        };
      } catch (e) {
        console.warn('Falha ao instanciar Web Notification nativa:', e);
      }
    }

    // 2. Disparar toast in-app para exibição imediata na interface
    this.toastListeners.forEach(fn => fn(newNotification));

    return newNotification;
  }

  // Atalhos práticos para eventos do sistema:

  public notifyBetPlaced(ticketId: string, potentialPayout: number, stake: number) {
    this.sendNotification({
      title: `🎟️ Aposta Registada (#${ticketId})`,
      body: `Aposta de ${stake.toLocaleString('pt-AO')} Kz confirmada. Retorno potencial: ${potentialPayout.toLocaleString('pt-AO')} Kz.`,
      category: 'BET_STATUS',
      linkTab: 'sports',
      data: { ticketId, potentialPayout, stake }
    });
  }

  public notifyBetWon(ticketId: string, payout: number) {
    this.sendNotification({
      title: '🎉 BOLETIM PREMIADO! Parabéns!',
      body: `O seu bilhete #${ticketId} venceu! Foram creditados ${payout.toLocaleString('pt-AO')} Kz na sua carteira.`,
      category: 'BET_STATUS',
      linkTab: 'sports',
      data: { ticketId, payout }
    });
  }

  public notifyGoal(matchTitle: string, minute: number, score: string) {
    this.sendNotification({
      title: `⚽ GOLO no Girabola ZAP! (${minute}')`,
      body: `${matchTitle} — Novo resultado: ${score}`,
      category: 'MATCH_RESULT',
      linkTab: 'sports',
      data: { matchTitle, minute, score }
    });
  }

  public notifyPromo(title: string, body: string) {
    this.sendNotification({
      title,
      body,
      category: 'PROMOTION',
      linkTab: 'sports'
    });
  }

  public notifyPredictionAdded(matchTitle: string, tipTitle: string, odd: number) {
    this.sendNotification({
      title: '⚡ Previsão Adicionada ao Boletim!',
      body: `${tipTitle} (${matchTitle}) com odd ${odd.toFixed(2)} selecionada para aposta.`,
      category: 'BET_STATUS',
      linkTab: 'sports',
      data: { matchTitle, tipTitle, odd }
    });
  }

  // Gestão de itens
  public markAsRead(id: string) {
    const item = this.notifications.find(n => n.id === id);
    if (item && !item.read) {
      item.read = true;
      this.saveNotifications();
    }
  }

  public markAllAsRead() {
    this.notifications.forEach(n => (n.read = true));
    this.saveNotifications();
  }

  public clearAll() {
    this.notifications = [];
    this.saveNotifications();
  }

  public getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  public getNotifications(): NotificationItem[] {
    return [...this.notifications];
  }

  public getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  public updatePreferences(newPrefs: Partial<NotificationPreferences>) {
    this.preferences = { ...this.preferences, ...newPrefs };
    this.savePreferences();
  }

  // Inscrições
  public subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    listener([...this.notifications]);
    return () => this.listeners.delete(listener);
  }

  public onToast(listener: ToastListener): () => void {
    this.toastListeners.add(listener);
    return () => this.toastListeners.delete(listener);
  }
}

export const notificationService = new NotificationService();
