'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Settings, Eye, EyeOff, Save, CheckCircle, HelpCircle, X, ExternalLink, BookOpen, Download, ChevronDown, ChevronUp, Share2, Workflow } from 'lucide-react';
import SocialChannelManager from '@/components/admin/SocialChannelManager';
import type { AdminSettings } from '@/types';

interface KeyGuide {
  title: string;
  steps: string[];
  url: string;
  urlLabel: string;
}

interface KeyField {
  key: keyof AdminSettings;
  label: string;
  description: string;
  placeholder: string;
  isTextarea?: boolean;
  guide?: KeyGuide;
}

interface Section {
  title: string;
  description: string;
  color: string;
  fields: KeyField[];
}

const SECTIONS: Section[] = [
  {
    title: 'AI LLM API',
    description: '마케팅 플랜 생성, 카피라이팅, 심사위원 투표에 사용됩니다. 최소 1개 입력.',
    color: 'text-blue-400',
    fields: [
      {
        key: 'openaiApiKey', label: 'OpenAI API Key',
        description: 'GPT-4o 기반 마케팅 플랜 및 카피라이팅', placeholder: 'sk-...',
        guide: {
          title: 'OpenAI API Key 발급 방법',
          steps: [
            '1. OpenAI Platform 사이트에 로그인합니다.',
            '2. 우측 상단 프로필 > "View API keys" 클릭.',
            '3. "Create new secret key" 버튼 클릭.',
            '4. 키 이름을 입력하고 생성 (예: AutoGrowth).',
            '5. 생성된 키(sk-...)를 복사하여 여기에 붙여넣기.',
            '※ 키는 생성 직후에만 확인 가능하니 바로 복사하세요.',
            '※ 사용량에 따라 과금됩니다. Usage 페이지에서 확인 가능.',
          ],
          url: 'https://platform.openai.com/api-keys',
          urlLabel: 'OpenAI API Keys 페이지',
        },
      },
      {
        key: 'claudeApiKey', label: 'Claude API Key',
        description: 'Claude 기반 심층 분석 및 크리에이티브', placeholder: 'sk-ant-...',
        guide: {
          title: 'Claude (Anthropic) API Key 발급 방법',
          steps: [
            '1. Anthropic Console 사이트에 로그인합니다.',
            '2. 좌측 메뉴에서 "API Keys" 클릭.',
            '3. "Create Key" 버튼 클릭.',
            '4. 키 이름 입력 후 생성.',
            '5. 생성된 키(sk-ant-...)를 복사하여 여기에 붙여넣기.',
            '※ 첫 가입 시 무료 크레딧이 제공됩니다.',
          ],
          url: 'https://console.anthropic.com/settings/keys',
          urlLabel: 'Anthropic Console',
        },
      },
      {
        key: 'geminiApiKey', label: 'Gemini API Key',
        description: 'Gemini 기반 다국어 카피라이팅 및 이미지 생성', placeholder: 'AI...',
        guide: {
          title: 'Google Gemini API Key 발급 방법',
          steps: [
            '1. Google AI Studio 사이트에 접속합니다.',
            '2. 좌측 메뉴에서 "Get API key" 클릭.',
            '3. "Create API key" 클릭 후 프로젝트 선택.',
            '4. 생성된 API Key를 복사하여 여기에 붙여넣기.',
            '※ 무료 사용량이 넉넉하게 제공됩니다.',
          ],
          url: 'https://aistudio.google.com/apikey',
          urlLabel: 'Google AI Studio',
        },
      },
    ],
  },
  {
    title: '광고 플랫폼 (Ads)',
    description: '실제 광고 집행 및 CTR, CPA 등 퍼포먼스 데이터를 가져옵니다.',
    color: 'text-red-400',
    fields: [
      {
        key: 'metaAdsToken', label: 'Meta Ads Access Token',
        description: 'Facebook/Instagram 광고 데이터 조회 및 집행', placeholder: 'EAA...',
        guide: {
          title: 'Meta Ads Access Token 발급 방법',
          steps: [
            '1. Meta for Developers 사이트에서 앱을 생성합니다.',
            '2. Meta Business Suite > 설정 > 비즈니스 설정으로 이동.',
            '3. "시스템 사용자" 메뉴에서 시스템 사용자를 추가합니다.',
            '4. 해당 시스템 사용자에게 광고 계정 접근 권한 부여.',
            '5. "토큰 생성" 클릭 → ads_management, ads_read 권한 선택.',
            '6. 생성된 토큰(EAA...)을 복사하여 여기에 붙여넣기.',
            '※ 또는 Graph API Explorer에서 단기 토큰 발급 가능.',
          ],
          url: 'https://developers.facebook.com/tools/explorer/',
          urlLabel: 'Meta Graph API Explorer',
        },
      },
      {
        key: 'metaAdAccountId', label: 'Meta Ad Account ID',
        description: '광고 계정 ID (act_XXXXXXX)', placeholder: 'act_123456789',
        guide: {
          title: 'Meta Ad Account ID 확인 방법',
          steps: [
            '1. Meta Business Suite에 로그인합니다.',
            '2. 설정 > 비즈니스 설정 > 계정 > 광고 계정.',
            '3. 광고 계정을 선택하면 "광고 계정 ID"가 표시됩니다.',
            '4. "act_" 접두사를 포함한 전체 ID를 입력하세요.',
            '예: act_123456789012345',
          ],
          url: 'https://business.facebook.com/settings/ad-accounts',
          urlLabel: 'Meta 비즈니스 설정',
        },
      },
      {
        key: 'googleAdsToken', label: 'Google Ads OAuth Token',
        description: 'Google/YouTube 광고 데이터 조회', placeholder: 'ya29...',
        guide: {
          title: 'Google Ads OAuth Token 발급 방법',
          steps: [
            '1. Google Cloud Console에서 프로젝트를 생성합니다.',
            '2. "API 및 서비스" > "사용자 인증 정보"로 이동.',
            '3. "사용자 인증 정보 만들기" > "OAuth 클라이언트 ID" 선택.',
            '4. 앱 유형을 "웹 애플리케이션"으로 설정.',
            '5. OAuth 동의 화면을 설정하고 Google Ads API를 활성화.',
            '6. OAuth Playground에서 토큰을 생성합니다.',
            '※ 토큰은 주기적으로 갱신이 필요합니다.',
          ],
          url: 'https://developers.google.com/oauthplayground/',
          urlLabel: 'Google OAuth Playground',
        },
      },
      {
        key: 'googleAdsDeveloperToken', label: 'Google Ads Developer Token',
        description: 'Google Ads API 개발자 토큰', placeholder: '',
        guide: {
          title: 'Google Ads Developer Token 발급 방법',
          steps: [
            '1. Google Ads 계정에 로그인합니다.',
            '2. 도구 및 설정(렌치 아이콘) > 설정 > API 센터.',
            '3. "개발자 토큰" 섹션에서 토큰을 확인합니다.',
            '4. 처음이면 "기본 액세스"로 신청 (즉시 승인).',
            '5. 토큰을 복사하여 여기에 붙여넣기.',
            '※ 테스트 계정은 별도 신청 없이 사용 가능.',
          ],
          url: 'https://ads.google.com/aw/apicenter',
          urlLabel: 'Google Ads API 센터',
        },
      },
      {
        key: 'googleAdsCustomerId', label: 'Google Ads Customer ID',
        description: '광고 고객 ID (XXX-XXX-XXXX)', placeholder: '123-456-7890',
        guide: {
          title: 'Google Ads Customer ID 확인 방법',
          steps: [
            '1. Google Ads에 로그인합니다.',
            '2. 우측 상단의 계정 아이콘을 클릭합니다.',
            '3. "고객 ID"가 XXX-XXX-XXXX 형식으로 표시됩니다.',
            '4. 하이픈(-)을 포함한 전체 ID를 입력하세요.',
          ],
          url: 'https://ads.google.com/',
          urlLabel: 'Google Ads',
        },
      },
    ],
  },
  {
    title: 'Analytics (분석)',
    description: '설치수, 리텐션, 전환율 등 앱 내 사용자 행동 데이터를 가져옵니다.',
    color: 'text-green-400',
    fields: [
      {
        key: 'firebaseProjectId', label: 'Firebase Project ID',
        description: '설치수, DAU, 리텐션, 이벤트 데이터', placeholder: 'my-app-12345',
        guide: {
          title: 'Firebase Project ID 확인 방법',
          steps: [
            '1. Firebase Console에 로그인합니다.',
            '2. 프로젝트를 선택합니다.',
            '3. 프로젝트 설정(톱니바퀴) > 일반 탭.',
            '4. "프로젝트 ID"를 복사합니다.',
            '※ GA4 연동: Firebase 프로젝트에서 Google Analytics를 활성화해야 합니다.',
          ],
          url: 'https://console.firebase.google.com/',
          urlLabel: 'Firebase Console',
        },
      },
      {
        key: 'firebaseServiceAccountKey', label: 'Firebase Service Account Key (JSON)',
        description: '서비스 계정 키 JSON 전체를 붙여넣기', placeholder: '{"type": "service_account", ...}', isTextarea: true,
        guide: {
          title: 'Firebase Service Account Key 생성 방법',
          steps: [
            '1. Firebase Console > 프로젝트 설정 > 서비스 계정 탭.',
            '2. "새 비공개 키 생성" 버튼 클릭.',
            '3. JSON 파일이 다운로드됩니다.',
            '4. 다운로드된 JSON 파일을 텍스트 편집기로 열기.',
            '5. 전체 내용을 복사하여 여기에 붙여넣기.',
            '※ 이 키는 절대 외부에 공유하지 마세요!',
          ],
          url: 'https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk',
          urlLabel: 'Firebase 서비스 계정',
        },
      },
    ],
  },
  {
    title: '어트리뷰션 (MMP)',
    description: '오가닉/페이드 구분, 채널별 기여도 분석에 사용됩니다.',
    color: 'text-purple-400',
    fields: [
      {
        key: 'appsflyerApiToken', label: 'AppsFlyer API Token',
        description: '설치 어트리뷰션, 오가닉/페이드 비율', placeholder: '',
        guide: {
          title: 'AppsFlyer API Token 발급 방법',
          steps: [
            '1. AppsFlyer 대시보드에 로그인합니다.',
            '2. 좌측 메뉴 > 설정 > API Access.',
            '3. "API token (V2)" 섹션에서 토큰을 확인합니다.',
            '4. 토큰을 복사하여 여기에 붙여넣기.',
            '※ Admin 권한이 필요합니다.',
          ],
          url: 'https://hq1.appsflyer.com/auth/login',
          urlLabel: 'AppsFlyer 대시보드',
        },
      },
      {
        key: 'appsflyerAppId', label: 'AppsFlyer App ID',
        description: '앱 식별자 (iOS: id123, Android: com.xxx)', placeholder: 'com.example.app',
        guide: {
          title: 'AppsFlyer App ID 확인 방법',
          steps: [
            '1. AppsFlyer 대시보드에서 앱을 선택합니다.',
            '2. 상단에 표시되는 App ID를 확인합니다.',
            '3. iOS: "id" + 숫자 (예: id123456789)',
            '4. Android: 패키지명 (예: com.company.app)',
            '※ 앱이 등록되어 있어야 합니다.',
          ],
          url: 'https://hq1.appsflyer.com/apps/myapps',
          urlLabel: 'AppsFlyer 앱 목록',
        },
      },
    ],
  },
  {
    title: '앱 스토어',
    description: '앱스토어/플레이스토어 설치수, 평점, 리뷰 데이터를 가져옵니다.',
    color: 'text-orange-400',
    fields: [
      {
        key: 'appStoreConnectKeyId', label: 'App Store Connect Key ID',
        description: 'Apple API Key ID', placeholder: '',
        guide: {
          title: 'App Store Connect API Key 생성 방법',
          steps: [
            '1. App Store Connect에 로그인합니다.',
            '2. 사용자 및 액세스 > 키 탭으로 이동.',
            '3. "+" 버튼을 클릭하여 새 API 키를 생성합니다.',
            '4. 이름을 입력하고 "Admin" 또는 "Sales" 역할 선택.',
            '5. 생성 후 Key ID를 복사합니다.',
            '6. AuthKey_XXXXXXXX.p8 파일을 다운로드합니다.',
            '※ .p8 파일은 한 번만 다운로드 가능합니다!',
          ],
          url: 'https://appstoreconnect.apple.com/access/api',
          urlLabel: 'App Store Connect API Keys',
        },
      },
      {
        key: 'appStoreConnectIssuerId', label: 'App Store Connect Issuer ID',
        description: 'Issuer ID (키 페이지 상단에 표시)', placeholder: '',
        guide: {
          title: 'Issuer ID 확인 방법',
          steps: [
            '1. App Store Connect > 사용자 및 액세스 > 키.',
            '2. 페이지 상단에 "Issuer ID"가 표시됩니다.',
            '3. UUID 형식의 ID를 복사하여 여기에 붙여넣기.',
            '예: 57246542-96fe-1a63-e053-0824d011072a',
          ],
          url: 'https://appstoreconnect.apple.com/access/api',
          urlLabel: 'App Store Connect API Keys',
        },
      },
      {
        key: 'appStoreConnectPrivateKey', label: 'App Store Connect Private Key',
        description: 'AuthKey .p8 파일 내용', placeholder: '-----BEGIN PRIVATE KEY-----\n...', isTextarea: true,
        guide: {
          title: 'Private Key (.p8) 등록 방법',
          steps: [
            '1. API Key 생성 시 다운로드한 .p8 파일을 찾습니다.',
            '2. 텍스트 편집기로 .p8 파일을 엽니다.',
            '3. "-----BEGIN PRIVATE KEY-----"부터 "-----END PRIVATE KEY-----"까지 전체 복사.',
            '4. 여기에 붙여넣기.',
            '※ 파일을 잃어버리면 새 키를 다시 생성해야 합니다.',
          ],
          url: 'https://developer.apple.com/documentation/appstoreconnectapi/creating_api_keys_for_app_store_connect_api',
          urlLabel: 'Apple 공식 가이드',
        },
      },
      {
        key: 'googlePlayJsonKey', label: 'Google Play Service Account Key (JSON)',
        description: 'Google Play Console API 서비스 계정 키', placeholder: '{"type": "service_account", ...}', isTextarea: true,
        guide: {
          title: 'Google Play Service Account Key 생성 방법',
          steps: [
            '1. Google Cloud Console에서 프로젝트를 선택합니다.',
            '2. IAM 및 관리자 > 서비스 계정으로 이동.',
            '3. "서비스 계정 만들기" 클릭.',
            '4. 이름을 입력하고, 역할은 비워도 됩니다.',
            '5. 생성된 계정의 "키" 탭 > "키 추가" > "JSON" 선택.',
            '6. 다운로드된 JSON 파일 내용을 여기에 붙여넣기.',
            '7. Google Play Console > 설정 > API 액세스에서 서비스 계정을 연결합니다.',
            '※ "앱 정보 보기" 권한을 부여하세요.',
          ],
          url: 'https://play.google.com/console/developers/app/setup',
          urlLabel: 'Google Play Console',
        },
      },
    ],
  },
  {
    title: '미디어 생성',
    description: 'AI 이미지 생성(Gemini)은 LLM API의 Gemini 키를 사용합니다. 동영상 생성에는 Runway 키가 필요합니다.',
    color: 'text-pink-400',
    fields: [
      {
        key: 'runwayApiKey', label: 'Runway API Key',
        description: 'Runway Gen-4 Turbo 동영상 생성', placeholder: 'key_...',
        guide: {
          title: 'Runway API Key 발급 방법',
          steps: [
            '1. Runway 개발자 포털에 로그인합니다.',
            '2. 좌측 메뉴에서 "API Keys" 클릭.',
            '3. "Create API Key" 버튼 클릭.',
            '4. 키 이름을 입력하고 생성.',
            '5. 생성된 키를 복사하여 여기에 붙여넣기.',
            '※ API 사용량에 따라 과금됩니다.',
            '※ 이미지 생성은 위 AI LLM API의 Gemini 키를 사용합니다.',
          ],
          url: 'https://dev.runwayml.com/',
          urlLabel: 'Runway Developer Portal',
        },
      },
    ],
  },
  {
    title: '디자인',
    description: 'Figma 연동 자동 디자인 합성에 사용됩니다.',
    color: 'text-violet-400',
    fields: [
      {
        key: 'figmaApiKey', label: 'Figma API Key',
        description: 'Figma 연동 자동 디자인', placeholder: 'figd_...',
        guide: {
          title: 'Figma API Key 발급 방법',
          steps: [
            '1. Figma에 로그인합니다.',
            '2. 좌측 상단 프로필 아이콘 > Settings 클릭.',
            '3. "Personal access tokens" 섹션으로 스크롤.',
            '4. 토큰 설명을 입력하고 "Generate token" 클릭.',
            '5. 생성된 토큰(figd_...)을 복사하여 여기에 붙여넣기.',
            '※ 토큰은 생성 직후에만 확인 가능합니다.',
          ],
          url: 'https://www.figma.com/settings',
          urlLabel: 'Figma Settings',
        },
      },
    ],
  },
];

// === Guide Popup Component ===
function GuidePopup({ guide, onClose }: { guide: KeyGuide; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold">{guide.title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded"><X size={18} /></button>
        </div>
        <div className="space-y-2 mb-5">
          {guide.steps.map((step, i) => (
            <p key={i} className={`text-sm leading-relaxed ${step.startsWith('※') ? 'text-yellow-400/80 mt-3' : 'text-gray-300'}`}>
              {step}
            </p>
          ))}
        </div>
        <a
          href={guide.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors"
        >
          <ExternalLink size={14} />
          {guide.urlLabel}
        </a>
      </div>
    </div>
  );
}

// === Main Admin Page ===
export default function AdminPage() {
  const { settings, updateSettings } = useStore();
  const [localSettings, setLocalSettings] = useState(settings);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);
  const [activeGuide, setActiveGuide] = useState<KeyGuide | null>(null);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    updateSettings(localSettings);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localSettings),
      });
    } catch { /* empty */ }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleKeyVisibility = (key: string) => {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getConfiguredCount = (fields: KeyField[]) =>
    fields.filter((f) => typeof localSettings[f.key] === 'string' && (localSettings[f.key] as string).length > 0).length;

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="w-6 h-6 text-gray-400" />
        <div>
          <h1 className="text-2xl font-bold">관리자 설정</h1>
          <p className="text-gray-500 text-sm mt-0.5">API 키 및 외부 서비스 연동을 관리합니다</p>
        </div>
      </div>

      {/* Social Channel Management */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Share2 className="w-5 h-5 text-pink-400" />
          <div>
            <h3 className="text-base font-bold">소셜 채널 관리</h3>
            <p className="text-xs text-gray-500">마케팅 채널 등록 및 AI 계정 설정 추천</p>
          </div>
        </div>
        <SocialChannelManager />
      </div>

      {/* Connection Status Overview */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
        {SECTIONS.map((section) => {
          const configured = getConfiguredCount(section.fields);
          const total = section.fields.length;
          return (
            <div key={section.title} className="glass-card p-3 text-center">
              <p className={`text-[10px] font-semibold ${section.color}`}>{section.title}</p>
              <p className="text-lg font-bold mt-1">{configured}/{total}</p>
              <p className="text-[10px] text-gray-500">
                {configured === 0 ? '미연동' : configured === total ? '완료' : '일부 연동'}
              </p>
            </div>
          );
        })}
      </div>

      {/* Sections */}
      {SECTIONS.map((section) => (
        <div key={section.title} className="glass-card p-6 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className={`text-base font-semibold ${section.color}`}>{section.title}</h2>
            <span className="text-[10px] text-gray-500">{getConfiguredCount(section.fields)}/{section.fields.length} 설정됨</span>
          </div>
          <p className="text-xs text-gray-500 mb-4">{section.description}</p>
          <div className="space-y-3">
            {section.fields.map((field) => (
              <div key={field.key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">{field.label}</label>
                    {field.guide && (
                      <button
                        onClick={() => setActiveGuide(field.guide!)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center gap-0.5"
                      >
                        <HelpCircle size={10} /> 등록 방법
                      </button>
                    )}
                  </div>
                  {typeof localSettings[field.key] === 'string' && (localSettings[field.key] as string).length > 0 && (
                    <span className="text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">연동됨</span>
                  )}
                </div>
                <p className="text-[10px] text-gray-500">{field.description}</p>
                {field.isTextarea ? (
                  <textarea
                    value={(localSettings[field.key] as string) || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none text-xs font-mono resize-none"
                  />
                ) : (
                  <div className="relative">
                    <input
                      type={showKeys[field.key] ? 'text' : 'password'}
                      value={(localSettings[field.key] as string) || ''}
                      onChange={(e) => setLocalSettings({ ...localSettings, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 pr-9 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none text-sm font-mono"
                    />
                    <button
                      onClick={() => toggleKeyVisibility(field.key)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showKeys[field.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* General Settings */}
      <div className="glass-card p-6 mb-4">
        <h2 className="text-base font-semibold text-gray-300 mb-4">일반 설정</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">기본 마케팅 예산 (원)</label>
            <input
              type="number"
              value={localSettings.defaultBudget}
              onChange={(e) => setLocalSettings({ ...localSettings, defaultBudget: Number(e.target.value) })}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none text-sm"
            />
          </div>
          {/* CEO 개입 레벨 */}
          <div>
            <label className="text-sm font-medium">CEO 승인 레벨</label>
            <p className="text-[10px] text-gray-500 mb-2">본부장이 승인한 소재에 대한 CEO 개입 수준을 설정합니다</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'auto', label: '완전 자동', desc: '본부장 승인 → 바로 집행' },
                { value: 'ceo_final', label: 'CEO 최종 승인', desc: '본부장 승인 후 CEO 확인 필요' },
                { value: 'ceo_notify', label: 'CEO 알림만', desc: '자동 집행 + CEO에게 알림' },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setLocalSettings({ ...localSettings, ceoApprovalLevel: opt.value })}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    localSettings.ceoApprovalLevel === opt.value
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <p className="text-xs font-medium">{opt.label}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">자동 광고 배포</p>
              <p className="text-[10px] text-gray-500">A/B 테스트 완료 후 자동으로 광고를 집행합니다</p>
            </div>
            <button
              onClick={() => setLocalSettings({ ...localSettings, autoDeployEnabled: !localSettings.autoDeployEnabled })}
              className={`w-11 h-6 rounded-full transition-colors ${localSettings.autoDeployEnabled ? 'bg-blue-600' : 'bg-white/10'}`}
            >
              <div className="rounded-full bg-white shadow-sm transition-transform" style={{ width: 18, height: 18, transform: `translateX(${localSettings.autoDeployEnabled ? 22 : 2}px)` }} />
            </button>
          </div>
        </div>
      </div>

      {/* AI Workflow Map */}
      <AIWorkflowMap settings={localSettings} />

      {/* Save */}
      <button
        onClick={handleSave}
        className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-sm transition-all ${
          saved ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-500'
        }`}
      >
        {saved ? <><CheckCircle size={18} /> 저장 완료!</> : <><Save size={18} /> 설정 저장</>}
      </button>

      {/* Admin Manual */}
      <AdminManual />

      {/* Guide Popup */}
      {activeGuide && <GuidePopup guide={activeGuide} onClose={() => setActiveGuide(null)} />}
    </div>
  );
}

// === AI Workflow Map ===
interface WorkflowStage {
  phase: string;
  label: string;
  emoji: string;
  agents: Array<{ id: string; name: string; role: string }>;
  service: string;
  defaultModel: string;
  description: string;
  callsPerCampaign: string;
  estimatedCost: string;
  required: boolean;
}

const WORKFLOW_STAGES: WorkflowStage[] = [
  {
    phase: 'kickoff',
    label: '킥오프 미팅',
    emoji: '🎬',
    agents: [
      { id: 'hana', name: '하나', role: '본부장' },
      { id: 'minseo', name: '민서', role: '전략가' },
      { id: 'jiwoo', name: '지우', role: 'SEO/카피' },
      { id: 'yuna', name: '유나', role: '디렉터' },
      { id: 'doha', name: '도하', role: '모션' },
      { id: 'taeyang', name: '태양', role: '퍼포먼스' },
      { id: 'eunji', name: '은지', role: '데이터' },
      { id: 'siwon', name: '시원', role: '개발' },
    ],
    service: 'LLM (OpenAI/Claude/Gemini)',
    defaultModel: 'gpt-4o-mini',
    description: '8명 팀원 전체가 캠페인 킥오프 회의를 진행. 한 번의 LLM 호출로 모든 팀원 대화 생성.',
    callsPerCampaign: '1회',
    estimatedCost: '~$0.001',
    required: true,
  },
  {
    phase: 'plan',
    label: '플랜 생성',
    emoji: '📋',
    agents: [{ id: 'minseo', name: '민서', role: '마케팅 전략가' }],
    service: 'LLM (OpenAI/Claude/Gemini)',
    defaultModel: 'gpt-4o-mini',
    description: '캠페인 유형(긴급/단기/표준/장기)에 맞는 일별 마케팅 플랜을 생성.',
    callsPerCampaign: '1회',
    estimatedCost: '~$0.002',
    required: true,
  },
  {
    phase: 'creative',
    label: '소재 생성',
    emoji: '✍️',
    agents: [
      { id: 'jiwoo', name: '지우', role: 'SEO 카피라이터' },
      { id: 'yuna', name: '유나', role: '크리에이티브 디렉터' },
    ],
    service: 'LLM (OpenAI/Claude/Gemini)',
    defaultModel: 'gpt-4o-mini',
    description: '플랫폼별 5가지 앵글의 카피 생성. 채널 톤/포맷/해시태그 자동 반영.',
    callsPerCampaign: '3회 (Day 1, 2, 3)',
    estimatedCost: '~$0.003',
    required: true,
  },
  {
    phase: 'image',
    label: '이미지 생성',
    emoji: '🎨',
    agents: [{ id: 'yuna', name: '유나', role: '크리에이티브 디렉터' }],
    service: 'Gemini Nano Banana 2',
    defaultModel: 'gemini-2.0-flash-exp',
    description: '각 소재별 마케팅 이미지를 AI로 자동 생성. CEO 참고 이미지 스타일 반영.',
    callsPerCampaign: '~15회 (소재 수만큼)',
    estimatedCost: '~$0.60',
    required: false,
  },
  {
    phase: 'video',
    label: '동영상 생성',
    emoji: '🎬',
    agents: [{ id: 'doha', name: '도하', role: '모션 디자이너' }],
    service: 'Runway Gen-4 Turbo',
    defaultModel: 'gen4_turbo',
    description: '이미지 기반 5초 숏폼 영상 생성. CEO 업로드 영상을 우선 소스로 사용.',
    callsPerCampaign: '3회 (상위 3개 소재)',
    estimatedCost: '~$0.75',
    required: false,
  },
  {
    phase: 'banner',
    label: 'Figma 배너 합성',
    emoji: '🖼️',
    agents: [{ id: 'yuna', name: '유나', role: '크리에이티브 디렉터' }],
    service: 'Figma API + Gemini',
    defaultModel: 'gemini-2.0-flash-exp',
    description: 'Figma 템플릿에 AI 카피+이미지를 합성하여 플랫폼별 광고 배너 생성.',
    callsPerCampaign: '~9회 (3소재 × 3플랫폼)',
    estimatedCost: '~$0.36',
    required: false,
  },
  {
    phase: 'vote',
    label: '심사위원 투표',
    emoji: '🗳️',
    agents: [{ id: 'eunji', name: '은지', role: '데이터 엔지니어' }],
    service: 'LLM (OpenAI/Claude/Gemini)',
    defaultModel: 'gpt-4o-mini',
    description: '100인 AI 심사위원단이 각 소재를 평가. 10명 실제 호출 + 90명 시뮬레이션.',
    callsPerCampaign: '~150회 (15소재 × 10심사위원)',
    estimatedCost: '~$0.05',
    required: true,
  },
  {
    phase: 'review',
    label: '본부장 소재 검토',
    emoji: '👩‍💼',
    agents: [{ id: 'hana', name: '하나', role: '본부장' }],
    service: 'LLM (OpenAI/Claude/Gemini)',
    defaultModel: 'gpt-4o-mini',
    description: '각 소재를 브랜드 일관성, 타겟 적합성, 비용 효율 기준으로 검토.',
    callsPerCampaign: '~15회 (소재 수만큼)',
    estimatedCost: '~$0.005',
    required: false,
  },
  {
    phase: 'week-review',
    label: '주간 리뷰 (4단계)',
    emoji: '📊',
    agents: [
      { id: 'eunji', name: '은지', role: '분석' },
      { id: 'minseo', name: '민서', role: '전략' },
      { id: 'taeyang', name: '태양', role: '퍼포먼스' },
      { id: 'jiwoo', name: '지우', role: 'SEO' },
      { id: 'yuna', name: '유나', role: '디렉터' },
      { id: 'hana', name: '하나', role: '본부장' },
    ],
    service: 'LLM (OpenAI/Claude/Gemini) + 외부 API',
    defaultModel: 'gpt-4o-mini',
    description: '실제 외부 API 지표 수집 → 은지 분석 → 4명 의견 → 본부장 종합 결정.',
    callsPerCampaign: '6회 × 4주 = 24회',
    estimatedCost: '~$0.024',
    required: false,
  },
  {
    phase: 'channel_recommend',
    label: '소셜 채널 AI 추천',
    emoji: '📱',
    agents: [
      { id: 'hana', name: '하나', role: '본부장' },
      { id: 'minseo', name: '민서', role: '전략' },
      { id: 'jiwoo', name: '지우', role: 'SEO' },
      { id: 'yuna', name: '유나', role: '디렉터' },
    ],
    service: 'LLM (OpenAI/Claude/Gemini)',
    defaultModel: 'gpt-4o-mini',
    description: '미보유 채널의 알고리즘 최적화 계정 설정 추천 (이름, 바이오, 카테고리).',
    callsPerCampaign: '플랫폼당 1회',
    estimatedCost: '~$0.002/플랫폼',
    required: false,
  },
];

function AIWorkflowMap({ settings }: { settings: AdminSettings }) {
  const [open, setOpen] = useState(false);

  const getStageStatus = (stage: WorkflowStage): { ready: boolean; reason?: string } => {
    if (stage.phase === 'image' || stage.phase === 'banner') {
      if (!settings.geminiApiKey) return { ready: false, reason: 'Gemini 키 필요' };
      if (stage.phase === 'banner' && !settings.figmaApiKey) return { ready: false, reason: 'Figma 키 필요' };
      return { ready: true };
    }
    if (stage.phase === 'video') {
      if (!settings.runwayApiKey) return { ready: false, reason: 'Runway 키 필요' };
      return { ready: true };
    }
    // LLM 사용 단계
    const hasLLM = settings.openaiApiKey || settings.claudeApiKey || settings.geminiApiKey;
    if (!hasLLM) return { ready: false, reason: 'LLM 키 필요' };
    return { ready: true };
  };

  const getActiveLLM = () => {
    if (settings.openaiApiKey) return 'gpt-4o-mini';
    if (settings.claudeApiKey) return 'claude-sonnet-4';
    if (settings.geminiApiKey) return 'gemini-2.0-flash';
    return '미설정';
  };

  return (
    <div className="glass-card p-6 mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <Workflow className="w-5 h-5 text-indigo-400" />
          <div className="text-left">
            <h3 className="text-base font-bold">AI 워크플로우 맵</h3>
            <p className="text-xs text-gray-500">단계별 사용 직원 / AI 서비스 / 모델 / 예상 비용</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] px-2 py-1 rounded-full bg-indigo-500/10 text-indigo-400">
            현재 LLM: {getActiveLLM()}
          </span>
          {open ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
        </div>
      </button>

      {open && (
        <div className="mt-5 border-t border-white/5 pt-5 space-y-3">
          {WORKFLOW_STAGES.map((stage, i) => {
            const status = getStageStatus(stage);
            return (
              <div key={stage.phase} className="rounded-lg bg-white/[0.02] border border-white/5 p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400">{i + 1}</div>
                      {i < WORKFLOW_STAGES.length - 1 && <div className="w-px h-4 bg-white/10 mt-1" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{stage.emoji}</span>
                        <h4 className="text-sm font-bold">{stage.label}</h4>
                        {stage.required ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">필수</span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-500/10 text-gray-400">선택</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{stage.description}</p>
                    </div>
                  </div>
                  {status.ready ? (
                    <span className="text-[10px] px-2 py-1 rounded-full bg-green-500/10 text-green-400 flex-shrink-0">✓ 준비됨</span>
                  ) : (
                    <span className="text-[10px] px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 flex-shrink-0">⚠ {status.reason}</span>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 ml-11">
                  {/* 사용 직원 */}
                  <div className="p-2 rounded bg-white/[0.03]">
                    <p className="text-[9px] text-gray-500 uppercase mb-1">사용 직원</p>
                    <div className="flex flex-wrap gap-1">
                      {stage.agents.slice(0, 4).map((a) => (
                        <span key={a.id} className="text-[10px] text-gray-300">{a.name}</span>
                      ))}
                      {stage.agents.length > 4 && <span className="text-[10px] text-gray-500">+{stage.agents.length - 4}</span>}
                    </div>
                  </div>
                  {/* 서비스 */}
                  <div className="p-2 rounded bg-white/[0.03]">
                    <p className="text-[9px] text-gray-500 uppercase mb-1">AI 서비스</p>
                    <p className="text-[10px] text-blue-400 truncate">{stage.service}</p>
                  </div>
                  {/* 모델 */}
                  <div className="p-2 rounded bg-white/[0.03]">
                    <p className="text-[9px] text-gray-500 uppercase mb-1">기본 모델</p>
                    <p className="text-[10px] text-purple-400 font-mono truncate">{stage.defaultModel}</p>
                  </div>
                  {/* 비용 */}
                  <div className="p-2 rounded bg-white/[0.03]">
                    <p className="text-[9px] text-gray-500 uppercase mb-1">호출 / 예상비용</p>
                    <p className="text-[10px] text-emerald-400">{stage.callsPerCampaign}</p>
                    <p className="text-[10px] text-emerald-400 font-mono">{stage.estimatedCost}</p>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="mt-4 p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/20">
            <p className="text-[11px] text-indigo-300 leading-relaxed">
              💡 <strong>LLM 모델 자동 선택:</strong> 등록된 키 중 OpenAI → Claude → Gemini 순서로 우선 사용됩니다.
              실제 호출되는 모델과 토큰 사용량은 캠페인 상세 → "비용 분석" 페이지에서 확인할 수 있습니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// === Admin Manual Component ===
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ReactMarkdown = require('react-markdown').default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const remarkGfm = require('remark-gfm').default;

function AdminManual() {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const loadManual = async () => {
    if (content) { setOpen(!open); return; }
    setOpen(true);
    setLoading(true);
    try {
      const res = await fetch('/manual/admin-manual.md');
      const text = await res.text();
      setContent(text);
    } catch { setContent('매뉴얼을 불러올 수 없습니다.'); }
    setLoading(false);
  };

  const downloadManual = () => {
    const link = document.createElement('a');
    link.href = '/manual/admin-manual.md';
    link.download = 'AutoGrowth_관리자_매뉴얼.md';
    link.click();
  };

  return (
    <div className="glass-card p-6 mt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-base font-bold">관리자 매뉴얼</h3>
            <p className="text-xs text-gray-500">시스템 운영 가이드 및 기능 설명서</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadManual}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <Download size={13} /> 다운로드
          </button>
          <button
            onClick={loadManual}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-cyan-600 text-white hover:bg-cyan-500 transition-colors"
          >
            {open ? <><ChevronUp size={13} /> 닫기</> : <><ChevronDown size={13} /> 매뉴얼 보기</>}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-5 border-t border-white/5 pt-5">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="manual-content max-h-[70vh] overflow-y-auto pr-2">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
