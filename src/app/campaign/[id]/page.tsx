'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { CATEGORY_LABELS } from '@/types';
import type { Campaign } from '@/types';
import CampaignPipeline from '@/components/campaign/CampaignPipeline';
import DailyPlanView from '@/components/campaign/DailyPlanView';
import CreativeGallery from '@/components/campaign/CreativeGallery';
import VotingArena from '@/components/campaign/VotingArena';
import CardNewsPreview from '@/components/campaign/CardNewsPreview';
import {
  ArrowLeft, Rocket, Loader2, MessageCircle, ClipboardList, Download,
  Eye, BarChart3, Palette, Pause, Play, Trash2, Pencil, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

const STATUS_LABELS: Record<string, string> = {
  intake: '정보 수집 중',
  planning: 'AI가 마케팅 플랜을 생성하고 있습니다...',
  creating: 'AI가 크리에이티브 소재를 생성하고 있습니다...',
  voting: '100인 AI 심사위원단이 투표 중입니다...',
  testing: 'A/B 테스트가 진행 중입니다...',
  deploying: '광고를 배포하고 있습니다...',
  active: '캠페인 운영 중 - 주간 리뷰를 진행하여 다음 주차로 이동하세요.',
  paused: '캠페인이 일시정지 되었습니다.',
  completed: '캠페인이 완료되었습니다.',
};

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { campaigns: storeCampaigns, updateCampaign: storeUpdate } = useStore();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'preview'>('overview');
  const [currentWeek, setCurrentWeek] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const storeCampaign = storeCampaigns.find((c) => c.id === id);

  const fetchFromDB = useCallback(async () => {
    try {
      const res = await fetch(`/api/campaigns/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCampaign(data);
        // Determine current week from plan status
        if (data.dailyPlan?.length) {
          const inProgress = data.dailyPlan.find((p: { status: string }) => p.status === 'in_progress');
          if (inProgress) setCurrentWeek(inProgress.week);
          else {
            const completed = data.dailyPlan.filter((p: { status: string }) => p.status === 'completed');
            if (completed.length > 0) {
              const maxWeek = Math.max(...completed.map((p: { week: number }) => p.week));
              setCurrentWeek(Math.min(maxWeek + 1, 4));
            }
          }
        }
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

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(fetchFromDB, 2000);
    return () => clearInterval(interval);
  }, [isRunning, fetchFromDB]);

  const startEngine = async () => {
    if (!campaign || isRunning) return;
    setIsRunning(true);
    try {
      await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: campaign.id, productInfo: campaign.productInfo, status: 'planning' }),
      });
    } catch { /* may already exist */ }
    const { settings } = useStore.getState();
    try {
      await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
    } catch { /* empty */ }
    try {
      await fetch(`/api/engine/${campaign.id}`, { method: 'POST' });
    } catch (error) {
      console.error('Engine error:', error);
    }
    storeUpdate(campaign.id, { status: 'active' });
    await fetchFromDB();
    setIsRunning(false);
  };

  const runWeekReview = async () => {
    if (!campaign || isReviewing) return;
    setIsReviewing(true);
    try {
      await fetch(`/api/campaigns/${id}/week-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentWeek }),
      });
      await fetchFromDB();
    } catch { /* empty */ }
    setIsReviewing(false);
  };

  const pauseCampaign = async () => {
    await fetch(`/api/campaigns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paused' }),
    });
    await fetchFromDB();
  };

  const resumeCampaign = async () => {
    await fetch(`/api/campaigns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active' }),
    });
    await fetchFromDB();
  };

  const deleteCampaign = async () => {
    // Delete from DB
    try {
      await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
    } catch { /* empty */ }
    // Remove from store
    const store = useStore.getState();
    const filtered = store.campaigns.filter((c) => c.id !== id);
    useStore.setState({ campaigns: filtered });
    router.push('/campaigns');
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
        <Link href="/campaigns" className="text-blue-400 hover:underline text-sm">캠페인 목록으로 돌아가기</Link>
      </div>
    );
  }

  const hasData = campaign.dailyPlan?.length || campaign.creatives?.length;
  const isActive = campaign.status === 'active';
  const isPaused = campaign.status === 'paused';
  const isCompleted = campaign.status === 'completed';

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

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {!isRunning && !hasData && (
              <button onClick={startEngine}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium text-sm hover:opacity-90 transition-opacity">
                <Rocket size={16} /> 엔진 시작
              </button>
            )}
            {isRunning && (
              <div className="flex items-center gap-2 text-blue-400 text-sm">
                <Loader2 size={16} className="animate-spin" /> AI 엔진 작동 중...
              </div>
            )}

            {/* Pause / Resume */}
            {isActive && (
              <button onClick={pauseCampaign}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-yellow-500/30 text-yellow-400 text-sm hover:bg-yellow-500/10 transition-colors">
                <Pause size={14} /> 일시정지
              </button>
            )}
            {isPaused && (
              <button onClick={resumeCampaign}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-green-500/30 text-green-400 text-sm hover:bg-green-500/10 transition-colors">
                <Play size={14} /> 재개
              </button>
            )}

            {/* Edit - go to campaign/new with prefill (simplified: link to edit) */}
            {hasData && !isRunning && (
              <Link href={`/campaign/${id}/meeting`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-blue-500/30 text-blue-400 text-sm hover:bg-blue-500/10 transition-colors">
                <Pencil size={14} /> 미팅 로그
              </Link>
            )}

            {/* Delete */}
            {showDeleteConfirm ? (
              <div className="flex items-center gap-1">
                <button onClick={deleteCampaign}
                  className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium">
                  삭제 확인
                </button>
                <button onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-2 rounded-lg border border-white/10 text-gray-400 text-sm">
                  취소
                </button>
              </div>
            ) : (
              <button onClick={() => setShowDeleteConfirm(true)}
                className="p-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Link href={`/campaign/${id}/report`}
          className="glass-card p-4 flex items-center gap-3 hover:border-green-500/30 transition-colors">
          <BarChart3 className="w-5 h-5 text-green-400" />
          <div>
            <p className="text-sm font-medium">주간 리포트</p>
            <p className="text-[10px] text-gray-500">성과 데이터 & 인사이트</p>
          </div>
        </Link>
        <Link href={`/campaign/${id}/meeting`}
          className="glass-card p-4 flex items-center gap-3 hover:border-blue-500/30 transition-colors">
          <MessageCircle className="w-5 h-5 text-blue-400" />
          <div>
            <p className="text-sm font-medium">팀 미팅</p>
            <p className="text-[10px] text-gray-500">실시간 대화 보기</p>
          </div>
        </Link>
        <Link href={`/campaign/${id}/tasks`}
          className="glass-card p-4 flex items-center gap-3 hover:border-purple-500/30 transition-colors">
          <ClipboardList className="w-5 h-5 text-purple-400" />
          <div>
            <p className="text-sm font-medium">작업 보드</p>
            <p className="text-[10px] text-gray-500">칸반 스타일 현황</p>
          </div>
        </Link>
        <a href={`/api/export/${id}`} download
          className="glass-card p-4 flex items-center gap-3 hover:border-orange-500/30 transition-colors">
          <Download className="w-5 h-5 text-orange-400" />
          <div>
            <p className="text-sm font-medium">결과 다운로드</p>
            <p className="text-[10px] text-gray-500">JSON 전체 내보내기</p>
          </div>
        </a>
      </div>

      {/* Pipeline Status */}
      <CampaignPipeline status={campaign.status} />

      {/* Weekly Progress Bar + Review Button */}
      {hasData && (isActive || isPaused || isCompleted) && (
        <div className="glass-card p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">주간 진행 현황</h3>
            {isActive && currentWeek <= 4 && (
              <button onClick={runWeekReview} disabled={isReviewing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
                {isReviewing ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
                {isReviewing ? '리뷰 중...' : `Week ${currentWeek} 리뷰 미팅 → Week ${Math.min(currentWeek + 1, 4)}`}
              </button>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((week) => {
              const weekPlans = campaign.dailyPlan?.filter((p) => p.week === week) || [];
              const completedCount = weekPlans.filter((p) => p.status === 'completed').length;
              const isCurrentWeek = week === currentWeek && isActive;
              const isDone = weekPlans.length > 0 && completedCount === weekPlans.length;
              const isPast = week < currentWeek;

              return (
                <div key={week} className={`p-3 rounded-lg border ${
                  isCurrentWeek ? 'border-blue-500/50 bg-blue-500/10' :
                  isDone || isPast ? 'border-green-500/30 bg-green-500/5' :
                  'border-white/10 bg-white/5'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold ${
                      isCurrentWeek ? 'text-blue-400' : isDone || isPast ? 'text-green-400' : 'text-gray-500'
                    }`}>Week {week}</span>
                    {(isDone || isPast) && <span className="text-[10px] text-green-400">완료</span>}
                    {isCurrentWeek && <span className="text-[10px] text-blue-400 pulse-dot">진행 중</span>}
                  </div>
                  <p className="text-[10px] text-gray-500">
                    {week === 1 ? '시장 검증 & 초기 유저' :
                     week === 2 ? '오가닉 성장 & 바이럴' :
                     week === 3 ? '데이터 최적화 & 스케일' :
                     '리텐션 & 목표 달성'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Status Message */}
      <div className="glass-card p-4 mb-6">
        <div className="flex items-center gap-2">
          {isRunning && <Loader2 size={14} className="animate-spin text-blue-400" />}
          <p className="text-sm text-gray-400">{STATUS_LABELS[campaign.status] || STATUS_LABELS.active}</p>
        </div>
      </div>

      {/* Tab Switcher */}
      {campaign.creatives && campaign.creatives.length > 0 && (
        <div className="flex gap-2 mb-6">
          <button onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'overview' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:bg-white/5'
            }`}>
            <BarChart3 size={14} /> 분석 데이터
          </button>
          <button onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'preview' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-500 hover:bg-white/5'
            }`}>
            <Eye size={14} /> 결과물 미리보기
          </button>
        </div>
      )}

      {activeTab === 'overview' ? (
        <>
          {campaign.dailyPlan && campaign.dailyPlan.length > 0 && (
            <DailyPlanView plans={campaign.dailyPlan} />
          )}
          {campaign.creatives && campaign.creatives.length > 0 && (
            <CreativeGallery creatives={campaign.creatives} />
          )}
          {campaign.votes && campaign.votes.length > 0 && (
            <VotingArena votes={campaign.votes} creatives={campaign.creatives || []} />
          )}
        </>
      ) : (
        <>
          {campaign.creatives && campaign.creatives.length > 0 && (
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-6">
                <Palette className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-semibold">마케팅 결과물 미리보기</h2>
                <span className="text-xs text-gray-500 ml-auto">{campaign.creatives.length}개 소재</span>
              </div>
              <CardNewsPreview creatives={campaign.creatives} productName={campaign.productInfo.name} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
