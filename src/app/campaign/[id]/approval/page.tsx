'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle, XCircle, Pencil, Loader2, Shield,
  Crown, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, RefreshCw,
} from 'lucide-react';

interface Review {
  id: string;
  creative_id: string;
  status: string;
  score: number;
  brand_consistency: number;
  target_fit: number;
  cost_efficiency: number;
  comment: string;
  revision_note: string;
  ceo_status: string;
  ceo_comment: string;
  angle: string;
  hooking_text: string;
  copy_text: string;
  platform: string;
  image_prompt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
  approved: { label: '승인', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30', icon: CheckCircle },
  revision_requested: { label: '수정 요청', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', icon: Pencil },
  rejected: { label: '반려', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', icon: XCircle },
  pending_review: { label: '검토 대기', color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/30', icon: Loader2 },
};

const CEO_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: 'CEO 승인 대기', color: 'text-orange-400' },
  approved: { label: 'CEO 승인 완료', color: 'text-green-400' },
  rejected: { label: 'CEO 반려', color: 'text-red-400' },
};

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-gray-500 w-16 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-white/5 rounded-full">
        <div
          className={`h-full rounded-full ${value >= 7 ? 'bg-green-500' : value >= 4 ? 'bg-yellow-500' : 'bg-red-500'}`}
          style={{ width: `${value * 10}%` }}
        />
      </div>
      <span className="text-[10px] font-mono w-6 text-right">{value}</span>
    </div>
  );
}

export default function ApprovalPage() {
  const params = useParams();
  const campaignId = params.id as string;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [ceoComment, setCeoComment] = useState('');
  const [approving, setApproving] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/review`);
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, [campaignId]);

  const startReview = async () => {
    setReviewing(true);
    try {
      await fetch(`/api/campaigns/${campaignId}/review`, { method: 'POST' });
      await fetchReviews();
    } catch { /* empty */ }
    setReviewing(false);
  };

  const ceoAction = async (reviewId: string, action: 'approve' | 'reject') => {
    setApproving(reviewId);
    try {
      await fetch(`/api/campaigns/${campaignId}/ceo-approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, action, comment: ceoComment }),
      });
      setCeoComment('');
      await fetchReviews();
    } catch { /* empty */ }
    setApproving(null);
  };

  const approveAll = async () => {
    setApproving('all');
    try {
      await fetch(`/api/campaigns/${campaignId}/ceo-approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_all', comment: ceoComment }),
      });
      setCeoComment('');
      await fetchReviews();
    } catch { /* empty */ }
    setApproving(null);
  };

  const approved = reviews.filter((r) => r.status === 'approved');
  const revisionRequested = reviews.filter((r) => r.status === 'revision_requested');
  const rejected = reviews.filter((r) => r.status === 'rejected');
  const pendingCeo = approved.filter((r) => r.ceo_status === 'pending');

  return (
    <div className="max-w-5xl mx-auto py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href={`/campaign/${campaignId}`} className="text-gray-500 hover:text-gray-300">
            <ArrowLeft size={18} />
          </Link>
          <Shield className="w-5 h-5 text-amber-400" />
          <div>
            <h1 className="text-xl font-bold">소재 승인 대시보드</h1>
            <p className="text-xs text-gray-500">{reviews.length}개 소재 검토</p>
          </div>
        </div>
        <button
          onClick={startReview}
          disabled={reviewing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 disabled:opacity-50 transition-colors"
        >
          {reviewing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          {reviewing ? '검토 중...' : reviews.length > 0 ? '재검토' : '본부장 검토 시작'}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-400" /></div>
      ) : reviews.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-400 mb-2">아직 검토된 소재가 없습니다</h2>
          <p className="text-sm text-gray-500 mb-6">"본부장 검토 시작" 버튼을 클릭하면 하나 본부장이 모든 소재를 검토합니다.</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{approved.length}</p>
              <p className="text-xs text-gray-500">승인</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-yellow-400">{revisionRequested.length}</p>
              <p className="text-xs text-gray-500">수정 요청</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-red-400">{rejected.length}</p>
              <p className="text-xs text-gray-500">반려</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-orange-400">{pendingCeo.length}</p>
              <p className="text-xs text-gray-500">CEO 대기</p>
            </div>
          </div>

          {/* CEO Batch Approve */}
          {pendingCeo.length > 0 && (
            <div className="glass-card p-5 mb-6 border border-amber-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="w-5 h-5 text-amber-400" />
                <h2 className="text-sm font-semibold">CEO 최종 승인</h2>
                <span className="text-xs text-gray-500">({pendingCeo.length}개 대기 중)</span>
              </div>
              <div className="flex gap-2">
                <input
                  value={ceoComment}
                  onChange={(e) => setCeoComment(e.target.value)}
                  placeholder="승인 코멘트 (선택)"
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
                />
                <button
                  onClick={approveAll}
                  disabled={approving === 'all'}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-500 disabled:opacity-50"
                >
                  {approving === 'all' ? <Loader2 size={14} className="animate-spin" /> : <ThumbsUp size={14} />}
                  전체 승인
                </button>
              </div>
            </div>
          )}

          {/* Review Cards */}
          <div className="space-y-3">
            {reviews.map((review) => {
              const config = STATUS_CONFIG[review.status] || STATUS_CONFIG.pending_review;
              const ceoConfig = CEO_STATUS[review.ceo_status] || CEO_STATUS.pending;
              const isExpanded = expandedId === review.id;
              const StatusIcon = config.icon;

              return (
                <div key={review.id} className={`glass-card border ${config.bg} overflow-hidden`}>
                  {/* Main Row */}
                  <div
                    className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : review.id)}
                  >
                    <StatusIcon className={`w-5 h-5 shrink-0 ${config.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>{config.label}</span>
                        <span className="text-xs text-gray-500">{review.angle} &middot; {review.platform}</span>
                        {review.status === 'approved' && (
                          <span className={`text-[10px] ${ceoConfig.color}`}>{ceoConfig.label}</span>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate">&ldquo;{review.hooking_text}&rdquo;</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-lg font-bold">{review.score}<span className="text-xs text-gray-500">/10</span></span>
                      {isExpanded ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-white/5 pt-3">
                      {/* Copy */}
                      <p className="text-sm text-gray-300 mb-3">{review.copy_text}</p>

                      {/* Score Bars */}
                      <div className="space-y-1.5 mb-3">
                        <ScoreBar label="브랜드 일관" value={review.brand_consistency} />
                        <ScoreBar label="타겟 적합" value={review.target_fit} />
                        <ScoreBar label="비용 효율" value={review.cost_efficiency} />
                      </div>

                      {/* Comment */}
                      <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 mb-3">
                        <p className="text-xs text-amber-400 font-medium mb-1">👩‍💼 하나 본부장 코멘트</p>
                        <p className="text-sm text-gray-300">{review.comment}</p>
                      </div>

                      {/* Revision Note */}
                      {review.revision_note && (
                        <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20 mb-3">
                          <p className="text-xs text-yellow-400 font-medium mb-1">📝 수정 요청 사항</p>
                          <p className="text-sm text-gray-300">{review.revision_note}</p>
                        </div>
                      )}

                      {/* CEO Comment */}
                      {review.ceo_comment && (
                        <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20 mb-3">
                          <p className="text-xs text-purple-400 font-medium mb-1">👑 CEO 코멘트</p>
                          <p className="text-sm text-gray-300">{review.ceo_comment}</p>
                        </div>
                      )}

                      {/* CEO Actions */}
                      {review.status === 'approved' && review.ceo_status === 'pending' && (
                        <div className="flex gap-2 mt-3">
                          <input
                            value={ceoComment}
                            onChange={(e) => setCeoComment(e.target.value)}
                            placeholder="코멘트 (선택)"
                            className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-blue-500/50"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button
                            onClick={(e) => { e.stopPropagation(); ceoAction(review.id, 'approve'); }}
                            disabled={approving === review.id}
                            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-500 disabled:opacity-50"
                          >
                            <ThumbsUp size={12} /> 승인
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); ceoAction(review.id, 'reject'); }}
                            disabled={approving === review.id}
                            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-500 disabled:opacity-50"
                          >
                            <ThumbsDown size={12} /> 반려
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
