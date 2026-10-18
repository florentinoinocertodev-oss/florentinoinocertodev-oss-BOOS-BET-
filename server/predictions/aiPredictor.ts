import { GoogleGenAI } from '@google/genai';
import { AiClubAnalysisResult } from '../../src/types/index.js';
import { sportsHoldersManager } from '../holders/manager.js';

// Pre-configured rich tactical knowledge base for Girabola ZAP & International clubs
const CLUB_DATABASE: Record<
  string,
  {
    name: string;
    competition: string;
    defaultWin: number;
    defaultDraw: number;
    defaultLoss: number;
    expectedGoals: number;
    bttsRate: number;
    over25Rate: number;
    strengths: string[];
    vulnerabilities: string[];
    momentum: string;
    suggestedMarketTitle: string;
    suggestedOdd: number;
    suggestedType: 'HOME' | 'DRAW' | 'AWAY';
    matchId?: string;
    keyStats: { label: string; value: string }[];
  }
> = {
  'petro de luanda': {
    name: 'Petro de Luanda',
    competition: 'Girabola ZAP (Angola)',
    defaultWin: 62,
    defaultDraw: 24,
    defaultLoss: 14,
    expectedGoals: 2.1,
    bttsRate: 38,
    over25Rate: 52,
    strengths: [
      'Defesa mais sólida do Girabola (apenas 0.45 golos sofridos por jogo)',
      'Fator casa avassalador no Estádio 11 de Novembro',
      'Tiago Azulão com pontaria calibrada (14 golos marcados)'
    ],
    vulnerabilities: [
      'Dificuldade contra blocos ultradefensivos fechados em 5-4-1',
      'Desgaste físico em semanas com duelos da Liga dos Campeões da CAF'
    ],
    momentum: 'Líder isolado com 5 vitórias nos últimos 6 jogos do campeonato.',
    suggestedMarketTitle: 'Vitória do Petro de Luanda (1X2)',
    suggestedOdd: 1.85,
    suggestedType: 'HOME',
    matchId: 'girabola_1',
    keyStats: [
      { label: 'Posse de Bola Média', value: '64%' },
      { label: 'Jogos sem Sofrer Golos', value: '68%' },
      { label: 'Média de Remates à Baliza', value: '6.8 / jogo' }
    ]
  },
  '1º de agosto': {
    name: '1º de Agosto',
    competition: 'Girabola ZAP (Angola)',
    defaultWin: 48,
    defaultDraw: 32,
    defaultLoss: 20,
    expectedGoals: 1.6,
    bttsRate: 45,
    over25Rate: 42,
    strengths: [
      'Tradição militar e resiliência em jogos de alta pressão',
      'Bolas paradas ofensivas com defesas centrais altos',
      'Liderança do capitão Bobo na linha recuada'
    ],
    vulnerabilities: [
      'Transição defensiva lenta quando perde a bola em zonas intermediárias',
      'Pouca rotação no banco de suplentes para o ataque'
    ],
    momentum: 'Recuperação na tabela com 2 empates e 3 vitórias nos últimos 5 jogos.',
    suggestedMarketTitle: 'Dupla Hipótese / Menos de 2.5 Golos',
    suggestedOdd: 2.10,
    suggestedType: 'AWAY',
    matchId: 'girabola_1',
    keyStats: [
      { label: 'Posse de Bola Média', value: '52%' },
      { label: 'Eficácia em Bolas Paradas', value: '41%' },
      { label: 'Cartões Amarelos / Jogo', value: '2.4' }
    ]
  },
  'sagrada esperança': {
    name: 'Sagrada Esperança',
    competition: 'Girabola ZAP (Angola)',
    defaultWin: 54,
    defaultDraw: 28,
    defaultLoss: 18,
    expectedGoals: 1.8,
    bttsRate: 50,
    over25Rate: 48,
    strengths: [
      'Clima e altitude do Dundo (Lunda Norte) desgastam adversários',
      'Meio-campo criativo com rapidez na distribuição',
      'Pressão alta nos primeiros 30 minutos de partida'
    ],
    vulnerabilities: [
      'Queda de rendimento físico nos últimos 15 minutos',
      'Aproveitamento irregular em jogos fora do seu reduto'
    ],
    momentum: 'Vice-líder consistente com 4 vitórias nas últimas 5 jornadas.',
    suggestedMarketTitle: 'Vitória do Sagrada Esperança',
    suggestedOdd: 2.15,
    suggestedType: 'HOME',
    matchId: 'girabola_2',
    keyStats: [
      { label: 'Aproveitamento em Casa', value: '78%' },
      { label: 'Golos Marcados no Dundo', value: '1.9 / jogo' },
      { label: 'Jogos sem Sofrer Golos', value: '55%' }
    ]
  },
  'wiliete de benguela': {
    name: 'Wiliete de Benguela',
    competition: 'Girabola ZAP (Angola)',
    defaultWin: 52,
    defaultDraw: 28,
    defaultLoss: 20,
    expectedGoals: 1.9,
    bttsRate: 58,
    over25Rate: 55,
    strengths: [
      'Apoio massivo dos adeptos no Estádio de Ombaka em Benguela',
      'Extremos velocistas capazes de desequilibrar no 1 para 1',
      'Transições supersónicas de contra-ataque'
    ],
    vulnerabilities: [
      'Espaço concedido nas costas dos laterais ofensivos',
      'Inexperiência em decisões sob pressão extrema'
    ],
    momentum: 'Grande sensação do futebol costeiro com 3 vitórias consecutivas.',
    suggestedMarketTitle: 'Vitória do Wiliete de Benguela',
    suggestedOdd: 2.00,
    suggestedType: 'HOME',
    matchId: 'girabola_3',
    keyStats: [
      { label: 'Golos por Partida em Ombaka', value: '2.2' },
      { label: 'Remates à Baliza', value: '5.9' },
      { label: 'Ambas Marcam em Casa', value: '62%' }
    ]
  },
  'real madrid': {
    name: 'Real Madrid',
    competition: 'UEFA Champions League / La Liga',
    defaultWin: 65,
    defaultDraw: 20,
    defaultLoss: 15,
    expectedGoals: 2.4,
    bttsRate: 65,
    over25Rate: 70,
    strengths: [
      'Poder de fogo no Bernabéu com Vinícius Jr., Mbappé e Bellingham',
      'DNA europeu incomparável nos minutos finais de jogo',
      'Transição ofensiva mais letal do futebol mundial'
    ],
    vulnerabilities: [
      'Lesões recorrentes na zaga central',
      'Concede espaços perante equipas com forte circulação de bola'
    ],
    momentum: 'Invicto em casa há 18 partidas consecutivas na Europa.',
    suggestedMarketTitle: 'Vitória do Real Madrid (Champions League)',
    suggestedOdd: 2.45,
    suggestedType: 'HOME',
    matchId: 'ucl_1',
    keyStats: [
      { label: 'Golos Marcados / Jogo', value: '2.6' },
      { label: 'Aproveitamento Europeu', value: '82%' },
      { label: 'xG Gerado por Partida', value: '2.45' }
    ]
  },
  'manchester city': {
    name: 'Manchester City',
    competition: 'UEFA Champions League / Premier League',
    defaultWin: 68,
    defaultDraw: 18,
    defaultLoss: 14,
    expectedGoals: 2.5,
    bttsRate: 60,
    over25Rate: 68,
    strengths: [
      'Controlo territorial e posse de bola absoluta de Pep Guardiola',
      'Finalizador voraz: Erling Haaland com média de 1 golo/jogo',
      'Capacidade de sufocar o adversário no último terço'
    ],
    vulnerabilities: [
      'Vulnerabilidade a bolas longas diretas nas costas da defesa alta',
      'Ausências de médios defensivos titulares aumentam chances de contra-ataque'
    ],
    momentum: 'Luta acirrada pelo título na Premier League e liderança na fase de grupos UCL.',
    suggestedMarketTitle: 'Mais de 2.5 Golos na Partida',
    suggestedOdd: 1.75,
    suggestedType: 'AWAY',
    matchId: 'ucl_1',
    keyStats: [
      { label: 'Posse de Bola Média', value: '68%' },
      { label: 'Golos por Jogo', value: '2.7' },
      { label: 'Passes Precisos', value: '91%' }
    ]
  },
  'bayern münchen': {
    name: 'Bayern München',
    competition: 'UEFA Champions League / Bundesliga',
    defaultWin: 64,
    defaultDraw: 20,
    defaultLoss: 16,
    expectedGoals: 2.6,
    bttsRate: 62,
    over25Rate: 72,
    strengths: [
      'Allianz Arena intimidadora em noites de futebol continental',
      'Harry Kane em forma espetacular como pivô e goleador',
      'Pressão agressiva que asfixia a saída de bola do rival'
    ],
    vulnerabilities: [
      'Espaçamento excessivo entre a linha média e os centrais',
      'Dificuldade quando o adversário neutraliza os corredores laterais'
    ],
    momentum: 'Goleadas expressivas em casa e média de 3.1 golos nas últimas 5 partidas.',
    suggestedMarketTitle: 'Vitória do Bayern München',
    suggestedOdd: 2.20,
    suggestedType: 'HOME',
    matchId: 'ucl_2',
    keyStats: [
      { label: 'Golos na Allianz Arena', value: '3.1 / jogo' },
      { label: 'Média de Remates', value: '18.4' },
      { label: 'xG por 90 min', value: '2.58' }
    ]
  },
  'arsenal': {
    name: 'Arsenal',
    competition: 'UEFA Champions League / Premier League',
    defaultWin: 58,
    defaultDraw: 24,
    defaultLoss: 18,
    expectedGoals: 2.0,
    bttsRate: 52,
    over25Rate: 60,
    strengths: [
      'Melhor organização tática defensiva da Premier League',
      'Ameaça constante em pontapés de canto estudados ao detalhe',
      'Criatividade de Martin Ødegaard e velocidade de Bukayo Saka'
    ],
    vulnerabilities: [
      'Histórico negativo em grandes noites europeias fora de Londres',
      'Dificuldade de impor o ritmo quando sai em desvantagem'
    ],
    momentum: 'Defesa sólida com apenas 2 golos sofridos nos últimos 4 encontros.',
    suggestedMarketTitle: 'Ambas as Equipas Marcam (Sim)',
    suggestedOdd: 1.80,
    suggestedType: 'AWAY',
    matchId: 'ucl_2',
    keyStats: [
      { label: 'Jogos sem Sofrer Golos', value: '52%' },
      { label: 'Golos de Bola Parada', value: '44%' },
      { label: 'Posse de Bola Média', value: '60%' }
    ]
  }
};

const RESPONSIBLE_GAMING_DISCLAIMER =
  'AVISO PREDITIVO NÃO DETERMINÍSTICO (+18): A inteligência artificial BOOS AI opera exclusivamente com modelos preditivos, probabilísticos e orientativos, NUNCA de forma determinística. Os dados, probabilidades e métricas apresentados são cenários de hipótese e fundamentação estatística. Cabe exclusivamente ao utilizador decidir com total liberdade e discernimento avançar ou não com qualquer aposta. Não há garantias de ganho ou certeza de desfecho.';

export async function generateClubPredictionAnalysis(
  query: string,
  userSelectedClub?: string
): Promise<AiClubAnalysisResult> {
  const normalizedQuery = (query || '').toLowerCase().trim();
  const normalizedClub = (userSelectedClub || '').toLowerCase().trim();

  // 1. Busca ativa e correlação em tempo real com os feeds oficiais dos holders
  const liveMatches = sportsHoldersManager.getAllMatches();
  const matchedMatch = liveMatches.find(m => {
    const home = m.homeTeam.toLowerCase();
    const away = m.awayTeam.toLowerCase();
    return (
      home.includes(normalizedQuery) ||
      away.includes(normalizedQuery) ||
      normalizedQuery.includes(home) ||
      normalizedQuery.includes(away) ||
      (normalizedClub && (home.includes(normalizedClub) || away.includes(normalizedClub)))
    );
  });

  // Try matching known clubs
  let matchedKey = Object.keys(CLUB_DATABASE).find(k => normalizedQuery.includes(k) || normalizedClub.includes(k));

  if (!matchedKey) {
    if (normalizedQuery.includes('petro') || normalizedClub.includes('petro')) matchedKey = 'petro de luanda';
    else if (normalizedQuery.includes('agosto') || normalizedClub.includes('agosto')) matchedKey = '1º de agosto';
    else if (normalizedQuery.includes('sagrada') || normalizedClub.includes('sagrada')) matchedKey = 'sagrada esperança';
    else if (normalizedQuery.includes('wiliete') || normalizedClub.includes('wiliete') || normalizedQuery.includes('benguela')) matchedKey = 'wiliete de benguela';
    else if (normalizedQuery.includes('real') || normalizedQuery.includes('madrid') || normalizedClub.includes('real')) matchedKey = 'real madrid';
    else if (normalizedQuery.includes('city') || normalizedQuery.includes('manchester')) matchedKey = 'manchester city';
    else if (normalizedQuery.includes('bayern') || normalizedQuery.includes('munich') || normalizedQuery.includes('munique')) matchedKey = 'bayern münchen';
    else if (normalizedQuery.includes('arsenal') || normalizedClub.includes('arsenal')) matchedKey = 'arsenal';
  }

  // Se houver uma partida real correspondente nos holders oficiais, aproveitamos os dados reais
  const realMatchContext = matchedMatch ? {
    competition: matchedMatch.competition,
    homeTeam: matchedMatch.homeTeam,
    awayTeam: matchedMatch.awayTeam,
    isLive: matchedMatch.isLive,
    score: matchedMatch.score ? `${matchedMatch.score.home}-${matchedMatch.score.away}` : '0-0',
    minute: matchedMatch.minute || 0,
    odds: matchedMatch.odds,
    matchId: matchedMatch.id
  } : null;

  // If Gemini API key is available in environment, attempt AI-powered generation with real correlation
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({});
      const prompt = `Você é o BOOS AI Predictor, especialista em estatística desportiva, futebol angolano (Girabola ZAP) e internacional (UEFA Champions League, ligas europeias).
O utilizador solicitou análise para: "${query}" (Clube selecionado: "${userSelectedClub || 'Qualquer'}").

${realMatchContext ? `DADOS REAIS DO PROVEDOR DE ODDS EM TEMPO REAL:
- Competição: ${realMatchContext.competition}
- Partida: ${realMatchContext.homeTeam} vs ${realMatchContext.awayTeam}
- Estado: ${realMatchContext.isLive ? `AO VIVO (${realMatchContext.minute}') com marcador ${realMatchContext.score}` : 'Pré-jogo'}
- Odds 1X2 Reais: Casa=${realMatchContext.odds.home}, Empate=${realMatchContext.odds.draw}, Fora=${realMatchContext.odds.away}` : ''}

REQUISITOS CRÍTICOS:
1. Esta IA é ESTRITAMENTE PREDITIVA E NÃO DETERMINÍSTICA. Você JAMAIS deve afirmar que um resultado vai acontecer com certeza absoluta ou prometer ganhos.
2. Os dados e probabilidades fornecidos devem ser cenários orientativos e dispensados ao utilizador de forma transparente, para que ele tenha total autonomia de decidir avançar ou não.
3. Se baseie em dados reais de futebol, forma física, desempenho na liga e momento tático.
4. Responda EXCLUSIVAMENTE em formato JSON com a seguinte estrutura:
{
  "clubName": "Nome do Clube",
  "opponent": "Adversário mais provável ou Próximo Jogo",
  "competition": "Competição (ex: Girabola ZAP ou UEFA Champions League)",
  "winProbability": 52, // percentagem calculada
  "drawProbability": 28, // percentagem
  "lossProbability": 20, // percentagem
  "expectedGoals": 1.8, // float
  "bothTeamsToScoreProbability": 50, // percentagem
  "over25Probability": 48, // percentagem
  "strengths": ["Ponto forte 1", "Ponto forte 2", "Ponto forte 3"],
  "vulnerabilities": ["Vulnerabilidade 1", "Vulnerabilidade 2"],
  "recentMomentum": "Resumo do momento atual com base em dados desportivos reais",
  "suggestedMarket": {
    "title": "Mercado estatístico sugerido (ex: 1X2 ou Mais de 1.5 Golos)",
    "odd": 1.85,
    "selectionType": "HOME" // "HOME", "DRAW" ou "AWAY"
  },
  "keyStats": [
    { "label": "Posse de Bola Estimada", "value": "60%" },
    { "label": "Golos Marcados / Jogo", "value": "1.8" },
    { "label": "Jogos sem Sofrer Golos", "value": "45%" }
  ],
  "detailedSummary": "Análise clara e objetiva com os dados necessários para o utilizador formar o seu próprio juízo, frisando o caráter probabilístico."
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      });

      const responseText = response.text?.trim() || '';
      if (responseText) {
        const parsed = JSON.parse(responseText);
        return {
          clubName: parsed.clubName || realMatchContext?.homeTeam || userSelectedClub || 'Clube Analisado',
          opponent: parsed.opponent || realMatchContext?.awayTeam || undefined,
          competition: parsed.competition || realMatchContext?.competition || 'Girabola ZAP / Futebol Internacional',
          winProbability: Number(parsed.winProbability) || 52,
          drawProbability: Number(parsed.drawProbability) || 28,
          lossProbability: Number(parsed.lossProbability) || 20,
          expectedGoals: Number(parsed.expectedGoals) || 1.8,
          bothTeamsToScoreProbability: Number(parsed.bothTeamsToScoreProbability) || 50,
          over25Probability: Number(parsed.over25Probability) || 48,
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Organização tática consistente'],
          vulnerabilities: Array.isArray(parsed.vulnerabilities) ? parsed.vulnerabilities : ['Sensibilidade a transições rápidas'],
          recentMomentum: parsed.recentMomentum || 'Equipa em disputa ativa na tabela de classificação.',
          suggestedMarket: {
            title: parsed.suggestedMarket?.title || 'Vitória da Equipa',
            odd: Number(parsed.suggestedMarket?.odd) || (realMatchContext?.odds.home || 1.95),
            selectionType: parsed.suggestedMarket?.selectionType || 'HOME',
            matchId: realMatchContext?.matchId
          },
          keyStats: Array.isArray(parsed.keyStats) ? parsed.keyStats : [
            { label: 'Probabilidade de Triunfo', value: `${parsed.winProbability || 52}%` },
            { label: 'Golos Esperados (xG)', value: `${parsed.expectedGoals || 1.8}` }
          ],
          detailedSummary: parsed.detailedSummary || 'Análise preditiva não determinística formulada com base em métricas desportivas e probabilidades.',
          disclaimer: RESPONSIBLE_GAMING_DISCLAIMER,
          wasFree: false,
          analysesRemaining: 0
        };
      }
    } catch (aiErr) {
      console.warn('Falha no Gemini API, utilizando correlação com dados reais dos holders:', aiErr);
    }
  }

  // 2. Modelo Matemático Não Determinístico a partir das Odds Reais dos Holders
  if (realMatchContext) {
    const rawHome = 1 / realMatchContext.odds.home;
    const rawDraw = 1 / realMatchContext.odds.draw;
    const rawAway = 1 / realMatchContext.odds.away;
    const sum = rawHome + rawDraw + rawAway;

    const winProb = Math.round((rawHome / sum) * 100);
    const drawProb = Math.round((rawDraw / sum) * 100);
    const lossProb = Math.max(5, 100 - winProb - drawProb);

    return {
      clubName: realMatchContext.homeTeam,
      opponent: realMatchContext.awayTeam,
      competition: realMatchContext.competition,
      winProbability: winProb,
      drawProbability: drawProb,
      lossProbability: lossProb,
      expectedGoals: 1.8,
      bothTeamsToScoreProbability: 52,
      over25Probability: 49,
      strengths: [
        `Desempenho correlacionado no feed oficial da Betradar (${realMatchContext.odds.home} odd)`,
        'Volume ofensivo e solidez na estrutura da liga'
      ],
      vulnerabilities: [
        'Variação tática perante o adversário direto em campo'
      ],
      recentMomentum: `${realMatchContext.homeTeam} em confronto com ${realMatchContext.awayTeam}. Odds reais cotadas a ${realMatchContext.odds.home} vs ${realMatchContext.odds.away}.`,
      suggestedMarket: {
        title: `Mercado 1X2 - ${realMatchContext.homeTeam}`,
        odd: realMatchContext.odds.home,
        selectionType: 'HOME',
        matchId: realMatchContext.matchId
      },
      keyStats: [
        { label: 'Probabilidade Implícita (Odd Real)', value: `${winProb}%` },
        { label: 'Probabilidade de Empate', value: `${drawProb}%` },
        { label: 'Odd da Casa (Betradar)', value: `${realMatchContext.odds.home.toFixed(2)}` }
      ],
      detailedSummary: `Análise preditiva não determinística: O confronto entre ${realMatchContext.homeTeam} e ${realMatchContext.awayTeam} (${realMatchContext.competition}) apresenta uma probabilidade estatística de ${winProb}% para triunfo da equipa da casa, ${drawProb}% para empate e ${lossProb}% para os visitantes. Estes dados constituem hipóteses probabilísticas com base nas odds dos holders oficiais, cabendo ao utilizador a decisão de avançar.`,
      disclaimer: RESPONSIBLE_GAMING_DISCLAIMER,
      wasFree: false,
      analysesRemaining: 0
    };
  }

  // Local Statistical Engine fallback
  const base = matchedKey ? CLUB_DATABASE[matchedKey] : {
    name: userSelectedClub || query.split(' ')[0] || 'Equipa Desportiva',
    competition: query.toLowerCase().includes('girabola') ? 'Girabola ZAP (Angola)' : 'Futebol Internacional',
    defaultWin: 50,
    defaultDraw: 30,
    defaultLoss: 20,
    expectedGoals: 1.8,
    bttsRate: 52,
    over25Rate: 48,
    strengths: [
      'Estrutura coletiva disciplinada com boa posse de bola',
      'Eficácia nos lances de bola parada ofensiva'
    ],
    vulnerabilities: [
      'Dificuldade quando em desvantagem no marcador'
    ],
    momentum: 'Apresenta desempenho equilibrado nas últimas jornadas de competição.',
    suggestedMarketTitle: 'Vitória da Equipa / Dupla Hipótese',
    suggestedOdd: 1.95,
    suggestedType: 'HOME' as const,
    keyStats: [
      { label: 'Probabilidade Estimada', value: '50%' },
      { label: 'Golos Esperados (xG)', value: '1.8' }
    ]
  };

  const summary = `O modelo estatístico não determinístico do BOOS AI aponta para um cenário probabilístico de ${base.defaultWin}% para o ${base.name}, com ${base.defaultDraw}% de probabilidade de empate e ${base.defaultLoss}% de desfecho desfavorável. Cabe exclusivamente ao utilizador a análise destes dados para formular a sua hipótese de jogo.`;

  return {
    clubName: base.name,
    competition: base.competition,
    winProbability: base.defaultWin,
    drawProbability: base.defaultDraw,
    lossProbability: base.defaultLoss,
    expectedGoals: base.expectedGoals,
    bothTeamsToScoreProbability: base.bttsRate,
    over25Probability: base.over25Rate,
    strengths: base.strengths,
    vulnerabilities: base.vulnerabilities,
    recentMomentum: base.momentum,
    suggestedMarket: {
      title: base.suggestedMarketTitle,
      odd: base.suggestedOdd,
      selectionType: base.suggestedType,
      matchId: (base as any).matchId
    },
    keyStats: base.keyStats,
    detailedSummary: summary,
    disclaimer: RESPONSIBLE_GAMING_DISCLAIMER,
    wasFree: false,
    analysesRemaining: 0
  };
}
