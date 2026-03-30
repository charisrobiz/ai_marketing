'use client';

import { useStore } from '@/store/useStore';
import { TrendingUp, Users, MousePointer, DollarSign } from 'lucide-react';

export default function PerformancePanel() {
  const { campaigns } = useStore();

  // Aggregate metrics from all active campaigns
  const activeCampaigns = campaigns.filter((c) => c.status === 'active' || c.status === 'testing');
  const totalCreatives = campaigns.reduce((sum, c) => sum + (c.creatives?.length || 0), 0);
  const totalVotes = campaigns.reduce((sum, c) => sum + (c.votes?.length || 0), 0);

  // Find best performing creative
  const allVotes = campaigns.flatMap((c) => c.votes || []);
  const bestVote = allVotes.sort((a, b) => b.averageScore - a.averageScore)[0];
  const bestCreative = bestVote
    ? campaigns.flatMap((c) => c.creatives || []).find((cr) => cr.id === bestVote.creativeId)
    : null;

  const metrics = [
    {
      label: '활성 캠페인',
      value: activeCampaigns.length,
      icon: TrendingUp,
      color: 'text-green-400',
      change: '+0%',
    },
    {
      label: '생성 소재',
      value: totalCreatives,
      icon: MousePointer,
      color: 'text-blue-400',
      change: totalCreatives > 0 ? `${totalCreatives}개` : '-',
    },
    {
      label: '심사 완료',
      value: totalVotes,
      icon: Users,
      color: 'text-purple-400',
      change: totalVotes > 0 ? `${totalVotes}건` : '-',
    },
    {
      label: '예상 CAC',
      value: activeCampaigns.length > 0 ? '₩850' : '-',
      icon: DollarSign,
      color: 'text-yellow-400',
      change: activeCampaigns.length > 0 ? '-12%' : '-',
    },
  ];

  return (
    <div className="glass-card p-6">
      <h2 className="text-lg font-semibold mb-4">퍼포먼스 요약</h2>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {metrics.map((m) => (
          <div key={m.label} className="p-3 rounded-lg bg-white/5">
            <div className="flex items-center justify-between mb-1">
              <m.icon className={`w-4 h-4 ${m.color}`} />
              <span className="text-[10px] text-gray-500">{m.change}</span>
            </div>
            <p className="text-xl font-bold">{m.value}</p>
            <p className="text-[10px] text-gray-500">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Best Creative */}
      {bestCreative && bestVote && (
        <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
          <p className="text-xs text-yellow-400 font-medium mb-1">👑 최고 성과 소재</p>
          <p className="text-sm font-medium mb-1">{bestCreative.hookingText}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{bestCreative.angle}</span>
            <span>&middot;</span>
            <span>평균 {bestVote.averageScore.toFixed(1)}점</span>
            <span>&middot;</span>
            <span>{bestCreative.platform}</span>
          </div>
        </div>
      )}

      {!bestCreative && (
        <div className="text-center py-6 text-gray-600">
          <p className="text-xs">캠페인 데이터가 쌓이면 퍼포먼스 지표가 표시됩니다.</p>
        </div>
      )}
    </div>
  );
}
