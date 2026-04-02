'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, TrendingUp, DollarSign, Users, Target,
  CheckCircle, AlertTriangle, ArrowRight, Lock, BarChart3,
  Percent, MousePointer, Clock,
} from 'lucide-react';

interface WeekMetrics {
  newInstalls: number;
  totalInstalls: number;
  cac: number;
  totalSpend: number;
  organicRatio: number;
  paidRatio: number;
  topChannel: string;
  ctr: number;
  cvr: number;
  retention_d1: number;
  retention_d7: number;
  retention_d30?: number;
}

interface WeekData {
  week: number;
  title: string;
  status: string;
  visible: boolean;
  metrics: WeekMetrics;
  highlights: string[];
  issues: string[];
  nextActions: string[];
}

interface ReportData {
  campaignId: string;
  productName: string;
  weeks: WeekData[];
  summary: {
    totalInstalls: number;
    totalSpend: number;
    avgCac: number;
    completedWeeks: number;
  };
}

function MetricCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: typeof TrendingUp; color: string; sub?: string;
}) {
  return (
    <div className="p-3 rounded-lg bg-white/5">
      <div className="flex items-center justify-between mb-1">
        <Icon className={`w-4 h-4 ${color}`} />
        {sub && <span className="text-[10px] text-gray-500">{sub}</span>}
      </div>
      <p className="text-xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-[10px] text-gray-500">{label}</p>
    </div>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full h-2 bg-white/5 rounded-full">
      <div className={`h-full rounded-full vote-bar ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function WeeklyReportPage() {
  const params = useParams();
  const campaignId = params.id as string;
  const [data, setData] = useState<ReportData | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/campaigns/${campaignId}/weekly-report`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        // Auto-select latest visible week
        const visible = d.weeks.filter((w: WeekData) => w.visible);
        if (visible.length > 0) setSelectedWeek(visible[visible.length - 1].week);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [campaignId]);

  if (loading) return <div className="text-center py-20 text-gray-500 text-sm">로딩 중...</div>;
  if (!data) return <div className="text-center py-20 text-gray-500">데이터를 불러올 수 없습니다.</div>;

  const week = data.weeks.find((w) => w.week === selectedWeek);

  return (
    <div className="max-w-5xl mx-auto py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/campaign/${campaignId}`} className="text-gray-500 hover:text-gray-300">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold">{data.productName} - 주간 리포트</h1>
          <p className="text-xs text-gray-500">{data.summary.completedWeeks}주차 완료 / 4주</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MetricCard label="누적 설치" value={data.summary.totalInstalls} icon={Users} color="text-blue-400" sub="명" />
        <MetricCard label="총 마케팅 비용" value={`${Math.round(data.summary.totalSpend / 10000)}만원`} icon={DollarSign} color="text-green-400" />
        <MetricCard label="평균 CAC" value={`${Math.round(data.summary.avgCac)}원`} icon={Target} color="text-purple-400" />
        <MetricCard label="진행률" value={`${data.summary.completedWeeks}/4주`} icon={TrendingUp} color="text-orange-400" sub={`${Math.round(data.summary.completedWeeks / 4 * 100)}%`} />
      </div>

      {/* Goal Progress */}
      <div className="glass-card p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">목표 달성률 (10,000명)</span>
          <span className="text-sm font-bold text-blue-400">{Math.round(data.summary.totalInstalls / 10000 * 100)}%</span>
        </div>
        <ProgressBar value={data.summary.totalInstalls} max={10000} color="bg-gradient-to-r from-blue-500 to-purple-500" />
        <p className="text-[10px] text-gray-500 mt-1">{data.summary.totalInstalls.toLocaleString()} / 10,000명</p>
      </div>

      {/* Week Tabs */}
      <div className="flex gap-2 mb-6">
        {data.weeks.map((w) => (
          <button
            key={w.week}
            onClick={() => w.visible && setSelectedWeek(w.week)}
            disabled={!w.visible}
            className={`flex-1 p-3 rounded-lg text-center transition-all ${
              selectedWeek === w.week
                ? 'bg-blue-500/20 border border-blue-500/50 text-blue-400'
                : w.visible
                ? 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 cursor-pointer'
                : 'bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              {w.status === 'completed' && <CheckCircle size={12} className="text-green-400" />}
              {!w.visible && <Lock size={12} />}
              <span className="text-xs font-semibold">Week {w.week}</span>
            </div>
            <p className="text-[10px]">{w.visible ? w.title : '미진행'}</p>
          </button>
        ))}
      </div>

      {/* Week Detail */}
      {week && week.visible && (
        <div className="space-y-4">
          {/* Metrics Grid */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-4">Week {week.week} 핵심 지표</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard label="신규 설치" value={week.metrics.newInstalls} icon={Users} color="text-blue-400" />
              <MetricCard label="CAC" value={week.metrics.cac === 0 ? '0원 (무료)' : `${week.metrics.cac}원`} icon={DollarSign} color="text-green-400" />
              <MetricCard label="CTR" value={`${week.metrics.ctr}%`} icon={MousePointer} color="text-purple-400" />
              <MetricCard label="전환율" value={`${week.metrics.cvr}%`} icon={Percent} color="text-orange-400" />
            </div>

            {/* Organic vs Paid */}
            <div className="mt-4 p-3 rounded-lg bg-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">오가닉 vs 페이드 비율</span>
                <span className="text-xs text-gray-500">Top 채널: {week.metrics.topChannel}</span>
              </div>
              <div className="flex h-3 rounded-full overflow-hidden">
                <div className="bg-green-500" style={{ width: `${week.metrics.organicRatio}%` }} />
                <div className="bg-blue-500" style={{ width: `${week.metrics.paidRatio}%` }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-green-400">오가닉 {week.metrics.organicRatio}%</span>
                <span className="text-[10px] text-blue-400">페이드 {week.metrics.paidRatio}%</span>
              </div>
            </div>

            {/* Retention */}
            <div className="mt-4 p-3 rounded-lg bg-white/5">
              <span className="text-xs text-gray-400">리텐션</span>
              <div className="flex gap-4 mt-2">
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-400">{week.metrics.retention_d1}%</p>
                  <p className="text-[10px] text-gray-500">D1</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-purple-400">{week.metrics.retention_d7}%</p>
                  <p className="text-[10px] text-gray-500">D7</p>
                </div>
                {week.metrics.retention_d30 !== undefined && (
                  <div className="text-center">
                    <p className="text-lg font-bold text-orange-400">{week.metrics.retention_d30}%</p>
                    <p className="text-[10px] text-gray-500">D30</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Highlights */}
          {week.highlights.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <CheckCircle size={14} className="text-green-400" /> 주요 성과
              </h3>
              <ul className="space-y-2">
                {week.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-green-400 mt-0.5">+</span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Issues */}
          {week.issues.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle size={14} className="text-yellow-400" /> 이슈 & 개선점
              </h3>
              <ul className="space-y-2">
                {week.issues.map((issue, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-yellow-300/80">
                    <span className="text-yellow-400 mt-0.5">!</span>
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next Actions */}
          {week.nextActions.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <ArrowRight size={14} className="text-blue-400" /> 다음 주 액션 플랜
              </h3>
              <ul className="space-y-2">
                {week.nextActions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-blue-400 mt-0.5">{i + 1}.</span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {week && !week.visible && (
        <div className="glass-card p-12 text-center">
          <Lock className="w-8 h-8 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">이 주차는 아직 진행되지 않았습니다.</p>
          <p className="text-gray-600 text-xs mt-1">이전 주차 리뷰 미팅을 완료하면 열립니다.</p>
        </div>
      )}
    </div>
  );
}
