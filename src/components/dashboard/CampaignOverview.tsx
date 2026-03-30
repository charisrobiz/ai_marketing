'use client';

import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { Plus, ArrowRight } from 'lucide-react';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  intake: { label: '정보 수집', color: 'text-gray-400 bg-gray-500/10' },
  planning: { label: '플랜 생성', color: 'text-blue-400 bg-blue-500/10' },
  creating: { label: '소재 생성', color: 'text-purple-400 bg-purple-500/10' },
  voting: { label: '투표 진행', color: 'text-yellow-400 bg-yellow-500/10' },
  testing: { label: 'A/B 테스트', color: 'text-orange-400 bg-orange-500/10' },
  deploying: { label: '배포 중', color: 'text-cyan-400 bg-cyan-500/10' },
  active: { label: '운영 중', color: 'text-green-400 bg-green-500/10' },
  completed: { label: '완료', color: 'text-gray-400 bg-gray-500/10' },
};

export default function CampaignOverview() {
  const { campaigns } = useStore();

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">캠페인 현황</h2>
        <Link
          href="/campaign/new"
          className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          <Plus size={14} /> 새 캠페인
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm mb-4">아직 캠페인이 없습니다.</p>
          <Link
            href="/campaign/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-500 transition-colors"
          >
            첫 캠페인 만들기 <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {campaigns.map((campaign) => {
            const statusInfo = STATUS_LABELS[campaign.status] || STATUS_LABELS.intake;
            return (
              <Link
                key={campaign.id}
                href={`/campaign/${campaign.id}`}
                className="flex items-center justify-between p-4 rounded-lg hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-medium group-hover:text-blue-400 transition-colors">
                      {campaign.productInfo.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(campaign.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                  <ArrowRight size={14} className="text-gray-600 group-hover:text-gray-400" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
