'use client';

import { useStore } from '@/store/useStore';
import { Activity, BarChart3, Users, Zap, Radio } from 'lucide-react';
import LiveStudioPanel from '@/components/dashboard/LiveStudioPanel';
import AgentStatusPanel from '@/components/dashboard/AgentStatusPanel';
import PerformancePanel from '@/components/dashboard/PerformancePanel';
import CampaignOverview from '@/components/dashboard/CampaignOverview';

export default function DashboardPage() {
  const { campaigns, liveEvents, agents } = useStore();

  const stats = [
    { label: '활성 캠페인', value: campaigns.filter(c => c.status === 'active').length, icon: Zap, color: 'text-blue-400' },
    { label: '생성된 소재', value: campaigns.reduce((sum, c) => sum + (c.creatives?.length || 0), 0), icon: BarChart3, color: 'text-green-400' },
    { label: 'AI 직원 활동', value: `${agents.filter(a => a.status === 'working').length}/${agents.length}`, icon: Users, color: 'text-purple-400' },
    { label: '실시간 이벤트', value: liveEvents.length, icon: Activity, color: 'text-orange-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">대시보드</h1>
          <p className="text-gray-500 text-sm mt-1">AI 마케팅 엔진 실시간 관제</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
          <Radio className="w-3 h-3 text-green-400 pulse-dot" />
          <span className="text-xs text-green-400 font-medium">LIVE</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">{stat.label}</span>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main Grid: Live Studio + Side panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Studio - 2 columns */}
        <div className="lg:col-span-2">
          <LiveStudioPanel />
        </div>
        {/* Side panels */}
        <div className="space-y-6">
          <AgentStatusPanel />
          <PerformancePanel />
        </div>
      </div>

      {/* Campaign Overview */}
      <CampaignOverview />
    </div>
  );
}
