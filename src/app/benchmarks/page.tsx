'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Library, Plus, Search, ExternalLink, Sparkles, Trash2 } from 'lucide-react';
import { BENCHMARK_PLATFORM_CONFIG, type BenchmarkItem, type BenchmarkPlatform } from '@/types';

export default function BenchmarksPage() {
  const [items, setItems] = useState<BenchmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPlatform, setFilterPlatform] = useState<BenchmarkPlatform | 'all'>('all');
  const [search, setSearch] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    const res = await fetch('/api/benchmarks');
    setItems(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제할까요?')) return;
    await fetch(`/api/benchmarks/${id}`, { method: 'DELETE' });
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const filtered = items.filter((item) => {
    if (filterPlatform !== 'all' && item.platform !== filterPlatform) return false;
    if (search && !item.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const platformCounts = items.reduce((acc, item) => {
    const p = item.platform || 'other';
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="max-w-6xl mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Library className="w-6 h-6 text-cyan-400" />
          <div>
            <h1 className="text-2xl font-bold">벤치마크 라이브러리</h1>
            <p className="text-gray-500 text-sm mt-0.5">참고하고 싶은 광고/콘텐츠를 등록하고 AI가 분석합니다</p>
          </div>
        </div>
        <Link
          href="/benchmarks/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors"
        >
          <Plus size={16} /> 새 벤치마크
        </Link>
      </div>

      {/* Filter & Search */}
      <div className="glass-card p-4 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="제목으로 검색..."
              className="w-full pl-10 pr-4 py-2 rounded-lg text-sm bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none"
            />
          </div>
          <span className="text-xs text-gray-500">총 {items.length}개</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterPlatform('all')}
            className={`text-xs px-3 py-1.5 rounded-full ${
              filterPlatform === 'all' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-400'
            }`}
          >
            전체 ({items.length})
          </button>
          {(Object.entries(BENCHMARK_PLATFORM_CONFIG) as [BenchmarkPlatform, typeof BENCHMARK_PLATFORM_CONFIG[BenchmarkPlatform]][]).map(([key, config]) => {
            const count = platformCounts[key] || 0;
            if (count === 0) return null;
            return (
              <button
                key={key}
                onClick={() => setFilterPlatform(key)}
                className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1 ${
                  filterPlatform === key ? `bg-white/10 ${config.color}` : 'bg-white/5 text-gray-400'
                }`}
              >
                {config.emoji} {config.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">로딩 중...</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Library className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-400 mb-2">
            {items.length === 0 ? '아직 벤치마크가 없습니다' : '검색 결과가 없습니다'}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            인스타, 틱톡, 유튜브 등에서 벤치마킹하고 싶은 콘텐츠를 등록해보세요.
          </p>
          {items.length === 0 && (
            <Link href="/benchmarks/new" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:opacity-90">
              <Plus size={16} /> 첫 벤치마크 등록
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const platformConfig = BENCHMARK_PLATFORM_CONFIG[item.platform || 'other'];
            return (
              <div key={item.id} className="glass-card overflow-hidden hover:border-blue-500/30 transition-all group">
                {/* Thumbnail */}
                <Link href={`/benchmarks/${item.id}`} className="block">
                  <div className="aspect-video bg-white/5 relative overflow-hidden">
                    {item.thumbnail_url ? (
                      <img
                        src={item.thumbnail_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        {platformConfig.emoji}
                      </div>
                    )}
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm">
                      <span className="text-xs">{platformConfig.emoji}</span>
                      <span className={`text-[10px] font-medium ${platformConfig.color}`}>
                        {platformConfig.label}
                      </span>
                    </div>
                    {item.ai_analysis && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/30 backdrop-blur-sm">
                        <Sparkles size={10} className="text-purple-300" />
                        <span className="text-[10px] font-medium text-purple-300">AI 분석됨</span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="p-4">
                  <Link href={`/benchmarks/${item.id}`}>
                    <h3 className="text-sm font-medium line-clamp-2 mb-2 hover:text-blue-400 transition-colors">
                      {item.title}
                    </h3>
                  </Link>

                  {item.ai_analysis?.tone && (
                    <p className="text-[10px] text-gray-500 mb-2 line-clamp-1">
                      🎨 {item.ai_analysis.tone}
                    </p>
                  )}

                  {item.category_tags && item.category_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {item.category_tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-gray-500">
                    <span>{item.created_at && new Date(item.created_at).toLocaleDateString('ko-KR')}</span>
                    <div className="flex items-center gap-1">
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 hover:bg-white/10 rounded"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={11} />
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 hover:bg-red-500/10 hover:text-red-400 rounded"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
