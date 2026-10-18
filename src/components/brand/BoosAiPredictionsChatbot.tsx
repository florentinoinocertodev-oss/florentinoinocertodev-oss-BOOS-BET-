import React, { useState, useEffect, useRef } from 'react';
import { AiClubAnalysisResult, SportMatch, BetSelection, SessionData } from '../../types';
import { apiClient } from '../../services/api';
import { notificationService } from '../../services/notificationService';
import { BoosButton } from './BoosButton';
import { BoosWinProbabilityGauge } from './BoosWinProbabilityGauge';
import {
  Sparkles,
  Bot,
  Send,
  Flame,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  ShieldAlert,
  Percent,
  TrendingUp,
  ArrowRight,
  Target,
  RefreshCw,
  Coins,
  Lock,
  Layers,
  BarChart2,
  X
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text?: string;
  analysis?: AiClubAnalysisResult;
  timestamp: string;
}

interface BoosAiPredictionsChatbotProps {
  session: SessionData | null;
  onOpenAuth: () => void;
  onOpenWallet: () => void;
  onToggleSelection: (match: SportMatch, type: 'HOME' | 'DRAW' | 'AWAY', odd: number) => void;
  onGoToBettingZone: (matchId?: string) => void;
  selections: BetSelection[];
  onOpenBetSlip?: () => void;
  className?: string;
}

const QUICK_CLUBS = [
  { name: 'Petro de Luanda', league: 'Girabola ZAP' },
  { name: '1º de Agosto', league: 'Girabola ZAP' },
  { name: 'Sagrada Esperança', league: 'Girabola ZAP' },
  { name: 'Wiliete de Benguela', league: 'Girabola ZAP' },
  { name: 'Real Madrid', league: 'Champions League' },
  { name: 'Manchester City', league: 'Champions League' },
  { name: 'Bayern München', league: 'Champions League' },
  { name: 'Arsenal', league: 'Champions League' }
];

export const BoosAiPredictionsChatbot: React.FC<BoosAiPredictionsChatbotProps> = ({
  session,
  onOpenAuth,
  onOpenWallet,
  onToggleSelection,
  onGoToBettingZone,
  selections,
  onOpenBetSlip,
  className = ''
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [freeRemaining, setFreeRemaining] = useState<number>(1);
  const [totalAnalyses, setTotalAnalyses] = useState<number>(0);
  const [costPerAnalysis, setCostPerAnalysis] = useState<number>(200);
  const [paymentConfirmationPending, setPaymentConfirmationPending] = useState<{
    query: string;
    club?: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [liveMatches, setLiveMatches] = useState<SportMatch[]>([]);

  // Load quota & live matches
  const fetchQuotaAndMatches = async () => {
    try {
      const [quotaRes, matchesRes] = await Promise.all([
        apiClient.getAiPredictionQuota(),
        apiClient.getMatches()
      ]);
      setFreeRemaining(quotaRes.freeRemaining);
      setTotalAnalyses(quotaRes.totalCount);
      setCostPerAnalysis(quotaRes.costPerAnalysis || 200);
      if (matchesRes?.matches) {
        setLiveMatches(matchesRes.matches);
      }
    } catch (e) {
      console.warn('Erro ao obter quota ou partidas ao vivo:', e);
    }
  };

  useEffect(() => {
    fetchQuotaAndMatches();
  }, [session]);

  // Initial welcome message
  useEffect(() => {
    setMessages([
      {
        id: 'msg_welcome',
        sender: 'bot',
        text: `Olá! Eu sou o **BOOS AI Predictor**, assistente analítico de previsões desportivas da BOOS BET alimentado por modelos preditivos em tempo real.

⚖️ **Caráter Estritamente Preditivo e Não Determinístico (+18):**
Esta IA opera exclusivamente como ferramenta analítica de apoio à decisão. Apresentamos hipóteses estatísticas e probabilidades calculadas a partir de feeds reais e métricas dos holders. **Cabe a si, utilizador, a decisão soberana de avançar ou não com qualquer aposta.** Não prometemos nem garantimos lucros ou desfechos fixos.

Posso analisar qualquer confronto ou clube do **Girabola ZAP (Angola)** e do **Futebol Internacional**. Escolha uma das equipas abaixo ou digite a sua pergunta sobre um confronto para obter uma análise estatística contextualizada!`,
        timestamp: new Date().toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendQuery = async (queryText: string, clubName?: string, confirmPaid: boolean = false) => {
    if (!queryText.trim() && !clubName) return;

    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text: queryText || `Análise estatística para ${clubName}`,
      timestamp: new Date().toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await apiClient.sendAiPredictionChat({
        query: queryText,
        club: clubName,
        confirmPaid
      });

      if (res.requirePaymentConfirmation) {
        setPaymentConfirmationPending({ query: queryText, club: clubName });
        setLoading(false);
        return;
      }

      const botMsg: ChatMessage = {
        id: `msg_bot_${Date.now()}`,
        sender: 'bot',
        analysis: res.analysis,
        timestamp: new Date().toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
      setFreeRemaining(res.freeRemaining);
      setPaymentConfirmationPending(null);

      if (res.wasFree) {
        notificationService.sendNotification({
          title: '🎁 Análise Grátis Concluída!',
          body: 'A sua 1ª análise inteligente foi gerada com sucesso. As próximas análises terão o custo de 200 Kz.',
          category: 'PROMOTION',
          linkTab: 'sports'
        });
      }
    } catch (err: any) {
      if (err.message && err.message.includes('402')) {
        setPaymentConfirmationPending({ query: queryText, club: clubName });
      } else {
        const errorMsg: ChatMessage = {
          id: `msg_err_${Date.now()}`,
          sender: 'bot',
          text: `⚠️ ${err.message || 'Falha ao processar análise inteligente. Verifique o seu saldo ou tente novamente.'}`,
          timestamp: new Date().toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPaidAnalysis = () => {
    if (!paymentConfirmationPending) return;
    if (!session) {
      onOpenAuth();
      return;
    }
    if (session.wallet.balance < costPerAnalysis) {
      onOpenWallet();
      return;
    }
    handleSendQuery(paymentConfirmationPending.query, paymentConfirmationPending.club, true);
  };

  const handleAddAnalysisTipToSlip = (analysis: AiClubAnalysisResult) => {
    // Procura partida real existente no catálogo de eventos oficiais
    const foundRealMatch = liveMatches.find(m => {
      if (analysis.suggestedMarket.matchId && m.id === analysis.suggestedMarket.matchId) {
        return true;
      }
      const home = m.home_team.toLowerCase();
      const away = m.away_team.toLowerCase();
      const club = analysis.clubName.toLowerCase();
      return home.includes(club) || away.includes(club) || club.includes(home) || club.includes(away);
    });

    if (!foundRealMatch) {
      notificationService.sendNotification({
        title: 'Mercado Indisponível',
        body: `A partida para ${analysis.clubName} não está com cotações abertas no catálogo no momento.`,
        category: 'BET_STATUS',
        linkTab: 'sports'
      });
      return;
    }

    const targetOdd = analysis.suggestedMarket.selectionType === 'HOME'
      ? foundRealMatch.odds.home
      : analysis.suggestedMarket.selectionType === 'DRAW'
      ? foundRealMatch.odds.draw
      : foundRealMatch.odds.away;

    onToggleSelection(
      foundRealMatch,
      analysis.suggestedMarket.selectionType,
      targetOdd
    );

    notificationService.notifyPredictionAdded(
      foundRealMatch.home_team,
      analysis.suggestedMarket.title,
      targetOdd
    );
  };

  return (
    <div
      className={`rounded-3xl bg-[#001426] border border-[#06345A] overflow-hidden flex flex-col shadow-2xl ${className}`}
      style={{ minHeight: '620px' }}
    >
      {/* 1. Header do Chatbot Inteligente */}
      <div className="bg-gradient-to-r from-[#001426] via-[#052848] to-[#001426] border-b border-[#06345A] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FFC21A] to-[#F5A900] text-[#001426] flex items-center justify-center shadow-lg shadow-[#FFC21A]/20">
              <Bot className="w-6 h-6" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-[#001426] rounded-full animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-1.5">
                BOOS AI Predictor
                <Sparkles className="w-3.5 h-3.5 text-[#FFC21A] fill-[#FFC21A]" />
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[#FFC21A]/10 text-[#FFC21A] text-[9px] font-mono font-black border border-[#FFC21A]/30">
                PROGNÓSTICOS IA
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Modelos Estatísticos & Probabilidades de Clubes Angolanos e Mundiais
            </p>
          </div>
        </div>

        {/* Quota Indicator */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {freeRemaining > 0 ? (
            <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-emerald-400/10 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>1 Análise Grátis Disponível</span>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-[#06345A] border border-[#0d4a7c] text-xs font-bold text-slate-200 flex items-center gap-2">
              <Coins className="w-3.5 h-3.5 text-[#FFC21A]" />
              <span>
                {costPerAnalysis} Kz <span className="text-slate-400 font-normal">/ análise</span>
              </span>
              {session && (
                <span className="text-[10px] font-mono text-[#FFC21A] pl-1 border-l border-[#0d4a7c]">
                  Saldo: {session.wallet.balance.toLocaleString('pt-AO')} Kz
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Quick Club Suggestions Pills */}
      <div className="p-3 bg-[#02182b] border-b border-[#06345A]/70 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
        <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap pl-1">
          Clubes em Alta:
        </span>
        {QUICK_CLUBS.map((club, idx) => (
          <button
            key={idx}
            type="button"
            disabled={loading}
            onClick={() => handleSendQuery(`Analisar probabilidades estatísticas para o ${club.name} no ${club.league}`, club.name)}
            className="px-3 py-1 rounded-xl bg-[#06345A]/50 hover:bg-[#06345A] border border-[#0d4a7c] text-slate-200 hover:text-white whitespace-nowrap transition-colors cursor-pointer text-[11px] font-medium shrink-0 active:scale-95"
          >
            {club.name}
          </button>
        ))}
      </div>

      {/* 3. Messages Chat Area */}
      <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 max-h-[500px]">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            {msg.sender === 'user' ? (
              <div className="max-w-[85%] sm:max-w-[70%] bg-gradient-to-r from-[#0d4a7c] to-[#06345A] border border-[#1b629b] text-white p-3.5 rounded-2xl rounded-tr-none text-xs shadow-md space-y-1">
                <p className="leading-relaxed font-medium">{msg.text}</p>
                <div className="text-[9px] font-mono text-slate-400 text-right">
                  {msg.timestamp}
                </div>
              </div>
            ) : msg.analysis ? (
              /* Rich AI Analysis Card */
              <div className="w-full max-w-2xl bg-[#02182b] border border-[#FFC21A]/40 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
                {/* Header da Análise */}
                <div className="flex items-center justify-between gap-2 border-b border-[#06345A] pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-[#FFC21A] tracking-wider font-mono">
                      {msg.analysis.competition}
                    </span>
                    <h4 className="text-base sm:text-lg font-black text-white">
                      {msg.analysis.clubName}
                      {msg.analysis.opponent && ` vs ${msg.analysis.opponent}`}
                    </h4>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-gradient-to-r from-[#FFC21A] to-[#F5A900] text-[#001426] shadow">
                    MODELO BOOS IA
                  </span>
                </div>

                {/* Visual Radial Gauge using Recharts for Win Probability */}
                <BoosWinProbabilityGauge
                  winProbability={msg.analysis.winProbability}
                  drawProbability={msg.analysis.drawProbability}
                  lossProbability={msg.analysis.lossProbability}
                  teamName={msg.analysis.clubName}
                  opponent={msg.analysis.opponent}
                />

                {/* Métricas Chave */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-[#001426] border border-[#06345A]">
                    <span className="text-[10px] text-slate-400">Golos Esperados (xG)</span>
                    <div className="font-mono font-black text-white text-base">
                      {msg.analysis.expectedGoals}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#001426] border border-[#06345A]">
                    <span className="text-[10px] text-slate-400">Ambas Marcam</span>
                    <div className="font-mono font-black text-emerald-400 text-base">
                      {msg.analysis.bothTeamsToScoreProbability}%
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#001426] border border-[#06345A]">
                    <span className="text-[10px] text-slate-400">+2.5 Golos</span>
                    <div className="font-mono font-black text-[#FFC21A] text-base">
                      {msg.analysis.over25Probability}%
                    </div>
                  </div>
                </div>

                {/* Pontos Fortes & Vulnerabilidades */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#001426]/70 border border-emerald-500/20 space-y-1.5">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Pontos Fortes
                    </span>
                    <ul className="space-y-1 text-slate-300 text-[11px]">
                      {msg.analysis.strengths.map((str, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-xl bg-[#001426]/70 border border-amber-500/20 space-y-1.5">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Fragilidades Táticas
                    </span>
                    <ul className="space-y-1 text-slate-300 text-[11px]">
                      {msg.analysis.vulnerabilities.map((vuln, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{vuln}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Análise Explicativa */}
                <p className="text-xs text-slate-300 leading-relaxed italic bg-[#001426] p-3 rounded-xl border border-[#06345A]">
                  "{msg.analysis.detailedSummary}"
                </p>

                {/* Sugestão de Mercado com 1-Click Bet */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#032442] to-[#06345A] border border-[#FFC21A]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-[#FFC21A] uppercase tracking-wider flex items-center gap-1">
                      <Target className="w-3.5 h-3.5" />
                      Mercado Estatístico Sugerido
                    </span>
                    <div className="text-sm font-bold text-white">
                      {msg.analysis.suggestedMarket.title}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-lg text-[#FFC21A] bg-[#001426] px-2.5 py-1 rounded-lg border border-[#06345A]">
                      {msg.analysis.suggestedMarket.odd.toFixed(2)}
                    </span>

                    {(() => {
                      const isSelected = selections.some(
                        s =>
                          s.match_title.includes(msg.analysis!.clubName) &&
                          s.selection === msg.analysis!.suggestedMarket.selectionType
                      );

                      return (
                        <button
                          type="button"
                          onClick={() => handleAddAnalysisTipToSlip(msg.analysis!)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow active:scale-95 ${
                            isSelected
                              ? 'bg-emerald-500 text-white'
                              : 'bg-gradient-to-r from-[#FFC21A] to-[#F5A900] text-[#001426] font-black'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>No Boletim</span>
                            </>
                          ) : (
                            <>
                              <Flame className="w-3.5 h-3.5 fill-[#001426]" />
                              <span>Apostar</span>
                            </>
                          )}
                        </button>
                      );
                    })()}
                  </div>
                </div>

                {/* Banner Obrigatório de Jogo Responsável */}
                <div className="text-[10px] text-slate-400 bg-[#001426] p-2.5 rounded-xl border border-[#06345A] flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="leading-tight">{msg.analysis.disclaimer}</p>
                </div>
              </div>
            ) : (
              /* Texto Padrão */
              <div className="max-w-[90%] sm:max-w-[75%] bg-[#02182b] border border-[#06345A] text-slate-200 p-4 rounded-2xl rounded-tl-none text-xs shadow-md space-y-2">
                <div className="whitespace-pre-line leading-relaxed">{msg.text}</div>
                <div className="text-[9px] font-mono text-slate-400 text-right">
                  {msg.timestamp}
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-[#02182b] border border-[#06345A] text-xs text-slate-300 max-w-sm">
            <RefreshCw className="w-4 h-4 text-[#FFC21A] animate-spin shrink-0" />
            <span>BOOS AI a processar modelos estatísticos e histórico do clube...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. Modal de Confirmação de Pagamento de Análise */}
      {paymentConfirmationPending && (
        <div
          role="dialog"
          aria-modal="true"
          className="p-4 bg-[#021f3a] border-t border-b border-[#FFC21A]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-200"
        >
          <div className="space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-[#FFC21A]" />
              <span>Análise Paga Requerida ({costPerAnalysis} Kz)</span>
            </div>
            <p className="text-slate-300 text-[11px]">
              A sua 1ª análise gratuita já foi utilizada. Deseja realizar esta análise profunda do{' '}
              <span className="text-[#FFC21A] font-bold">
                {paymentConfirmationPending.club || paymentConfirmationPending.query}
              </span>{' '}
              por {costPerAnalysis} Kz debitados da sua carteira?
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setPaymentConfirmationPending(null)}
              className="px-3 py-2 rounded-xl text-slate-300 hover:text-white bg-[#06345A] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmPaidAnalysis}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FFC21A] to-[#F5A900] text-[#001426] font-black cursor-pointer shadow active:scale-95 flex items-center gap-1.5"
            >
              <span>Confirmar ({costPerAnalysis} Kz)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 5. Input Bar */}
      <div className="p-3 sm:p-4 bg-[#001426] border-t border-[#06345A]">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendQuery(inputQuery);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={e => setInputQuery(e.target.value)}
            disabled={loading}
            placeholder="Digite o clube ou jogo a analisar (ex: Petro de Luanda, Wiliete, Real Madrid vs City)..."
            className="flex-1 py-3 px-4 rounded-xl bg-[#02182b] border border-[#06345A] focus:border-[#FFC21A] text-xs text-white placeholder-slate-400 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || loading}
            className="p-3 rounded-xl bg-gradient-to-r from-[#FFC21A] to-[#F5A900] text-[#001426] disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-95 transition-opacity font-bold cursor-pointer active:scale-95 shrink-0"
            title="Enviar mensagem para análise de IA"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export { BoosAiPredictionsChatbot as BoosPredictionAssistant };

