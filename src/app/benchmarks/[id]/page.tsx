'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Sparkles, Loader2, Trash2, RefreshCw, Edit2, Save } from 'lucide-react';
import { BENCHMARK_PLATFORM_CONFIG, type BenchmarkItem, type BenchmarkPlatform } from '@/types';

export default function BenchmarkDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [item, setItem] = useState<BenchmarkItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editNotes, setEditNotes] = useState('');

  const fetchItem = async () => {
    const res = await fetch(`/api/benchmarks/${id}`);
    if (res.ok) {
      const data = await res.json();
      setItem(data);
      setEditNotes(data.ceo_notes || '');
    }
    setLoading(false);
  };

  useEffect(() => { fetchItem(); }, [id]);

  const handleReanalyze = async () => {
    setReanalyzing(true);
    await fetch(`/api/benchmarks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reanalyze: true }),
    });
    await fetchItem();
    setReanalyzing(false);
  };

  const handleSaveNotes = async () => {
    await fetch(`/api/benchmarks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ceo_notes: editNotes }),
    });
    if (item) setItem({ ...item, ceo_notes: editNotes });
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm('정말 삭제할까요?')) return;
    await fetch(`/api/benchmarks/${id}`, { method: 'DELETE' });
    router.push('/benchmarks');
  };

  if (loading) return <div className="text-center py-20"><Loader2 className="w-6 h-6 animate-spin text-blue-400 mx-auto" /></div>;
  if (!item) return <div className="text-center py-20 text-gray-500">찾을 수 없습니다</div>;

  const platformConfig = BENCHMARK_PLATFORM_CONFIG[item.platform || 'other'];

  return (
    <div className="max-w-4xl mx-auto py-8">
      <Link href="/benchmarks" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-300 mb-4">
        <ArrowLeft size={14} /> 라이브러리로
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs px-2 py-1 rounded-full ${platformConfig.color} bg-white/5`}>
              {platformConfig.emoji} {platformConfig.label}
            </span>
            {item.ai_analysis && (
              <span className="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 flex items-center gap-1">
                <Sparkles size={10} /> AI 분석 완료
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold">{item.title}</h1>
          {item.meta_author && <p className="text-sm text-gray-500 mt-1">by {item.meta_author}</p>}
        </div>
        <div className="flex items-center gap-2">
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-white/5 hover:bg-white/10"
            >
              <ExternalLink size={12} /> 원본
            </a>
          )}
          <button
            onClick={handleReanalyze}
            disabled={reanalyzing}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-purple-600/20 text-purple-400 hover:bg-purple-600/30"
          >
            {reanalyzing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            재분석
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Thumbnail / Images */}
      {(item.thumbnail_url || (item.captured_images && item.captured_images.length > 0)) && (
        <div className="glass-card p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {item.thumbnail_url && (
              <div className="rounded-lg overflow-hidden bg-white/5">
                <img src={item.thumbnail_url} alt="썸네일" className="w-full h-auto" />
                <p className="text-[10px] text-gray-500 px-3 py-2">썸네일 (자동)</p>
              </div>
            )}
            {item.captured_images?.map((url, i) => (
              <div key={i} className="rounded-lg overflow-hidden bg-white/5">
                <img src={url} alt={`캡처 ${i + 1}`} className="w-full h-auto" />
                <p className="text-[10px] text-gray-500 px-3 py-2">CEO 캡처 {i + 1}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meta Stats */}
      {item.meta_stats && (item.meta_stats.views || item.meta_stats.likes) && (
        <div className="glass-card p-4 mb-6">
          <h3 className="text-xs text-gray-500 uppercase mb-2">통계</h3>
          <div className="flex gap-6">
            {item.meta_stats.views !== undefined && (
              <div>
                <p className="text-[10px] text-gray-500">조회수</p>
                <p className="text-lg font-bold">{item.meta_stats.views.toLocaleString()}</p>
              </div>
            )}
            {item.meta_stats.likes !== undefined && (
              <div>
                <p className="text-[10px] text-gray-500">좋아요</p>
                <p className="text-lg font-bold">{item.meta_stats.likes.toLocaleString()}</p>
              </div>
            )}
            {item.meta_stats.comments !== undefined && (
              <div>
                <p className="text-[10px] text-gray-500">댓글</p>
                <p className="text-lg font-bold">{item.meta_stats.comments.toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Analysis */}
      {item.ai_analysis && (
        <div className="glass-card p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h3 className="text-base font-bold">AI 분석 결과</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {item.ai_analysis.tone && (
              <div>
                <p className="text-[10px] text-gray-500 uppercase mb-1">전체 톤</p>
                <p className="text-sm">{item.ai_analysis.tone}</p>
              </div>
            )}
            {item.ai_analysis.designStyle && (
              <div>
                <p className="text-[10px] text-gray-500 uppercase mb-1">디자인 스타일</p>
                <p className="text-sm">{item.ai_analysis.designStyle}</p>
              </div>
            )}
            {item.ai_analysis.layout && (
              <div>
                <p className="text-[10px] text-gray-500 uppercase mb-1">레이아웃</p>
                <p className="text-sm">{item.ai_analysis.layout}</p>
              </div>
            )}
            {item.ai_analysis.targetAudience && (
              <div>
                <p className="text-[10px] text-gray-500 uppercase mb-1">추정 타겟</p>
                <p className="text-sm">{item.ai_analysis.targetAudience}</p>
              </div>
            )}
            {item.ai_analysis.emotionalAppeal && (
              <div>
                <p className="text-[10px] text-gray-500 uppercase mb-1">감정 호소</p>
                <p className="text-sm">{item.ai_analysis.emotionalAppeal}</p>
              </div>
            )}
          </div>

          {item.ai_analysis.dominantColors && item.ai_analysis.dominantColors.length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] text-gray-500 uppercase mb-2">주요 색상</p>
              <div className="flex gap-2">
                {item.ai_analysis.dominantColors.map((color, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div
                      className="w-12 h-12 rounded-lg border border-white/10"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[9px] text-gray-500 mt-1 font-mono">{color}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {item.ai_analysis.strengths && item.ai_analysis.strengths.length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] text-gray-500 uppercase mb-2">✅ 강점</p>
              <ul className="space-y-1">
                {item.ai_analysis.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-gray-300 pl-3">• {s}</li>
                ))}
              </ul>
            </div>
          )}

          {item.ai_analysis.weaknesses && item.ai_analysis.weaknesses.length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] text-gray-500 uppercase mb-2">⚠️ 약점</p>
              <ul className="space-y-1">
                {item.ai_analysis.weaknesses.map((s, i) => (
                  <li key={i} className="text-xs text-gray-300 pl-3">• {s}</li>
                ))}
              </ul>
            </div>
          )}

          {item.ai_analysis.ocrText && (
            <div className="mt-4">
              <p className="text-[10px] text-gray-500 uppercase mb-2">텍스트 추출 (OCR)</p>
              <p className="text-xs text-gray-400 bg-white/5 p-2 rounded font-mono whitespace-pre-wrap">
                {item.ai_analysis.ocrText}
              </p>
            </div>
          )}

          {item.ai_insights && (
            <div className="mt-4 p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
              <p className="text-[10px] text-purple-400 uppercase mb-1">💡 AI 인사이트</p>
              <p className="text-xs text-gray-300 leading-relaxed">{item.ai_insights}</p>
            </div>
          )}
        </div>
      )}

      {/* CEO Notes */}
      <div className="glass-card p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold">CEO 메모</h3>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="text-xs text-blue-400 flex items-center gap-1">
              <Edit2 size={11} /> 편집
            </button>
          ) : (
            <button onClick={handleSaveNotes} className="text-xs text-green-400 flex items-center gap-1">
              <Save size={11} /> 저장
            </button>
          )}
        </div>
        {editing ? (
          <textarea
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            rows={4}
            placeholder="이 벤치마크에 대한 메모를 입력하세요"
            className="w-full px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none resize-none"
          />
        ) : (
          <p className="text-sm text-gray-400 whitespace-pre-wrap">
            {item.ceo_notes || <span className="text-gray-600">메모 없음</span>}
          </p>
        )}
      </div>

      {/* Tags */}
      {item.category_tags && item.category_tags.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-base font-bold mb-3">태그</h3>
          <div className="flex flex-wrap gap-2">
            {item.category_tags.map((tag) => (
              <span key={tag} className="text-xs px-3 py-1 rounded-full bg-blue-500/10 text-blue-400">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
