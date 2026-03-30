import { create } from 'zustand';
import type { Campaign, LiveEvent, AdminSettings, Agent } from '@/types';

// === Core Agents (8명: PM 1 + 마케팅 3 + 디자인 2 + 개발 2) ===
export const CORE_AGENTS: Agent[] = [
  // 총괄 PM (본부장)
  {
    id: 'hana',
    name: 'Hana',
    nameKo: '하나',
    role: 'Head of Operations',
    roleKo: '본부장 (총괄 PM)',
    department: 'pm',
    description: '전체 프로젝트 관리, 부서간 협업 조율, 일정/리소스 배분, 최종 의사결정',
    avatar: '👩‍💼',
    color: '#F59E0B',
    gradient: 'from-amber-500 to-yellow-500',
    status: 'idle',
  },
  // 마케팅팀 (3명)
  {
    id: 'minseo',
    name: 'Minseo',
    nameKo: '민서',
    role: 'Marketing Strategist',
    roleKo: '마케팅 전략가',
    department: 'marketing',
    description: '30일 마케팅 플랜 수립, 채널별 전략 기획, A/B 테스트 설계, 예산 분배',
    avatar: '📊',
    color: '#FF6B6B',
    gradient: 'from-red-500 to-pink-500',
    status: 'idle',
  },
  {
    id: 'jiwoo',
    name: 'Jiwoo',
    nameKo: '지우',
    role: 'SEO Specialist',
    roleKo: 'SEO 스페셜리스트',
    department: 'marketing',
    description: '검색엔진 최적화, 키워드 전략, 블로그/콘텐츠 SEO, ASO(앱스토어 최적화), 오가닉 유입 극대화',
    avatar: '🔍',
    color: '#F472B6',
    gradient: 'from-pink-500 to-rose-500',
    status: 'idle',
  },
  {
    id: 'taeyang',
    name: 'Taeyang',
    nameKo: '태양',
    role: 'Performance Marketer',
    roleKo: '퍼포먼스 마케터',
    department: 'marketing',
    description: 'Meta/Google 광고 집행, CTR/CVR 분석, 타겟 최적화, 예산 효율 관리',
    avatar: '📈',
    color: '#EF4444',
    gradient: 'from-red-600 to-orange-500',
    status: 'idle',
  },
  // 디자인팀 (2명)
  {
    id: 'yuna',
    name: 'Yuna',
    nameKo: '유나',
    role: 'Creative Director',
    roleKo: '크리에이티브 디렉터',
    department: 'design',
    description: '광고 비주얼 컨셉, 브랜드 아이덴티티, Figma 디자인 시스템, 이미지 생성 감수',
    avatar: '🎨',
    color: '#A78BFA',
    gradient: 'from-violet-500 to-purple-500',
    status: 'idle',
  },
  {
    id: 'doha',
    name: 'Doha',
    nameKo: '도하',
    role: 'Motion/UX Designer',
    roleKo: '모션/UX 디자이너',
    department: 'design',
    description: '영상 소재 기획, 숏폼 콘텐츠 편집, 랜딩페이지 UX, 배너 디자인',
    avatar: '🎬',
    color: '#8B5CF6',
    gradient: 'from-purple-500 to-indigo-500',
    status: 'idle',
  },
  // 개발팀 (2명)
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
  metaAdsToken: '',
  googleAdsToken: '',
  figmaApiKey: '',
  defaultBudget: 500000,
  autoDeployEnabled: false,
};

// Load settings from localStorage
function loadSettings(): AdminSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const saved = localStorage.getItem('admin_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export const useStore = create<AppState>((set) => ({
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

  // Admin Settings
  settings: loadSettings(),
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
