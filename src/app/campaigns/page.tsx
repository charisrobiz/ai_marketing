'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { CATEGORY_LABELS } from '@/types';
import type { Campaign } from '@/types';
import { Plus, FolderOpen, ArrowRight } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  intake: { label: '정보 수집', color: 'text-gray-400', bg: 'bg-gray-500/10' },
  planning: { label: '플랜 생성', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  creating: { label: '소재 생성', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  voting: { label: '투표 진행', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  testing: { label: 'A/B 테스트', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  deploying: { label: '배포 중', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  active: { label: '운영 중', color: 'text-green-400', bg: 'bg-green-500/10' },
  completed: { label: '완료', color: 'text-gray-400', bg: 'bg-gray-500/10' },
};

export default function CampaignsPage() {
  const { campaigns: storeCampaigns } = useStore();
  const [dbCampaigns, setDbCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    fetch('/api/campaigns')
      .then((res) => res.json())
      .then((data) => setDbCampaigns(data))
      .catch(() => {});
  }, []);

  // Merge: DB campaigns + store-only campaigns (dedup by id)
  const dbIds = new Set(dbCampaigns.map((c) => c.id));
  const storeOnly = storeCampaigns.filter((c) => !dbIds.has(c.id));
  const campaigns = [...dbCampaigns, ...storeOnly];

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <FolderOpen className="w-6 h-6 text-gray-400" />
          <div>
            <h1 className="text-2xl font-bold">캠페인 목록</h1>
            <p className="text-gray-500 text-sm mt-0.5">총 {campaigns.length}개 캠페인</p>
          </div>
        </div>
        <Link
          href="/campaign/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors"
        >
          <Plus size={16} /> 새 캠페인
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <FolderOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-400 mb-2">아직 캠페인이 없습니다</h2>
          <p className="text-sm text-gray-500 mb-6">
            새 캠페인을 만들어 AI 마케팅 팀을 가동시키세요.
          </p>
          <Link
            href="/campaign/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:opacity-90 transition-opacity"
          >
            첫 캠페인 만들기 <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => {
            const status = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.intake;
            return (
              <Link
                key={campaign.id}
                href={`/campaign/${campaign.id}`}
                className="glass-card p-5 flex items-center justify-between hover:border-blue-500/30 transition-colors block"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{campaign.productInfo.name}</h3>
                    {campaign.mode === 'demo' ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-300 border border-gray-500/30">
                        🎬 데모
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        🚀 실제
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${status.color} ${status.bg}`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>{CATEGORY_LABELS[campaign.productInfo.category]}</span>
                    <span>{new Date(campaign.createdAt).toLocaleDateString('ko-KR')}</span>
                    {campaign.creatives && (
                      <span>소재 {campaign.creatives.length}개</span>
                    )}
                  </div>
                </div>
                <ArrowRight size={18} className="text-gray-600" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
