'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Link as LinkIcon, Upload, X, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { BENCHMARK_PLATFORM_CONFIG, type BenchmarkPlatform } from '@/types';

export default function NewBenchmarkPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState<BenchmarkPlatform>('other');
  const [ceoNotes, setCeoNotes] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList) => {
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch('/api/benchmarks/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.url) urls.push(data.url);
      } catch { /* ignore */ }
    }
    setUploadedImages((prev) => [...prev, ...urls]);
    setUploading(false);
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput('');
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (!title.trim() && !url.trim() && uploadedImages.length === 0) {
      setError('제목, URL, 이미지 중 하나는 입력해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/benchmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || undefined,
          url: url.trim() || undefined,
          platform: url ? undefined : platform,
          captured_images: uploadedImages.length > 0 ? uploadedImages : undefined,
          ceo_notes: ceoNotes.trim() || undefined,
          category_tags: tags,
        }),
      });
      const data = await res.json();
      if (data.id) {
        router.push(`/benchmarks/${data.id}`);
      } else {
        setError(data.error || '저장 실패');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 실패');
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Link href="/benchmarks" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-300 mb-4">
        <ArrowLeft size={14} /> 라이브러리로
      </Link>

      <h1 className="text-2xl font-bold mb-1">새 벤치마크 등록</h1>
      <p className="text-gray-500 text-sm mb-6">URL이나 캡처 이미지를 등록하면 AI가 자동 분석합니다.</p>

      <div className="glass-card p-6 space-y-5">
        {/* URL */}
        <div>
          <label className="block text-sm font-medium mb-1.5 flex items-center gap-2">
            <LinkIcon size={14} /> URL (인스타, 틱톡, 유튜브 등)
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=... 또는 https://instagram.com/p/..."
            className="w-full px-4 py-2.5 rounded-lg text-sm bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none"
          />
          <p className="text-[10px] text-gray-500 mt-1">
            💡 YouTube는 메타데이터 + 썸네일 자동 추출. Instagram/TikTok은 oEmbed 기반 (제한적).
          </p>
        </div>

        {/* Platform (URL 없을 때만) */}
        {!url && (
          <div>
            <label className="block text-sm font-medium mb-1.5">플랫폼 (URL 없을 때 수동 선택)</label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.entries(BENCHMARK_PLATFORM_CONFIG) as [BenchmarkPlatform, typeof BENCHMARK_PLATFORM_CONFIG[BenchmarkPlatform]][]).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPlatform(key)}
                  className={`p-2 rounded-lg border text-xs flex items-center gap-1 justify-center ${
                    platform === key ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 bg-white/5'
                  }`}
                >
                  <span>{config.emoji}</span>
                  <span>{config.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1.5">제목 (선택)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="비워두면 URL에서 자동 추출"
            className="w-full px-4 py-2.5 rounded-lg text-sm bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none"
          />
        </div>

        {/* Captured Images */}
        <div>
          <label className="block text-sm font-medium mb-1.5 flex items-center gap-2">
            <Upload size={14} /> 캡처 이미지 (선택, 여러 장 가능)
          </label>
          <p className="text-[10px] text-gray-500 mb-2">
            💡 이미지를 첨부하면 AI Vision이 색상, 레이아웃, 톤, 텍스트를 자동 분석합니다 (가장 정확함).
          </p>

          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center cursor-pointer hover:border-white/30 transition-colors"
          >
            {uploading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <span className="text-sm text-gray-400">업로드 중...</span>
              </div>
            ) : (
              <>
                <Upload className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                <p className="text-sm text-gray-400">클릭하여 이미지 업로드</p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              className="hidden"
            />
          </div>

          {uploadedImages.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {uploadedImages.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-white/5">
                  <img src={url} alt={`업로드 ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => setUploadedImages((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 hover:bg-red-500/80"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CEO Notes */}
        <div>
          <label className="block text-sm font-medium mb-1.5">CEO 메모 (선택)</label>
          <textarea
            value={ceoNotes}
            onChange={(e) => setCeoNotes(e.target.value)}
            placeholder="이 벤치마크에서 무엇이 좋은지, 어떻게 활용하고 싶은지 메모하세요."
            rows={3}
            className="w-full px-4 py-2.5 rounded-lg text-sm bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none resize-none"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium mb-1.5">태그 (선택)</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="예: 카드뉴스, 감성, 푸드, 패션"
              className="flex-1 px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none"
            />
            <button
              onClick={addTag}
              className="px-4 rounded-lg bg-white/5 text-sm hover:bg-white/10"
            >
              추가
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span key={tag} className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 flex items-center gap-1">
                  #{tag}
                  <button onClick={() => setTags(tags.filter((t) => t !== tag))}>
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 px-3 py-2 rounded-lg">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting || uploading}
          className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <><Loader2 size={16} className="animate-spin" /> AI 분석 중...</>
          ) : (
            <><Sparkles size={16} /> 등록 + AI 분석</>
          )}
        </button>
      </div>
    </div>
  );
}
