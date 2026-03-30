'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Settings, Eye, EyeOff, Save, CheckCircle } from 'lucide-react';

interface KeyField {
  key: keyof ReturnType<typeof useStore.getState>['settings'];
  label: string;
  description: string;
  placeholder: string;
  isSecret: boolean;
}

const API_KEY_FIELDS: KeyField[] = [
  {
    key: 'openaiApiKey',
    label: 'OpenAI API Key',
    description: 'GPT-4o 기반 마케팅 플랜 및 카피라이팅 생성',
    placeholder: 'sk-...',
    isSecret: true,
  },
  {
    key: 'claudeApiKey',
    label: 'Claude API Key',
    description: 'Claude 기반 심층 분석 및 크리에이티브 생성',
    placeholder: 'sk-ant-...',
    isSecret: true,
  },
  {
    key: 'geminiApiKey',
    label: 'Gemini API Key',
    description: 'Gemini 기반 다국어 카피라이팅 및 이미지 생성',
    placeholder: 'AI...',
    isSecret: true,
  },
  {
    key: 'figmaApiKey',
    label: 'Figma API Key',
    description: 'Figma 연동 자동 디자인 합성',
    placeholder: 'figd_...',
    isSecret: true,
  },
  {
    key: 'metaAdsToken',
    label: 'Meta Ads Access Token',
    description: 'Facebook/Instagram 광고 자동 집행',
    placeholder: 'EAA...',
    isSecret: true,
  },
  {
    key: 'googleAdsToken',
    label: 'Google Ads API Token',
    description: 'Google/YouTube 광고 자동 집행',
    placeholder: '',
    isSecret: true,
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
    // Also save to DB
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

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="w-6 h-6 text-gray-400" />
        <div>
          <h1 className="text-2xl font-bold">관리자 설정</h1>
          <p className="text-gray-500 text-sm mt-0.5">API 키 및 시스템 설정을 관리합니다</p>
        </div>
      </div>

      {/* API Keys */}
      <div className="glass-card p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">API 키 관리</h2>
        <p className="text-sm text-gray-500 mb-6">
          AI 기능을 사용하려면 해당 API 키를 입력해주세요. 키는 로컬 DB와 브라우저에 저장됩니다.
        </p>
        <div className="space-y-4">
          {API_KEY_FIELDS.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{field.label}</label>
                {localSettings[field.key] && (
                  <span className="text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                    설정됨
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">{field.description}</p>
              <div className="relative">
                <input
                  type={showKeys[field.key] ? 'text' : 'password'}
                  value={(localSettings[field.key] as string) || ''}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, [field.key]: e.target.value })
                  }
                  placeholder={field.placeholder}
                  className="w-full px-4 py-2.5 pr-10 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none text-sm font-mono"
                />
                <button
                  onClick={() => toggleKeyVisibility(field.key)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showKeys[field.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* General Settings */}
      <div className="glass-card p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">일반 설정</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">기본 마케팅 예산 (원)</label>
            <input
              type="number"
              value={localSettings.defaultBudget}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, defaultBudget: Number(e.target.value) })
              }
              className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none text-sm"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">자동 광고 배포</p>
              <p className="text-xs text-gray-500 mt-0.5">A/B 테스트 완료 후 자동으로 광고를 집행합니다</p>
            </div>
            <button
              onClick={() =>
                setLocalSettings({
                  ...localSettings,
                  autoDeployEnabled: !localSettings.autoDeployEnabled,
                })
              }
              className={`w-12 h-6 rounded-full transition-colors ${
                localSettings.autoDeployEnabled ? 'bg-blue-600' : 'bg-white/10'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  localSettings.autoDeployEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-sm transition-all ${
          saved
            ? 'bg-green-600 text-white'
            : 'bg-blue-600 text-white hover:bg-blue-500'
        }`}
      >
        {saved ? (
          <>
            <CheckCircle size={18} /> 저장 완료!
          </>
        ) : (
          <>
            <Save size={18} /> 설정 저장
          </>
        )}
      </button>
    </div>
  );
}
