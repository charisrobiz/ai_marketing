'use client';

import { useStore, CORE_AGENTS } from '@/store/useStore';
import { Radio } from 'lucide-react';

const TYPE_COLORS: Record<string, string> = {
  plan: 'border-l-blue-500',
  creative: 'border-l-purple-500',
  vote: 'border-l-yellow-500',
  deploy: 'border-l-green-500',
  chat: 'border-l-gray-500',
  system: 'border-l-red-500',
};

const TYPE_LABELS: Record<string, string> = {
  plan: '플랜',
  creative: '크리에이티브',
  vote: '투표',
  deploy: '배포',
  chat: '대화',
  system: '시스템',
};

export default function LiveEventFeed() {
  const { liveEvents } = useStore();

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Radio className="w-4 h-4 text-red-400 pulse-dot" />
          Live Studio
        </h2>
        <span className="text-xs text-gray-500">{liveEvents.length} events</span>
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {liveEvents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-sm">아직 이벤트가 없습니다.</p>
            <p className="text-xs mt-1">캠페인을 시작하면 AI 직원들의 활동이 여기에 표시됩니다.</p>
          </div>
        ) : (
          liveEvents.map((event) => {
            const agent = CORE_AGENTS.find((a) => a.id === event.agentId);
            return (
              <div
                key={event.id}
                className={`live-event-item border-l-2 ${TYPE_COLORS[event.type] || 'border-l-gray-500'} pl-3 py-2`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{agent?.avatar || '🤖'}</span>
                  <span className="text-sm font-medium" style={{ color: agent?.color }}>
                    {event.agentName}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500">
                    {TYPE_LABELS[event.type] || event.type}
                  </span>
                  <span className="text-[10px] text-gray-600 ml-auto">
                    {new Date(event.timestamp).toLocaleTimeString('ko-KR')}
                  </span>
                </div>
                <p className="text-sm text-gray-300">{event.content}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
