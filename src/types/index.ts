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

// === 광고 자산 타입 ===
export type AssetType = 'card_news' | 'shorts' | 'feed_image' | 'banner' | 'video_ad' | 'blog_post' | 'story';

export interface AssetTypeConfig {
  label: string;
  emoji: string;
  description: string;
  aspectRatio: string;
  dimensions: string;
  requiresImage: boolean;
  requiresVideo: boolean;
  slideCount?: number;
  platforms: string[];
}

export const ASSET_TYPE_CONFIG: Record<AssetType, AssetTypeConfig> = {
  card_news: {
    label: '카드뉴스',
    emoji: '📑',
    description: '10장 내외의 카드뉴스 (인스타 캐러셀, 슬라이드)',
    aspectRatio: '1:1',
    dimensions: '1080x1080',
    requiresImage: true,
    requiresVideo: false,
    slideCount: 10,
    platforms: ['instagram', 'facebook', 'threads'],
  },
  shorts: {
    label: '숏츠/릴스',
    emoji: '📱',
    description: '15~60초 세로형 숏폼 영상 (릴스, 틱톡, 쇼츠)',
    aspectRatio: '9:16',
    dimensions: '1080x1920',
    requiresImage: true,
    requiresVideo: true,
    platforms: ['instagram', 'tiktok', 'youtube'],
  },
  feed_image: {
    label: '피드 이미지',
    emoji: '🖼️',
    description: '단일 이미지 광고 (인스타 피드, 페이스북)',
    aspectRatio: '1:1',
    dimensions: '1080x1080',
    requiresImage: true,
    requiresVideo: false,
    platforms: ['instagram', 'facebook', 'x'],
  },
  banner: {
    label: '배너 광고',
    emoji: '📢',
    description: '디스플레이 광고 배너 (웹, 앱 광고)',
    aspectRatio: '16:9',
    dimensions: '1200x628',
    requiresImage: true,
    requiresVideo: false,
    platforms: ['blog', 'facebook'],
  },
  video_ad: {
    label: '영상 광고',
    emoji: '🎬',
    description: '가로형 영상 광고 (유튜브, 페이스북)',
    aspectRatio: '16:9',
    dimensions: '1920x1080',
    requiresImage: true,
    requiresVideo: true,
    platforms: ['youtube', 'facebook'],
  },
  blog_post: {
    label: '블로그 포스트',
    emoji: '📝',
    description: 'SEO 블로그 포스트 (2000자+ 롱폼)',
    aspectRatio: 'text',
    dimensions: 'N/A',
    requiresImage: true,
    requiresVideo: false,
    platforms: ['blog'],
  },
  story: {
    label: '스토리',
    emoji: '📖',
    description: '24시간 스토리 (인스타, 페이스북)',
    aspectRatio: '9:16',
    dimensions: '1080x1920',
    requiresImage: true,
    requiresVideo: false,
    platforms: ['instagram', 'facebook'],
  },
};

// === 디자인 스타일 라이브러리 ===
export type DesignStyle = 'toss' | 'baemin' | 'karrot' | 'apple' | 'muji' | 'nike' | 'lifestyle' | 'cinematic' | 'minimal' | 'custom';

export interface DesignStyleConfig {
  label: string;
  description: string;
  promptSnippet: string;
  referenceKeywords: string[];
}

export const DESIGN_STYLE_CONFIG: Record<DesignStyle, DesignStyleConfig> = {
  toss: {
    label: '토스 스타일',
    description: '미니멀, 밝은 톤, 한국 일상, 노란색 포인트',
    promptSnippet: 'Korean fintech Toss brand aesthetic, minimal clean design, bright natural daylight, subtle yellow accent color, modern Korean apartment or cafe interior, authentic Korean lifestyle, friendly warm atmosphere, soft pastel background, magazine photography style',
    referenceKeywords: ['minimal', 'bright', 'yellow accent', 'korean lifestyle', 'friendly'],
  },
  baemin: {
    label: '배민 스타일',
    description: '따뜻한 색감, 음식 클로즈업, 친근한 B급 감성',
    promptSnippet: 'Korean food delivery Baedal Minjok brand style, warm mint and coral color palette, appetizing food close-up photography, casual friendly atmosphere, handwritten Korean typography feel, playful B-class sensibility, cozy restaurant interior, natural warm lighting',
    referenceKeywords: ['warm', 'food', 'mint', 'playful', 'friendly'],
  },
  karrot: {
    label: '당근 스타일',
    description: '동네 감성, 자연광, 평범한 한국 동네 일상',
    promptSnippet: 'Korean neighborhood community Karrot Market brand style, authentic local Korean neighborhood atmosphere, natural sunlight, regular Korean people in everyday situations, slightly worn but warm aesthetic, Korean residential streets and small shops, orange accent color, genuine documentary photography feel',
    referenceKeywords: ['neighborhood', 'authentic', 'natural light', 'everyday', 'orange'],
  },
  apple: {
    label: 'Apple 스타일',
    description: '깨끗한 흰 배경, 제품 중심, 프리미엄 미니멀',
    promptSnippet: 'Apple premium product photography, pure clean white background, minimal composition, product as hero, soft diffused studio lighting, ultra-sharp focus, premium aesthetic, sophisticated color grading, editorial quality, ultra high resolution',
    referenceKeywords: ['clean', 'white', 'premium', 'minimal', 'product'],
  },
  muji: {
    label: 'Muji 스타일',
    description: '무채색, 자연 소재, 미니멀 일본 감성',
    promptSnippet: 'Muji Japanese minimalism, neutral beige and cream color palette, natural materials like wood and linen, soft diffused natural light, zen minimal aesthetic, uncluttered composition, calm and peaceful mood, documentary lifestyle photography',
    referenceKeywords: ['neutral', 'beige', 'minimal', 'zen', 'natural'],
  },
  nike: {
    label: 'Nike 스타일',
    description: '역동적, 고대비, 스포츠 모션',
    promptSnippet: 'Nike dynamic sports photography, high contrast dramatic lighting, motion blur effect, athletic energy, bold composition, strong shadows and highlights, urban street environment, powerful and inspiring atmosphere, hyperrealistic',
    referenceKeywords: ['dynamic', 'sports', 'high contrast', 'motion', 'urban'],
  },
  lifestyle: {
    label: '라이프스타일',
    description: '자연스러운 일상, 따뜻한 색감',
    promptSnippet: 'Lifestyle photography, candid authentic moments, warm golden hour lighting, natural composition, real people in real situations, soft film grain, Kodak Portra 400 aesthetic, editorial magazine quality',
    referenceKeywords: ['lifestyle', 'candid', 'golden hour', 'film', 'authentic'],
  },
  cinematic: {
    label: '시네마틱',
    description: '영화 같은 컬러그레이딩, 드라마틱',
    promptSnippet: 'Cinematic photography, movie-like color grading with teal and orange tones, dramatic lighting, shallow depth of field, anamorphic lens feel, storytelling composition, atmospheric mood, shot on ARRI Alexa quality',
    referenceKeywords: ['cinematic', 'dramatic', 'film', 'teal orange', 'mood'],
  },
  minimal: {
    label: '미니멀',
    description: '단순한 배경, 깨끗한 구성',
    promptSnippet: 'Minimalist composition, lots of negative space, single focal point, clean background, subtle color palette, geometric harmony, gallery aesthetic, ultra sharp focus',
    referenceKeywords: ['minimal', 'clean', 'negative space', 'geometric'],
  },
  custom: {
    label: '커스텀',
    description: 'CEO가 업로드한 레퍼런스 기반',
    promptSnippet: '',
    referenceKeywords: [],
  },
};

export type CampaignType = 'flash' | 'short' | 'standard' | 'long';

export const CAMPAIGN_TYPE_CONFIG: Record<CampaignType, { label: string; description: string; days: number; weeks: number; emoji: string }> = {
  flash: { label: '긴급/이벤트', description: '플래시 세일, 한정 이벤트, 긴급 프로모션 (1~3일)', days: 3, weeks: 1, emoji: '⚡' },
  short: { label: '단기 캠페인', description: '신제품 출시, 시즌 프로모션 (1~2주)', days: 14, weeks: 2, emoji: '🚀' },
  standard: { label: '표준 캠페인', description: '브랜드 성장, 유저 확보 (30일)', days: 30, weeks: 4, emoji: '📈' },
  long: { label: '장기 캠페인', description: '브랜드 빌딩, 시장 점유 (2~3개월)', days: 90, weeks: 12, emoji: '🏗️' },
};

export interface CampaignOptions {
  campaignType: CampaignType;
  assetTypes: AssetType[];       // 이번 캠페인에서 생성할 광고 자산 유형 (복수 선택)
  designStyle: DesignStyle;      // 디자인 스타일 프리셋
  benchmarkIds?: string[];       // 참고할 벤치마크 ID 배열
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

export type CampaignMode = 'demo' | 'production';

export interface Campaign {
  id: string;
  mode: CampaignMode;
  productInfo: ProductInfo;
  options?: CampaignOptions;
  status: 'intake' | 'planning' | 'creating' | 'voting' | 'testing' | 'deploying' | 'active' | 'paused' | 'completed';
  createdAt: string;
  dailyPlan?: DailyPlan[];
  creatives?: Creative[];
  votes?: VoteResult[];
  abTests?: ABTest[];
}

// === Benchmark Library Types ===
export type BenchmarkPlatform = 'youtube' | 'instagram' | 'tiktok' | 'facebook' | 'x' | 'threads' | 'blog' | 'other';

export const BENCHMARK_PLATFORM_CONFIG: Record<BenchmarkPlatform, { label: string; emoji: string; color: string }> = {
  youtube: { label: 'YouTube', emoji: '▶️', color: 'text-red-400' },
  instagram: { label: 'Instagram', emoji: '📸', color: 'text-pink-400' },
  tiktok: { label: 'TikTok', emoji: '🎵', color: 'text-cyan-400' },
  facebook: { label: 'Facebook', emoji: '👤', color: 'text-blue-400' },
  x: { label: 'X (Twitter)', emoji: '𝕏', color: 'text-gray-300' },
  threads: { label: 'Threads', emoji: '🧵', color: 'text-purple-300' },
  blog: { label: '블로그', emoji: '📝', color: 'text-green-400' },
  other: { label: '기타', emoji: '🔗', color: 'text-gray-400' },
};

export interface BenchmarkAIAnalysis {
  dominantColors?: string[];        // ['#FF6B6B', '#4ECDC4', ...]
  layout?: string;                  // "중앙 정렬, 텍스트 상단"
  tone?: string;                    // "따뜻하고 친근한"
  strengths?: string[];             // ["후킹이 강력함", "색감이 선명함"]
  weaknesses?: string[];
  ocrText?: string;                 // 이미지에서 추출한 텍스트
  designStyle?: string;             // "Toss 스타일", "미니멀" 등
  targetAudience?: string;          // 추정 타겟
  emotionalAppeal?: string;         // 감정 호소 방식
}

export interface BenchmarkItem {
  id: string;
  title: string;
  platform?: BenchmarkPlatform;
  url?: string;
  thumbnail_url?: string;
  captured_images?: string[];

  meta_title?: string;
  meta_description?: string;
  meta_stats?: { views?: number; likes?: number; comments?: number };
  meta_author?: string;

  ai_analysis?: BenchmarkAIAnalysis;
  ai_insights?: string;

  ceo_notes?: string;
  category_tags?: string[];

  used_in_campaigns?: string[];
  use_count?: number;

  created_at?: string;
  updated_at?: string;
}

// === Social Channel Types ===
export type SocialPlatform = 'instagram' | 'tiktok' | 'youtube' | 'x' | 'facebook' | 'threads' | 'blog' | 'kakao' | 'pinterest';

export interface PlatformConfig {
  label: string;
  emoji: string;
  color: string;
  bioLimit: number;
  copyTone: string;
  copyMaxLength: number;
  formats: string[];
  hashtagStyle: string;
  bestPostTime: string;
  kpi: string;
}

export const SOCIAL_PLATFORM_CONFIG: Record<SocialPlatform, PlatformConfig> = {
  instagram: {
    label: 'Instagram', emoji: '📸', color: 'text-pink-400', bioLimit: 150,
    copyTone: '감성적, 비주얼 중심, 이모지 활용, 스토리텔링',
    copyMaxLength: 2200,
    formats: ['피드 이미지(1:1)', '릴스(9:16)', '캐러셀(1:1 슬라이드)', '스토리(9:16)'],
    hashtagStyle: '관련 해시태그 15~20개, 니치 해시태그 우선',
    bestPostTime: '평일 오전 11시~오후 1시, 저녁 7시~9시',
    kpi: '저장수, 공유수, 릴스 조회수',
  },
  tiktok: {
    label: 'TikTok', emoji: '🎵', color: 'text-cyan-400', bioLimit: 80,
    copyTone: 'B급 감성, 짧고 임팩트, 트렌드 밈 활용, 구어체',
    copyMaxLength: 300,
    formats: ['숏폼 영상(9:16, 15~60초)', '포토 슬라이드', '라이브'],
    hashtagStyle: '트렌드 해시태그 3~5개 + 니치 2~3개',
    bestPostTime: '평일 저녁 7시~10시, 주말 오전 10시~12시',
    kpi: '완시율, 공유수, 댓글수',
  },
  youtube: {
    label: 'YouTube', emoji: '▶️', color: 'text-red-400', bioLimit: 1000,
    copyTone: '정보성, 스토리텔링, 클릭베이트 썸네일, SEO 제목',
    copyMaxLength: 5000,
    formats: ['숏츠(9:16, 60초)', '롱폼(16:9, 5~15분)', '커뮤니티 포스트'],
    hashtagStyle: 'SEO 키워드 중심 태그 10~15개',
    bestPostTime: '평일 오후 2시~4시, 주말 오전 10시',
    kpi: 'CTR(클릭률), 평균 시청 시간, 구독 전환율',
  },
  x: {
    label: 'X (Twitter)', emoji: '𝕏', color: 'text-gray-300', bioLimit: 160,
    copyTone: '위트, 간결, 논쟁/의견, 실시간 트렌드 반응',
    copyMaxLength: 280,
    formats: ['텍스트 트윗(280자)', '이미지 트윗', '스레드(연결 트윗)', '투표'],
    hashtagStyle: '핵심 해시태그 1~3개만, 과도한 태그 비추',
    bestPostTime: '평일 오전 8시~10시, 점심 12시~1시',
    kpi: '리트윗, 인용 트윗, 임프레션',
  },
  facebook: {
    label: 'Facebook', emoji: '👤', color: 'text-blue-400', bioLimit: 255,
    copyTone: '친근, 커뮤니티, 정보+감성 혼합, 질문형 유도',
    copyMaxLength: 63206,
    formats: ['피드 이미지', '릴스(9:16)', '그룹 포스트', '이벤트', '광고(Meta Ads)'],
    hashtagStyle: '해시태그 3~5개, 과도하면 리치 감소',
    bestPostTime: '평일 오전 9시~11시, 오후 1시~3시',
    kpi: '참여율(좋아요+댓글+공유), 리치, 광고 ROAS',
  },
  threads: {
    label: 'Threads', emoji: '🧵', color: 'text-purple-300', bioLimit: 150,
    copyTone: '대화형, 솔직, 인사이트 공유, 인스타 연동 감성',
    copyMaxLength: 500,
    formats: ['텍스트(500자)', '이미지 포스트', '캐러셀'],
    hashtagStyle: '키워드 태그 1~3개, 자연스러운 삽입',
    bestPostTime: '평일 오전 7시~9시, 저녁 8시~10시',
    kpi: '리포스트, 인용, 팔로워 증가율',
  },
  blog: {
    label: '블로그', emoji: '📝', color: 'text-green-400', bioLimit: 200,
    copyTone: 'SEO 최적화, 정보성, 교육형, 롱폼 콘텐츠, 키워드 밀도',
    copyMaxLength: 50000,
    formats: ['SEO 블로그(2000~3000자)', '리뷰/후기', '가이드/튜토리얼', '리스트형'],
    hashtagStyle: '태그/카테고리 5~10개, 메타 키워드 설정',
    bestPostTime: '평일 오전 6시~8시 (출근길 검색)',
    kpi: '검색 순위, 방문자수, 체류 시간',
  },
  kakao: {
    label: '카카오채널', emoji: '💬', color: 'text-yellow-400', bioLimit: 200,
    copyTone: '친근, 혜택 중심, CTA 명확, 카드형 메시지',
    copyMaxLength: 1000,
    formats: ['피드(카드형)', '쿠폰/혜택', '1:1 챗봇', '비즈보드 광고'],
    hashtagStyle: '해시태그 미사용, 키워드 검색 최적화',
    bestPostTime: '평일 오전 10시~12시, 오후 2시~4시',
    kpi: '친구 추가수, 메시지 오픈율, 쿠폰 사용률',
  },
  pinterest: {
    label: 'Pinterest', emoji: '📌', color: 'text-red-300', bioLimit: 500,
    copyTone: '영감, 비주얼, 검색 최적화, 라이프스타일',
    copyMaxLength: 500,
    formats: ['핀(2:3 세로)', '아이디어 핀(영상)', '보드 큐레이션'],
    hashtagStyle: 'SEO 키워드 중심 설명, 해시태그보다 키워드 설명이 중요',
    bestPostTime: '주말 오전, 평일 저녁 8시~11시',
    kpi: '핀 저장수, 아웃바운드 클릭, 노출수',
  },
};

export interface ChannelRecommendation {
  recommendedName: string;
  recommendedId: string;
  bio: string;
  category: string;
  profileImageConcept: string;
  initialContentStrategy: string;
  algorithmTips: string[];
  seoKeywords: string[];
  agentDiscussion: Array<{ agent: string; name: string; message: string }>;
}

export interface SocialChannel {
  id: string;
  platform: SocialPlatform;
  status: 'none' | 'registered' | 'ai_recommended';
  account_id?: string;
  account_url?: string;
  ai_recommendation?: ChannelRecommendation;
  created_at?: string;
  updated_at?: string;
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
  falApiKey: string;              // fal.ai (Flux 1.1 Pro Ultra, Flux Kontext)
  // Telegram Notifications
  telegramBotToken: string;
  telegramChatId: string;
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
  // Phase별 모델 오버라이드 (사용자가 워크플로우 맵에서 변경 가능)
  modelOverrides?: Record<string, string>;
}

// 사용 가능한 모델 목록 (드롭다운용)
export const AVAILABLE_MODELS = {
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o mini (저렴/빠름)' },
    { value: 'gpt-4o', label: 'GPT-4o (균형/멀티모달)' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  ],
  claude: [
    { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 (분석 1위)' },
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku (저렴)' },
  ],
  gemini: [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (저렴/빠름)' },
    { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite (최저가)' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (분석)' },
    { value: 'gemini-3-pro-preview', label: 'Gemini 3 Pro Preview (최신)' },
  ],
  media: [
    { value: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash Image (이미지 생성)' },
    { value: 'gen4_turbo', label: 'Runway Gen-4 Turbo (동영상)' },
  ],
};

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
