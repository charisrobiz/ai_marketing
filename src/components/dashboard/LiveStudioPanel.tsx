'use client';

import { useState } from 'react';
import { useStore, CORE_AGENTS } from '@/store/useStore';
import { Radio, MessageCircle, BarChart3, Palette, Send } from 'lucide-react';

type TabType = 'all' | 'plan' | 'creative' | 'vote' | 'chat';

const TABS: { key: TabType; label: string; icon: typeof Radio }[] = [
  { key: 'all', label: '전체', icon: Radio },
  { key: 'plan', label: '플랜', icon: BarChart3 },
  { key: 'creative', label: '크리에이티브', icon: Palette },
  { key: 'vote', label: '투표', icon: MessageCircle },
];

const TYPE_COLORS: Record<string, string> = {
  plan: 'border-l-blue-500',
  creative: 'border-l-purple-500',
  vote: 'border-l-yellow-500',
  deploy: 'border-l-green-500',
  chat: 'border-l-gray-500',
  system: 'border-l-red-500',
};

export default function LiveStudioPanel() {
  const { liveEvents } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const filteredEvents =
    activeTab === 'all'
      ? liveEvents
      : liveEvents.filter((e) => e.type === activeTab);

  return (
    <div className="glass-card p-6 h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Radio className="w-4 h-4 text-red-400 pulse-dot" />
          Live Studio
        </h2>
        <span className="text-xs text-gray-500">{liveEvents.length} events</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-500/20 text-blue-400'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            <tab.icon size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Event Feed */}
      <div className="flex-1 overflow-y-auto space-y-1.5">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-20 text-gray-600">
            <Send className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">아직 이벤트가 없습니다.</p>
            <p className="text-xs mt-1">캠페인을 시작하면 AI 직원들의 활동이 실시간으로 표시됩니다.</p>
          </div>
        ) : (
          filteredEvents.map((event) => {
            const agent = CORE_AGENTS.find((a) => a.id === event.agentId);
            return (
              <div
                key={event.id}
                className={`live-event-item border-l-2 ${TYPE_COLORS[event.type] || 'border-l-gray-500'} pl-3 py-2 hover:bg-white/5 rounded-r-lg transition-colors`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm">{agent?.avatar || '🤖'}</span>
                  <span className="text-xs font-semibold" style={{ color: agent?.color || '#888' }}>
                    {event.agentName}
                  </span>
                  <span className="text-[10px] text-gray-600 ml-auto">
                    {new Date(event.timestamp).toLocaleTimeString('ko-KR')}
                  </span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{event.content}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
