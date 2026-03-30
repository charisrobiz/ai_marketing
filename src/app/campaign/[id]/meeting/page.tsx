'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Radio, MessageCircle, BarChart3, Palette, Vote, Settings, Filter } from 'lucide-react';
import { CORE_AGENTS } from '@/store/useStore';

interface LiveEvent {
  id: string;
  agentId: string;
  agentName: string;
  type: string;
  content: string;
  timestamp: string;
}

const TYPE_FILTERS = [
  { key: 'all', label: '전체', icon: MessageCircle },
  { key: 'chat', label: '대화', icon: MessageCircle },
  { key: 'plan', label: '플랜', icon: BarChart3 },
  { key: 'creative', label: '크리에이티브', icon: Palette },
  { key: 'vote', label: '투표', icon: Vote },
  { key: 'system', label: '시스템', icon: Settings },
];

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  chat: { label: '대화', color: 'bg-gray-500/20 text-gray-300' },
  plan: { label: '플랜', color: 'bg-blue-500/20 text-blue-300' },
  creative: { label: '크리에이티브', color: 'bg-purple-500/20 text-purple-300' },
  vote: { label: '투표', color: 'bg-yellow-500/20 text-yellow-300' },
  deploy: { label: '배포', color: 'bg-green-500/20 text-green-300' },
  system: { label: '시스템', color: 'bg-red-500/20 text-red-300' },
};

export default function MeetingPage() {
  const params = useParams();
  const campaignId = params.id as string;
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const fetchEvents = async () => {
    try {
      const res = await fetch(`/api/events?campaignId=${campaignId}&limit=500`);
      const data = await res.json();
      setEvents(data.reverse());
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    // Poll every 2 seconds for real-time updates
    pollRef.current = setInterval(fetchEvents, 2000);
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events.length]);

  const filtered = filter === 'all' ? events : events.filter((e) => e.type === filter);

  return (
    <div className="max-w-4xl mx-auto py-6 flex flex-col h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link href={`/campaign/${campaignId}`} className="text-gray-500 hover:text-gray-300">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-red-400 pulse-dot" />
            <h1 className="text-xl font-bold">팀 미팅 & 실시간 로그</h1>
          </div>
        </div>
        <span className="text-xs text-gray-500">{events.length}개 메시지</span>
      </div>

      {/* Filters */}
      <div className="flex gap-1 mb-4 shrink-0 overflow-x-auto">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              filter === f.key
                ? 'bg-blue-500/20 text-blue-400'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            <f.icon size={12} />
            {f.label}
          </button>
        ))}
      </div>

      {/* Chat Feed */}
      <div className="flex-1 overflow-y-auto glass-card p-4 space-y-3">
        {loading ? (
          <div className="text-center py-20 text-gray-500 text-sm">로딩 중...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Filter className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">아직 메시지가 없습니다.</p>
            <p className="text-xs mt-1">캠페인 상세 페이지에서 엔진을 시작하세요.</p>
          </div>
        ) : (
          filtered.map((event) => {
            const agent = CORE_AGENTS.find((a) => a.id === event.agentId);
            const badge = TYPE_BADGE[event.type] || TYPE_BADGE.system;

            return (
              <div key={event.id} className="live-event-item flex gap-3">
                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-lg"
                  style={{ background: `${agent?.color || '#666'}15`, border: `1px solid ${agent?.color || '#666'}30` }}
                >
                  {agent?.avatar || '🤖'}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold" style={{ color: agent?.color || '#888' }}>
                      {event.agentName}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${badge.color}`}>
                      {badge.label}
                    </span>
                    <span className="text-[10px] text-gray-600 ml-auto shrink-0">
                      {new Date(event.timestamp).toLocaleTimeString('ko-KR')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed break-words">{event.content}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
