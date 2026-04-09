'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, DollarSign, Users, Layers, Loader2, Cpu } from 'lucide-react';

interface UsageData {
  summary: {
    totalCost: number;
    totalCostKRW: number;
    totalCalls: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    mediaCost: number;
    mediaCount: number;
  };
  byAgent: Record<string, { name: string; calls: number; cost: number; tokens: number }>;
  byPhase: Record<string, { calls: number; cost: number }>;
  byModel: Record<string, { calls: number; cost: number; tokens: number }>;
  recentLogs: Array<{
    id: number; agent_name: string; phase: string; task_description?: string;
    model?: string; input_tokens?: number; output_tokens?: number;
    media_type?: string; media_count?: number; cost_usd: number; created_at: string;
  }>;
}

const PHASE_LABELS: Record<string, string> = {
  kickoff: '킥오프 미팅',
  plan: '플랜 생성',
  creative: '소재 생성',
  vote: '심사위원 투표',
  review: '본부장 검토',
  'week-review': '주간 리뷰',
  image: '이미지 생성',
  video: '동영상 생성',
  banner: 'Figma 배너',
  channel_recommend: '채널 추천',
};

export default function CampaignCostPage() {
  const { id } = useParams() as { id: string };
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/usage/${id}`).then((r) => r.json()).then((d) => { setData(d); setLoading(false); });
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-6 h-6 animate-spin text-blue-400" /></div>;
  }

  if (!data) return <div className="text-center py-20 text-gray-500">데이터 없음</div>;

  const { summary, byAgent, byPhase, byModel, recentLogs } = data;
  const agentList = Object.entries(byAgent).sort((a, b) => b[1].cost - a[1].cost);
  const phaseList = Object.entries(byPhase).sort((a, b) => b[1].cost - a[1].cost);
  const modelList = Object.entries(byModel);
  const maxPhaseCost = Math.max(...phaseList.map(([, v]) => v.cost), 0.000001);

  return (
    <div className="max-w-4xl mx-auto py-8">
      <Link href={`/campaign/${id}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-300 mb-4">
        <ArrowLeft size={14} /> 캠페인으로 돌아가기
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <DollarSign className="w-6 h-6 text-emerald-400" />
        <div>
          <h1 className="text-2xl font-bold">비용 분석</h1>
          <p className="text-gray-500 text-sm">이 캠페인에서 발생한 AI 사용량 및 비용</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="glass-card p-4">
          <p className="text-[10px] text-gray-500 mb-1">총 비용</p>
          <p className="text-2xl font-bold text-emerald-400">${summary.totalCost.toFixed(4)}</p>
          <p className="text-xs text-gray-500 mt-1">~{summary.totalCostKRW.toLocaleString()}원</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-[10px] text-gray-500 mb-1">API 호출</p>
          <p className="text-2xl font-bold text-blue-400">{summary.totalCalls}회</p>
          <p className="text-xs text-gray-500 mt-1">전체 LLM + 미디어</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-[10px] text-gray-500 mb-1">총 토큰</p>
          <p className="text-2xl font-bold text-purple-400">{(summary.totalInputTokens + summary.totalOutputTokens).toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">in {summary.totalInputTokens.toLocaleString()} / out {summary.totalOutputTokens.toLocaleString()}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-[10px] text-gray-500 mb-1">미디어 생성</p>
          <p className="text-2xl font-bold text-pink-400">{summary.mediaCount}개</p>
          <p className="text-xs text-gray-500 mt-1">${summary.mediaCost.toFixed(4)}</p>
        </div>
      </div>

      {/* By Agent */}
      <div className="glass-card p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-blue-400" />
          <h2 className="text-base font-bold">직원별 사용량</h2>
        </div>
        {agentList.length === 0 ? (
          <p className="text-sm text-gray-500">데이터 없음</p>
        ) : (
          <div className="space-y-2">
            {agentList.map(([id, agent]) => (
              <div key={id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-sm font-medium">{agent.name}</p>
                  <p className="text-xs text-gray-500">{agent.calls}회 호출 · {agent.tokens.toLocaleString()} 토큰</p>
                </div>
                <p className="text-sm font-mono text-emerald-400">${agent.cost.toFixed(5)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* By Phase */}
      <div className="glass-card p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4 text-purple-400" />
          <h2 className="text-base font-bold">단계별 비용</h2>
        </div>
        {phaseList.length === 0 ? (
          <p className="text-sm text-gray-500">데이터 없음</p>
        ) : (
          <div className="space-y-3">
            {phaseList.map(([phase, info]) => (
              <div key={phase}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">{PHASE_LABELS[phase] || phase}</span>
                  <span className="text-xs font-mono text-emerald-400">${info.cost.toFixed(5)} ({info.calls}회)</span>
                </div>
                <div className="h-2 bg-white/5 rounded overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: `${(info.cost / maxPhaseCost) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* By Model */}
      {modelList.length > 0 && (
        <div className="glass-card p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base font-bold">모델별 사용량</h2>
          </div>
          <div className="space-y-2">
            {modelList.map(([model, info]) => (
              <div key={model} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-sm font-mono">{model}</p>
                  <p className="text-xs text-gray-500">{info.calls}회 · {info.tokens.toLocaleString()} 토큰</p>
                </div>
                <p className="text-sm font-mono text-emerald-400">${info.cost.toFixed(5)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Logs */}
      {recentLogs.length > 0 && (
        <div className="glass-card p-5">
          <h2 className="text-base font-bold mb-3">최근 로그</h2>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between gap-3 text-xs py-1.5 border-b border-white/5">
                <span className="text-gray-500 w-24 flex-shrink-0">{new Date(log.created_at).toLocaleTimeString('ko-KR')}</span>
                <span className="w-16 flex-shrink-0">{log.agent_name}</span>
                <span className="w-24 flex-shrink-0 text-gray-400">{PHASE_LABELS[log.phase] || log.phase}</span>
                <span className="flex-1 truncate text-gray-500">{log.task_description || (log.media_type ? `${log.media_type} ${log.media_count}개` : '')}</span>
                <span className="font-mono text-emerald-400 flex-shrink-0">${Number(log.cost_usd).toFixed(5)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
