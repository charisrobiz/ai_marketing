// === AI Agent Types ===
export type Department = 'pm' | 'marketing' | 'design' | 'development';

export interface Agent {
  id: string;
  name: string;
  nameKo: string;
  role: string;
  roleKo: string;
  department: Department;
  description: string;
  avatar: string; // emoji
  color: string;
  gradient: string;
  status: 'idle' | 'working' | 'reviewing' | 'completed';
  hireDate: string; // ISO date string
}

export const DEPARTMENT_LABELS: Record<Department, string> = {
  pm: '총괄',
  marketing: '마케팅팀',
  design: '디자인팀',
  development: '개발팀',
};

// === Campaign Types ===
export type ProductCategory =
  | 'mobile_app'
  | 'web_service'
  | 'physical_product'
  | 'insurance'
  | 'education'
  | 'food_beverage'
  | 'fashion'
  | 'other';

export interface ProductInfo {
  category: ProductCategory;
  name: string;
  description: string;
  targetAudience: string;
  uniqueValue: string;
  additionalAnswers: Record<string, string>;
}

export interface CampaignOptions {
  generateImage: boolean;
  generateVideo: boolean;
  composeBanner: boolean;
  figmaFileUrl: string;
}

// === Figma Template Types ===
export interface FigmaPlaceholder {
  name: string;
  type: 'text' | 'image';
  bounds: { x: number; y: number; w: number; h: number };
  textStyle?: { fontSize: number; fontWeight: number; textAlign: string };
}

export interface FigmaFrame {
  name: string;
  nodeId: string;
  width: number;
  height: number;
  imageUrl?: string;
  placeholders: FigmaPlaceholder[];
}

export interface FigmaTemplate {
  fileKey: string;
  frames: FigmaFrame[];
}

export interface Campaign {
  id: string;
  productInfo: ProductInfo;
  options?: CampaignOptions;
  status: 'intake' | 'planning' | 'creating' | 'voting' | 'testing' | 'deploying' | 'active' | 'paused' | 'completed';
  createdAt: string;
  dailyPlan?: DailyPlan[];
  creatives?: Creative[];
  votes?: VoteResult[];
  abTests?: ABTest[];
}

// === Media Types ===
export type MediaUsageIntent =
  | 'ad_image_reference'
  | 'video_source'
  | 'copy_reference'
  | 'background_source'
  | 'app_screenshot';

export const MEDIA_USAGE_LABELS: Record<MediaUsageIntent, string> = {
  ad_image_reference: '광고 이미지 참고자료',
  video_source: '동영상 생성 소스',
  copy_reference: '카피 작성 참고',
  background_source: '배경/소스 이미지',
  app_screenshot: '앱 스크린샷',
};

export interface MediaContent {
  description: string;
  usage_intent: MediaUsageIntent;
}

export interface CampaignMedia {
  id: string;
  campaign_id: string;
  type: string;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  content: string | null;
  sort_order: number;
  created_at: string;
  parsedContent?: MediaContent | null;
}

// === Marketing Plan Types ===
export interface DailyPlan {
  day: number;
  week: number;
  title: string;
  description: string;
  channels: string[];
  target: string;
  goal: string;
  status: 'pending' | 'in_progress' | 'completed';
}

// === Creative Types ===
export interface Creative {
  id: string;
  campaignId: string;
  angle: string; // e.g., "감성형", "유머형", "기능형"
  copyText: string;
  hookingText: string;
  imagePrompt?: string;
  imageUrl?: string;
  videoUrl?: string;
  bannerUrl?: string;
  platform: string; // instagram, youtube, blog, tiktok
  createdAt: string;
}

// === Voting Types ===
export interface JuryMember {
  id: number;
  name: string;
  persona: string;
  personaGroup: 'trend' | 'practical' | 'emotional' | 'analytical' | 'impulsive';
  age: string;
  gender: string;
  description: string;
  avatar: string;
}

export interface Vote {
  juryId: number;
  creativeId: string;
  score: number; // 1-10
  comment: string;
}

export interface VoteResult {
  creativeId: string;
  totalScore: number;
  averageScore: number;
  votes: Vote[];
  rank: number;
}

// === A/B Test Types ===
export interface ABTest {
  id: string;
  campaignId: string;
  creativeA: string;
  creativeB: string;
  budget: number;
  status: 'running' | 'completed';
  results?: {
    a: { impressions: number; clicks: number; conversions: number; ctr: number; cvr: number };
    b: { impressions: number; clicks: number; conversions: number; ctr: number; cvr: number };
    winner: 'a' | 'b';
  };
}

// === Live Stream Types ===
export interface LiveEvent {
  id: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  type: 'plan' | 'creative' | 'vote' | 'deploy' | 'chat' | 'system';
  content: string;
  metadata?: Record<string, unknown>;
}

// === Admin Types ===
export interface AdminSettings {
  // AI LLM
  openaiApiKey: string;
  claudeApiKey: string;
  geminiApiKey: string;
  // Design
  figmaApiKey: string;
  // Media Generation
  runwayApiKey: string;
  // Ads
  metaAdsToken: string;
  metaAdAccountId: string;
  googleAdsToken: string;
  googleAdsDeveloperToken: string;
  googleAdsCustomerId: string;
  // Analytics
  firebaseProjectId: string;
  firebaseServiceAccountKey: string;
  // Attribution (MMP)
  appsflyerApiToken: string;
  appsflyerAppId: string;
  // App Store
  appStoreConnectKeyId: string;
  appStoreConnectIssuerId: string;
  appStoreConnectPrivateKey: string;
  googlePlayJsonKey: string;
  // General
  defaultBudget: number;
  autoDeployEnabled: boolean;
  ceoApprovalLevel: 'auto' | 'ceo_final' | 'ceo_notify';
}

// === Category Labels ===
export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  mobile_app: '모바일 앱',
  web_service: '웹 서비스',
  physical_product: '실물 상품',
  insurance: '보험/금융',
  education: '교육/강의',
  food_beverage: '식음료',
  fashion: '패션/뷰티',
  other: '기타',
};
