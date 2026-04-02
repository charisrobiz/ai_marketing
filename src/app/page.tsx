'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap, ArrowRight, Users, BarChart3, Sparkles, Target, Play, Loader2 } from 'lucide-react';

const FEATURES = [
  {
    icon: Users,
    title: 'AI 직원 팀',
    desc: '마쥬(마케팅 디렉터)와 코쥬(개발 전문가)가 실시간 협업',
  },
  {
    icon: Sparkles,
    title: '자동 크리에이티브',
    desc: 'AI가 카피라이팅, 이미지, 영상 소재를 자동 생성',
  },
  {
    icon: Target,
    title: '100인 AI 심사위원',
    desc: '다양한 페르소나의 AI가 블라인드 투표로 최고 소재 선별',
  },
  {
    icon: BarChart3,
    title: 'A/B 테스트 자동화',
    desc: '광고 집행부터 예산 최적화까지 완전 자동',
  },
];

export default function Home() {
  const [demoLoading, setDemoLoading] = useState(false);
  const router = useRouter();

  const runDemo = async () => {
    setDemoLoading(true);
    try {
      const res = await fetch('/api/demo', { method: 'POST' });
      const data = await res.json();
      router.push(`/campaign/${data.campaignId}`);
    } catch {
      setDemoLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
          <Zap className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-blue-400 font-medium">Auto-Growth Engine V1</span>
        </div>
        <h1 className="text-5xl font-bold mb-6 leading-tight">
          <span className="gradient-text">AI 직원들이 만드는</span>
          <br />
          마케팅 자동화 플랫폼
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
          제품 정보만 입력하면, AI 마케팅 팀이 30일 플랜 수립부터
          크리에이티브 생성, 심사위원 투표, 광고 집행까지 모든 것을 자동으로 수행합니다.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/campaign/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:opacity-90 transition-opacity"
          >
            캠페인 시작하기
            <ArrowRight size={18} />
          </Link>
          <button
            onClick={runDemo}
            disabled={demoLoading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-green-600 to-teal-600 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {demoLoading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
            {demoLoading ? '생성 중...' : '데모 시뮬레이션'}
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-white/10 text-gray-300 font-medium hover:bg-white/5 transition-colors"
          >
            대시보드 보기
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="glass-card p-6 hover:border-blue-500/30 transition-colors cursor-default"
          >
            <f.icon className="w-8 h-8 text-blue-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
            <p className="text-sm text-gray-400">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Agent Preview */}
      <div className="mt-16 glass-card p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">AI 직원 조직도</h2>
        {/* PM */}
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-3 px-5 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <span className="text-2xl">👩‍💼</span>
            <div>
              <h3 className="font-bold" style={{ color: '#F59E0B' }}>하나 (Hana)</h3>
              <p className="text-xs text-gray-400">본부장 (총괄 PM)</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Marketing Team */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wider text-center">마케팅팀</p>
            {[
              { avatar: '📊', name: '민서', role: '마케팅 전략가', color: '#FF6B6B' },
              { avatar: '🔍', name: '지우', role: 'SEO 스페셜리스트', color: '#F472B6' },
              { avatar: '📈', name: '태양', role: '퍼포먼스 마케터', color: '#EF4444' },
            ].map((a) => (
              <div key={a.name} className="flex items-center gap-2 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                <span className="text-xl">{a.avatar}</span>
                <div>
                  <p className="text-sm font-medium" style={{ color: a.color }}>{a.name}</p>
                  <p className="text-[10px] text-gray-500">{a.role}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Design Team */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider text-center">디자인팀</p>
            {[
              { avatar: '🎨', name: '유나', role: '크리에이티브 디렉터', color: '#A78BFA' },
              { avatar: '🎬', name: '도하', role: '모션/UX 디자이너', color: '#8B5CF6' },
            ].map((a) => (
              <div key={a.name} className="flex items-center gap-2 p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                <span className="text-xl">{a.avatar}</span>
                <div>
                  <p className="text-sm font-medium" style={{ color: a.color }}>{a.name}</p>
                  <p className="text-[10px] text-gray-500">{a.role}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Dev Team */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-teal-400 uppercase tracking-wider text-center">개발팀</p>
            {[
              { avatar: '👨‍💻', name: '시원', role: '풀스택 개발자', color: '#4ECDC4' },
              { avatar: '🔬', name: '은지', role: '데이터 엔지니어 & 분석가', color: '#06B6D4' },
            ].map((a) => (
              <div key={a.name} className="flex items-center gap-2 p-3 rounded-lg bg-teal-500/5 border border-teal-500/10">
                <span className="text-xl">{a.avatar}</span>
                <div>
                  <p className="text-sm font-medium" style={{ color: a.color }}>{a.name}</p>
                  <p className="text-[10px] text-gray-500">{a.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
