import { create } from 'zustand';
import type { Campaign, LiveEvent, AdminSettings, Agent } from '@/types';

// === Core Agents (8명: PM 1 + 마케팅 3 + 디자인 2 + 개발 2) ===
export const CORE_AGENTS: Agent[] = [
  {
    id: 'hana',
    name: 'Hana',
    nameKo: '하나',
    role: 'Head of Operations',
    roleKo: '본부장 (총괄 PM)',
    department: 'pm',
    description: '전체 마케팅 전략 총괄, 부서간 협업 조율, 최소비용 최대효과 의사결정, 다양한 기법(니치/바이럴/퍼포먼스/커뮤니티 등) 종합 분석',
    avatar: '👩‍💼',
    color: '#F59E0B',
    gradient: 'from-amber-500 to-yellow-500',
    status: 'idle',
    hireDate: '2026-01-01',
  },
  {
    id: 'minseo',
    name: 'Minseo',
    nameKo: '민서',
    role: 'Marketing Strategist',
    roleKo: '마케팅 전략가',
    department: 'marketing',
    description: '30일 마케팅 플랜 수립, 타겟 세분화, 채널별 전략 기획, A/B 테스트 설계, 예산 분배 최적화',
    avatar: '📊',
    color: '#FF6B6B',
    gradient: 'from-red-500 to-pink-500',
    status: 'idle',
    hireDate: '2026-01-01',
  },
  {
    id: 'jiwoo',
    name: 'Jiwoo',
    nameKo: '지우',
    role: 'SEO Specialist',
    roleKo: 'SEO 스페셜리스트',
    department: 'marketing',
    description: '검색엔진 최적화, 롱테일 키워드 전략, 토픽 클러스터 SEO, ASO(앱스토어 최적화), 오가닉 유입 극대화',
    avatar: '🔍',
    color: '#F472B6',
    gradient: 'from-pink-500 to-rose-500',
    status: 'idle',
    hireDate: '2026-01-15',
  },
  {
    id: 'taeyang',
    name: 'Taeyang',
    nameKo: '태양',
    role: 'Performance Marketer',
    roleKo: '퍼포먼스 마케터',
    department: 'marketing',
    description: 'Meta/Google 광고 집행, CTR/CVR 분석, 리타겟팅, 예산 효율 관리, 최소비용 최대전환 달성',
    avatar: '📈',
    color: '#EF4444',
    gradient: 'from-red-600 to-orange-500',
    status: 'idle',
    hireDate: '2026-02-01',
  },
  {
    id: 'yuna',
    name: 'Yuna',
    nameKo: '유나',
    role: 'Creative Director',
    roleKo: '크리에이티브 디렉터',
    department: 'design',
    description: '광고 비주얼 컨셉, 타겟 맞춤 브랜드 디자인, Figma 시스템, 이미지 생성 감수, 플랫폼별 최적화',
    avatar: '🎨',
    color: '#A78BFA',
    gradient: 'from-violet-500 to-purple-500',
    status: 'idle',
    hireDate: '2026-01-01',
  },
  {
    id: 'doha',
    name: 'Doha',
    nameKo: '도하',
    role: 'Motion/UX Designer',
    roleKo: '모션/UX 디자이너',
    department: 'design',
    description: '숏폼 영상 기획, 바이럴용 모션 그래픽, 랜딩페이지 UX, 배너 디자인, 챌린지 템플릿 제작',
    avatar: '🎬',
    color: '#8B5CF6',
    gradient: 'from-purple-500 to-indigo-500',
    status: 'idle',
    hireDate: '2026-02-15',
  },
  {
    id: 'siwon',
    name: 'Siwon',
    nameKo: '시원',
    role: 'Full-Stack Developer',
    roleKo: '풀스택 개발자',
    department: 'development',
    description: 'AI 파이프라인 구축, API 연동, 대시보드 개발, 데이터 수집/분석 자동화',
    avatar: '👨‍💻',
    color: '#4ECDC4',
    gradient: 'from-teal-500 to-cyan-500',
    status: 'idle',
    hireDate: '2026-01-01',
  },
  {
    id: 'eunji',
    name: 'Eunji',
    nameKo: '은지',
    role: 'Data Engineer & Analyst',
    roleKo: '데이터 엔지니어 & 분석가',
    department: 'development',
    description: '심사위원 투표 분석, 광고 성과 데이터 처리, 캠페인 인사이트 도출, 머신러닝 피드백 루프 구축',
    avatar: '🔬',
    color: '#06B6D4',
    gradient: 'from-cyan-500 to-blue-500',
    status: 'idle',
    hireDate: '2026-03-01',
  },
];

// === Store Types ===
interface AppState {
  // Campaigns
  campaigns: Campaign[];
  activeCampaignId: string | null;
  addCampaign: (campaign: Campaign) => void;
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;
  setActiveCampaign: (id: string | null) => void;

  // Live Events
  liveEvents: LiveEvent[];
  addLiveEvent: (event: LiveEvent) => void;
  clearLiveEvents: () => void;

  // Agents
  agents: Agent[];
  updateAgentStatus: (id: string, status: Agent['status']) => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  removeAgent: (id: string) => void;

  // Admin Settings
  settings: AdminSettings;
  updateSettings: (settings: Partial<AdminSettings>) => void;

  // UI State
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

const DEFAULT_SETTINGS: AdminSettings = {
  openaiApiKey: '',
  claudeApiKey: '',
  geminiApiKey: '',
  figmaApiKey: '',
  runwayApiKey: '',
  metaAdsToken: '',
  metaAdAccountId: '',
  googleAdsToken: '',
  googleAdsDeveloperToken: '',
  googleAdsCustomerId: '',
  firebaseProjectId: '',
  firebaseServiceAccountKey: '',
  appsflyerApiToken: '',
  appsflyerAppId: '',
  appStoreConnectKeyId: '',
  appStoreConnectIssuerId: '',
  appStoreConnectPrivateKey: '',
  googlePlayJsonKey: '',
  defaultBudget: 500000,
  autoDeployEnabled: false,
  ceoApprovalLevel: 'ceo_final',
};

// Hydrate settings from localStorage after mount (avoid SSR mismatch)
let _settingsHydrated = false;
function hydrateSettings() {
  if (_settingsHydrated || typeof window === 'undefined') return;
  _settingsHydrated = true;
  try {
    const saved = localStorage.getItem('admin_settings');
    if (saved) {
      useStore.setState({ settings: { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } });
    }
  } catch { /* empty */ }
}

export const useStore = create<AppState>((set, get) => ({
  // Campaigns
  campaigns: [],
  activeCampaignId: null,
  addCampaign: (campaign) =>
    set((state) => ({ campaigns: [...state.campaigns, campaign] })),
  updateCampaign: (id, updates) =>
    set((state) => ({
      campaigns: state.campaigns.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),
  setActiveCampaign: (id) => set({ activeCampaignId: id }),

  // Live Events
  liveEvents: [],
  addLiveEvent: (event) =>
    set((state) => ({
      liveEvents: [event, ...state.liveEvents].slice(0, 500),
    })),
  clearLiveEvents: () => set({ liveEvents: [] }),

  // Agents
  agents: [...CORE_AGENTS],
  updateAgentStatus: (id, status) =>
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === id ? { ...a, status } : a
      ),
    })),
  addAgent: (agent) =>
    set((state) => {
      // Welcome celebration event
      const welcomeMessages = state.agents.map((existing) => ({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        agentId: existing.id,
        agentName: existing.nameKo,
        type: 'chat' as const,
        content: generateWelcomeMessage(existing, agent),
      }));

      return {
        agents: [...state.agents, agent],
        liveEvents: [...welcomeMessages.reverse(), ...state.liveEvents].slice(0, 500),
      };
    }),
  updateAgent: (id, updates) =>
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    })),
  removeAgent: (id) =>
    set((state) => ({
      agents: state.agents.filter((a) => a.id !== id),
    })),

  // Admin Settings (always start with defaults, hydrate on client)
  settings: DEFAULT_SETTINGS,
  updateSettings: (newSettings) =>
    set((state) => {
      const updated = { ...state.settings, ...newSettings };
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_settings', JSON.stringify(updated));
      }
      return { settings: updated };
    }),

  // UI
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));

// === Welcome message generator ===
function generateWelcomeMessage(from: Agent, newAgent: Agent): string {
  const messages: Record<string, string[]> = {
    pm: [
      `${newAgent.nameKo}님 환영합니다! 저희 팀에 합류해주셔서 감사해요. 함께 멋진 결과 만들어봐요!`,
      `${newAgent.nameKo}님 입사를 축하합니다! 앞으로 좋은 시너지 기대합니다.`,
    ],
    marketing: [
      `${newAgent.nameKo}님 환영해요! 마케팅 파워가 더 강해지겠네요!`,
      `어서오세요 ${newAgent.nameKo}님! 같이 대박 캠페인 만들어요!`,
    ],
    design: [
      `${newAgent.nameKo}님 반가워요! 크리에이티브가 더 풍성해질 것 같아 기대돼요!`,
      `환영합니다 ${newAgent.nameKo}님! 멋진 비주얼 함께 만들어요!`,
    ],
    development: [
      `${newAgent.nameKo}님 환영합니다! 시스템이 더 탄탄해지겠네요!`,
      `${newAgent.nameKo}님 입사 축하! 함께 빌드업 해봐요!`,
    ],
  };

  const pool = messages[from.department] || messages.pm;
  return pool[Math.floor(Math.random() * pool.length)];
}
