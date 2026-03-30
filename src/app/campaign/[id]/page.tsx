'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { CATEGORY_LABELS } from '@/types';
import type { Campaign } from '@/types';
import CampaignPipeline from '@/components/campaign/CampaignPipeline';
import DailyPlanView from '@/components/campaign/DailyPlanView';
import CreativeGallery from '@/components/campaign/CreativeGallery';
import VotingArena from '@/components/campaign/VotingArena';
import { ArrowLeft, Rocket, Loader2, MessageCircle, ClipboardList, Download } from 'lucide-react';
import Link from 'next/link';

const STATUS_LABELS: Record<string, string> = {
  intake: '정보 수집 중',
  planning: 'AI가 마케팅 플랜을 생성하고 있습니다...',
  creating: 'AI가 크리에이티브 소재를 생성하고 있습니다...',
  voting: '100인 AI 심사위원단이 투표 중입니다...',
  testing: 'A/B 테스트가 진행 중입니다...',
  deploying: '광고를 배포하고 있습니다...',
  active: '캠페인이 운영 중입니다.',
  completed: '캠페인이 완료되었습니다.',
};

export default function CampaignDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { campaigns: storeCampaigns, addCampaign, updateCampaign: storeUpdate } = useStore();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(true);

  // Try store first, then fetch from DB
  const storeCampaign = storeCampaigns.find((c) => c.id === id);

  const fetchFromDB = useCallback(async () => {
    try {
      const res = await fetch(`/api/campaigns/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCampaign(data);
      }
    } catch { /* empty */ }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    if (storeCampaign) {
      setCampaign(storeCampaign);
      setLoading(false);
    }
    fetchFromDB();
  }, [storeCampaign, fetchFromDB]);

  // Poll for updates while engine is running
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(fetchFromDB, 2000);
    return () => clearInterval(interval);
  }, [isRunning, fetchFromDB]);

  const startEngine = async () => {
    if (!campaign || isRunning) return;
    setIsRunning(true);

    // Save campaign to DB first
    try {
      await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: campaign.id,
          productInfo: campaign.productInfo,
          status: 'planning',
        }),
      });
    } catch { /* may already exist */ }

    // Save admin settings to DB
    const { settings } = useStore.getState();
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
    } catch { /* empty */ }

    // Run engine via API
    try {
      await fetch(`/api/engine/${campaign.id}`, { method: 'POST' });
    } catch (error) {
      console.error('Engine error:', error);
    }

    // Update local store
    storeUpdate(campaign.id, { status: 'active' });
    await fetchFromDB();
    setIsRunning(false);
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-400" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">캠페인을 찾을 수 없습니다.</p>
        <Link href="/campaigns" className="text-blue-400 hover:underline text-sm">
          캠페인 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const hasData = campaign.dailyPlan?.length || campaign.creatives?.length;

  return (
    <div className="max-w-5xl mx-auto py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/campaigns" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-300 mb-3">
          <ArrowLeft size={14} /> 캠페인 목록
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{campaign.productInfo.name}</h1>
            <p className="text-gray-500 text-sm mt-1">
              {CATEGORY_LABELS[campaign.productInfo.category]} &middot;{' '}
              {new Date(campaign.createdAt).toLocaleDateString('ko-KR')}
            </p>
          </div>
          {!isRunning && !hasData && (
            <button
              onClick={startEngine}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium text-sm hover:opacity-90 transition-opacity"
            >
              <Rocket size={16} /> 엔진 시작
            </button>
          )}
          {isRunning && (
            <div className="flex items-center gap-2 text-blue-400 text-sm">
              <Loader2 size={16} className="animate-spin" /> AI 엔진 작동 중...
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Link
          href={`/campaign/${id}/meeting`}
          className="glass-card p-4 flex items-center gap-3 hover:border-blue-500/30 transition-colors"
        >
          <MessageCircle className="w-5 h-5 text-blue-400" />
          <div>
            <p className="text-sm font-medium">팀 미팅</p>
            <p className="text-[10px] text-gray-500">실시간 대화 보기</p>
          </div>
        </Link>
        <Link
          href={`/campaign/${id}/tasks`}
          className="glass-card p-4 flex items-center gap-3 hover:border-purple-500/30 transition-colors"
        >
          <ClipboardList className="w-5 h-5 text-purple-400" />
          <div>
            <p className="text-sm font-medium">작업 보드</p>
            <p className="text-[10px] text-gray-500">칸반 스타일 현황</p>
          </div>
        </Link>
        <a
          href={`/api/export/${id}`}
          download
          className="glass-card p-4 flex items-center gap-3 hover:border-green-500/30 transition-colors"
        >
          <Download className="w-5 h-5 text-green-400" />
          <div>
            <p className="text-sm font-medium">결과 다운로드</p>
            <p className="text-[10px] text-gray-500">JSON 전체 내보내기</p>
          </div>
        </a>
      </div>

      {/* Pipeline Status */}
      <CampaignPipeline status={campaign.status} />

      {/* Status Message */}
      <div className="glass-card p-4 mb-6">
        <div className="flex items-center gap-2">
          {isRunning && <Loader2 size={14} className="animate-spin text-blue-400" />}
          <p className="text-sm text-gray-400">{STATUS_LABELS[campaign.status]}</p>
        </div>
      </div>

      {/* Content */}
      {campaign.dailyPlan && campaign.dailyPlan.length > 0 && (
        <DailyPlanView plans={campaign.dailyPlan} />
      )}
      {campaign.creatives && campaign.creatives.length > 0 && (
        <CreativeGallery creatives={campaign.creatives} />
      )}
      {campaign.votes && campaign.votes.length > 0 && (
        <VotingArena votes={campaign.votes} creatives={campaign.creatives || []} />
      )}
    </div>
  );
}
