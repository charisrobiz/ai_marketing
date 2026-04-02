'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Settings, Eye, EyeOff, Save, CheckCircle } from 'lucide-react';
import type { AdminSettings } from '@/types';

interface KeyField {
  key: keyof AdminSettings;
  label: string;
  description: string;
  placeholder: string;
  isTextarea?: boolean;
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
      { key: 'openaiApiKey', label: 'OpenAI API Key', description: 'GPT-4o 기반 마케팅 플랜 및 카피라이팅', placeholder: 'sk-...' },
      { key: 'claudeApiKey', label: 'Claude API Key', description: 'Claude 기반 심층 분석 및 크리에이티브', placeholder: 'sk-ant-...' },
      { key: 'geminiApiKey', label: 'Gemini API Key', description: 'Gemini 기반 다국어 카피라이팅 및 이미지 생성', placeholder: 'AI...' },
    ],
  },
  {
    title: '광고 플랫폼 (Ads)',
    description: '실제 광고 집행 및 CTR, CPA 등 퍼포먼스 데이터를 가져옵니다.',
    color: 'text-red-400',
    fields: [
      { key: 'metaAdsToken', label: 'Meta Ads Access Token', description: 'Facebook/Instagram 광고 데이터 조회 및 집행', placeholder: 'EAA...' },
      { key: 'metaAdAccountId', label: 'Meta Ad Account ID', description: '광고 계정 ID (act_XXXXXXX)', placeholder: 'act_123456789' },
      { key: 'googleAdsToken', label: 'Google Ads OAuth Token', description: 'Google/YouTube 광고 데이터 조회', placeholder: 'ya29...' },
      { key: 'googleAdsDeveloperToken', label: 'Google Ads Developer Token', description: 'Google Ads API 개발자 토큰', placeholder: '' },
      { key: 'googleAdsCustomerId', label: 'Google Ads Customer ID', description: '광고 고객 ID (XXX-XXX-XXXX)', placeholder: '123-456-7890' },
    ],
  },
  {
    title: 'Analytics (분석)',
    description: '설치수, 리텐션, 전환율 등 앱 내 사용자 행동 데이터를 가져옵니다.',
    color: 'text-green-400',
    fields: [
      { key: 'firebaseProjectId', label: 'Firebase Project ID', description: '설치수, DAU, 리텐션, 이벤트 데이터', placeholder: 'my-app-12345' },
      { key: 'firebaseServiceAccountKey', label: 'Firebase Service Account Key (JSON)', description: '서비스 계정 키 JSON 전체를 붙여넣기', placeholder: '{"type": "service_account", ...}', isTextarea: true },
    ],
  },
  {
    title: '어트리뷰션 (MMP)',
    description: '오가닉/페이드 구분, 채널별 기여도 분석에 사용됩니다.',
    color: 'text-purple-400',
    fields: [
      { key: 'appsflyerApiToken', label: 'AppsFlyer API Token', description: '설치 어트리뷰션, 오가닉/페이드 비율', placeholder: '' },
      { key: 'appsflyerAppId', label: 'AppsFlyer App ID', description: '앱 식별자 (iOS: id123, Android: com.xxx)', placeholder: 'com.example.app' },
    ],
  },
  {
    title: '앱 스토어',
    description: '앱스토어/플레이스토어 설치수, 평점, 리뷰 데이터를 가져옵니다.',
    color: 'text-orange-400',
    fields: [
      { key: 'appStoreConnectKeyId', label: 'App Store Connect Key ID', description: 'Apple API Key ID', placeholder: '' },
      { key: 'appStoreConnectIssuerId', label: 'App Store Connect Issuer ID', description: 'Issuer ID', placeholder: '' },
      { key: 'appStoreConnectPrivateKey', label: 'App Store Connect Private Key', description: 'AuthKey .p8 내용', placeholder: '-----BEGIN PRIVATE KEY-----\n...', isTextarea: true },
      { key: 'googlePlayJsonKey', label: 'Google Play Service Account Key (JSON)', description: 'Google Play Console API 서비스 계정 키', placeholder: '{"type": "service_account", ...}', isTextarea: true },
    ],
  },
  {
    title: '디자인',
    description: 'Figma 연동 자동 디자인 합성에 사용됩니다.',
    color: 'text-violet-400',
    fields: [
      { key: 'figmaApiKey', label: 'Figma API Key', description: 'Figma 연동 자동 디자인', placeholder: 'figd_...' },
    ],
  },
];

export default function AdminPage() {
  const { settings, updateSettings } = useStore();
  const [localSettings, setLocalSettings] = useState(settings);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

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
    } catch { /* fallback to localStorage only */ }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleKeyVisibility = (key: string) => {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getConfiguredCount = (fields: KeyField[]) => {
    return fields.filter((f) => {
      const val = localSettings[f.key];
      return typeof val === 'string' && val.length > 0;
    }).length;
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="w-6 h-6 text-gray-400" />
        <div>
          <h1 className="text-2xl font-bold">관리자 설정</h1>
          <p className="text-gray-500 text-sm mt-0.5">API 키 및 외부 서비스 연동을 관리합니다</p>
        </div>
      </div>

      {/* Connection Status Overview */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
        {SECTIONS.map((section) => {
          const configured = getConfiguredCount(section.fields);
          const total = section.fields.length;
          return (
            <div key={section.title} className="glass-card p-3 text-center">
              <p className={`text-[10px] font-semibold ${section.color}`}>{section.title}</p>
              <p className="text-lg font-bold mt-1">
                {configured}/{total}
              </p>
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
            <span className="text-[10px] text-gray-500">
              {getConfiguredCount(section.fields)}/{section.fields.length} 설정됨
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-4">{section.description}</p>
          <div className="space-y-3">
            {section.fields.map((field) => (
              <div key={field.key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">{field.label}</label>
                  {typeof localSettings[field.key] === 'string' && (localSettings[field.key] as string).length > 0 && (
                    <span className="text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">연동됨</span>
                  )}
                </div>
                <p className="text-[10px] text-gray-500">{field.description}</p>
                <div className="relative">
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
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">자동 광고 배포</p>
              <p className="text-[10px] text-gray-500">A/B 테스트 완료 후 자동으로 광고를 집행합니다</p>
            </div>
            <button
              onClick={() => setLocalSettings({ ...localSettings, autoDeployEnabled: !localSettings.autoDeployEnabled })}
              className={`w-11 h-6 rounded-full transition-colors ${localSettings.autoDeployEnabled ? 'bg-blue-600' : 'bg-white/10'}`}
            >
              <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform ${localSettings.autoDeployEnabled ? 'translate-x-5.5' : 'translate-x-0.5'}`} style={{ width: 18, height: 18, transform: `translateX(${localSettings.autoDeployEnabled ? 22 : 2}px)` }} />
            </button>
          </div>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-sm transition-all ${
          saved ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-500'
        }`}
      >
        {saved ? <><CheckCircle size={18} /> 저장 완료!</> : <><Save size={18} /> 설정 저장</>}
      </button>
    </div>
  );
}
