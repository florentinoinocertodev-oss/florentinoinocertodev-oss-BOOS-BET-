import React, { useState, useEffect } from 'react';
import { notificationService, NotificationItem } from '../../services/notificationService';
import { Bell, Trophy, Flame, Sparkles, X } from 'lucide-react';

interface BoosNotificationToastProps {
  onOpenCenter: () => void;
}

export const BoosNotificationToast: React.FC<BoosNotificationToastProps> = ({
  onOpenCenter
}) => {
  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null);

  useEffect(() => {
    const unsubscribe = notificationService.onToast(notif => {
      setActiveToast(notif);
      const timer = setTimeout(() => {
        setActiveToast(prev => (prev?.id === notif.id ? null : prev));
      }, 5000);
      return () => clearTimeout(timer);
    });
    return unsubscribe;
  }, []);

  if (!activeToast) return null;

  const getCategoryIcon = () => {
    switch (activeToast.category) {
      case 'MATCH_RESULT':
        return <Trophy className="w-4 h-4 text-emerald-400" />;
      case 'BET_STATUS':
        return <Flame className="w-4 h-4 text-[#F5A900]" />;
      case 'PROMOTION':
        return <Sparkles className="w-4 h-4 text-[#FFC21A]" />;
      default:
        return <Bell className="w-4 h-4 text-[#FFC21A]" />;
    }
  };

  return (
    <div className="fixed top-18 sm:top-20 right-3 left-3 sm:left-auto sm:right-6 sm:w-96 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
      <div
        onClick={onOpenCenter}
        className="p-4 bg-[#001426]/95 border-2 border-[#F5A900] rounded-2xl shadow-2xl backdrop-blur-md flex items-start gap-3 cursor-pointer group hover:bg-[#06345A]/90 transition-all"
      >
        <div className="w-9 h-9 rounded-xl bg-[#06345A] border border-[#0d4a7c] flex items-center justify-center shrink-0 mt-0.5 shadow">
          {getCategoryIcon()}
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-[#FFC21A]">
              BOOS BET NOTIFICAÇÃO
            </span>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                setActiveToast(null);
              }}
              className="text-slate-400 hover:text-white p-1 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <h5 className="font-extrabold text-white text-xs truncate mt-0.5">
            {activeToast.title}
          </h5>

          <p className="text-[11px] text-slate-300 mt-1 line-clamp-2 leading-relaxed">
            {activeToast.body}
          </p>
        </div>
      </div>
    </div>
  );
};
