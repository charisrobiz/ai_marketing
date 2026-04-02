'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { CATEGORY_LABELS, type ProductCategory, type ProductInfo } from '@/types';

interface ImpactResult {
  impact: 'none' | 'minor' | 'partial' | 'major';
  reason: string;
  affected_areas: string[];
  recommendation: string;
  changes: string[];
}

const IMPACT_CONFIG = {
  none: { label: '변경 없음', color: 'text-gray-400', bg: 'bg-gray-500/10', icon: '➖' },
  minor: { label: '단순 변경 - 기존 전략 유지', color: 'text-green-400', bg: 'bg-green-500/10', icon: '✅' },
  partial: { label: '일부 조정 필요 - 내부 회의 후 부분 수정', color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: '📝' },
  major: { label: '전면 재수립 - 긴급 회의 후 전체 재작업', color: 'text-red-400', bg: 'bg-red-500/10', icon: '🚨' },
};

export default function EditCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState<ProductInfo | null>(null);
  const [impactResult, setImpactResult] = useState<ImpactResult | null>(null);

  useEffect(() => {
    fetch(`/api/campaigns/${campaignId}`)
      .then((r) => r.json())
      .then((data) => { setInfo(data.productInfo); setLoading(false); })
      .catch(() => setLoading(false));
  }, [campaignId]);

  const handleSave = async () => {
    if (!info) return;
    setSaving(true);
    setImpactResult(null);

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/update-info`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productInfo: info }),
      });
      const result = await res.json();
      setImpactResult(result);
    } catch { /* empty */ }

    setSaving(false);
  };

  if (loading || !info) {
    return <div className="text-center py-20"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-400" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/campaign/${campaignId}`} className="text-gray-500 hover:text-gray-300">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold">캠페인 정보 수정</h1>
          <p className="text-xs text-gray-500">수정 시 본부장이 자동으로 마케팅 영향도를 분석합니다</p>
        </div>
      </div>

      <div className="glass-card p-6 space-y-4">
        {/* Category */}
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">카테고리</label>
          <div className="grid grid-cols-4 gap-2">
            {(Object.entries(CATEGORY_LABELS) as [ProductCategory, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setInfo({ ...info, category: key })}
                className={`px-3 py-2 rounded-lg text-xs transition-all ${
                  info.category === key ? 'bg-blue-500/20 border border-blue-500 text-blue-400' : 'bg-white/5 border border-white/10 text-gray-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">제품/서비스 이름</label>
          <input
            value={info.name}
            onChange={(e) => setInfo({ ...info, name: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none text-sm"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">설명</label>
          <textarea
            value={info.description}
            onChange={(e) => setInfo({ ...info, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none text-sm resize-none"
          />
        </div>

        {/* Target */}
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">타겟 고객</label>
          <input
            value={info.targetAudience}
            onChange={(e) => setInfo({ ...info, targetAudience: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none text-sm"
          />
        </div>

        {/* Unique Value */}
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">핵심 차별점</label>
          <input
            value={info.uniqueValue}
            onChange={(e) => setInfo({ ...info, uniqueValue: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none text-sm"
          />
        </div>
      </div>

      {/* Warning */}
      <div className="glass-card p-4 mt-4 border border-amber-500/20">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-gray-400">
            <p className="font-medium text-amber-400 mb-1">수정 시 자동 분석</p>
            <p>저장하면 본부장(하나)이 변경 사항을 분석하여 마케팅 영향도를 판단합니다.</p>
            <p className="mt-1">핵심 정보(타겟, 차별점 등)가 변경되면 내부 회의를 거쳐 전략을 조정합니다.</p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-500 disabled:opacity-50 transition-colors"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {saving ? '분석 중...' : '저장 & 영향도 분석'}
      </button>

      {/* Impact Result */}
      {impactResult && (
        <div className={`mt-6 glass-card p-5 border ${IMPACT_CONFIG[impactResult.impact]?.bg || ''}`}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">{IMPACT_CONFIG[impactResult.impact]?.icon}</span>
            <h3 className={`font-semibold ${IMPACT_CONFIG[impactResult.impact]?.color}`}>
              {IMPACT_CONFIG[impactResult.impact]?.label}
            </h3>
          </div>

          {impactResult.changes.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">변경 사항:</p>
              {impactResult.changes.map((c, i) => (
                <p key={i} className="text-sm text-gray-300">- {c}</p>
              ))}
            </div>
          )}

          <p className="text-sm text-gray-300 mb-2">{impactResult.reason}</p>

          {impactResult.affected_areas.length > 0 && (
            <div className="mb-2">
              <p className="text-xs text-gray-500 mb-1">영향 범위:</p>
              <div className="flex flex-wrap gap-1">
                {impactResult.affected_areas.map((area) => (
                  <span key={area} className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-gray-300">{area}</span>
                ))}
              </div>
            </div>
          )}

          <p className="text-sm text-gray-400 mt-2">💡 {impactResult.recommendation}</p>

          {/* Action buttons */}
          <div className="flex gap-2 mt-4">
            <Link href={`/campaign/${campaignId}/meeting`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-500">
              내부 회의 확인
            </Link>
            {impactResult.impact === 'major' && (
              <Link href={`/campaign/${campaignId}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-500">
                <RefreshCw size={14} /> 엔진 재실행
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
