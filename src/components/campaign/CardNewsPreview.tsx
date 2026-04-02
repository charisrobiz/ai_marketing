'use client';

import type { Creative } from '@/types';
import { Camera, Video, FileText, Smartphone, Download } from 'lucide-react';
import { useRef } from 'react';

const ANGLE_STYLES: Record<string, { bg: string; accent: string; emoji: string }> = {
  '공감형': { bg: 'from-purple-900 to-pink-800', accent: '#C084FC', emoji: '💜' },
  '바이럴형': { bg: 'from-yellow-900 to-amber-800', accent: '#FBBF24', emoji: '😂' },
  '권위형': { bg: 'from-slate-900 to-zinc-800', accent: '#F59E0B', emoji: '👑' },
  'UGC유도형': { bg: 'from-pink-900 to-rose-800', accent: '#FB7185', emoji: '📱' },
  '긴급형': { bg: 'from-red-900 to-orange-800', accent: '#F97316', emoji: '🔥' },
  // Legacy
  '감성형': { bg: 'from-purple-900 to-pink-800', accent: '#C084FC', emoji: '💜' },
  '유머형': { bg: 'from-yellow-900 to-amber-800', accent: '#FBBF24', emoji: '😂' },
  '기능형': { bg: 'from-blue-900 to-cyan-800', accent: '#38BDF8', emoji: '⚡' },
  '스토리형': { bg: 'from-emerald-900 to-green-800', accent: '#34D399', emoji: '📖' },
  '커뮤니티형': { bg: 'from-indigo-900 to-purple-900', accent: '#818CF8', emoji: '🤝' },
  '마이크로인플루언서형': { bg: 'from-teal-900 to-cyan-800', accent: '#2DD4BF', emoji: '⭐' },
  'FOMO형': { bg: 'from-red-900 to-orange-800', accent: '#F97316', emoji: '🔥' },
};

const DEFAULT_STYLE = { bg: 'from-gray-900 to-gray-800', accent: '#9CA3AF', emoji: '📢' };

const PLATFORM_ICONS: Record<string, typeof Camera> = {
  instagram: Camera,
  youtube: Video,
  blog: FileText,
  tiktok: Smartphone,
};

function InstagramCard({ creative, productName }: { creative: Creative; productName: string }) {
  const style = ANGLE_STYLES[creative.angle] || DEFAULT_STYLE;
  return (
    <div className="w-[340px] shrink-0 rounded-xl overflow-hidden border border-white/10 bg-black">
      {/* Instagram header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold">
          {productName[0]}
        </div>
        <div>
          <p className="text-xs font-semibold">{productName.toLowerCase().replace(/\s/g, '_')}</p>
          <p className="text-[10px] text-gray-500">Sponsored</p>
        </div>
      </div>
      {/* Image area */}
      <div className={`aspect-square bg-gradient-to-br ${style.bg} flex flex-col items-center justify-center p-8 relative`}>
        <span className="text-6xl mb-4">{style.emoji}</span>
        <p className="text-xl font-bold text-center leading-tight mb-3" style={{ color: style.accent }}>
          {creative.hookingText}
        </p>
        <p className="text-sm text-gray-300 text-center leading-relaxed max-w-[280px]">
          {creative.copyText}
        </p>
        <div className="absolute bottom-3 right-3 px-2 py-1 rounded bg-black/50 text-[10px] text-gray-400">
          {creative.angle}
        </div>
      </div>
      {/* Instagram footer */}
      <div className="px-3 py-2">
        <div className="flex gap-3 mb-2">
          <span className="text-lg">♡</span>
          <span className="text-lg">💬</span>
          <span className="text-lg">📤</span>
        </div>
        <p className="text-xs">
          <span className="font-semibold">{productName.toLowerCase().replace(/\s/g, '_')}</span>{' '}
          <span className="text-gray-400">{creative.copyText.slice(0, 60)}...</span>
        </p>
      </div>
    </div>
  );
}

function YoutubeThumbnail({ creative, productName }: { creative: Creative; productName: string }) {
  const style = ANGLE_STYLES[creative.angle] || DEFAULT_STYLE;
  return (
    <div className="w-[340px] shrink-0 rounded-xl overflow-hidden border border-white/10">
      {/* Thumbnail */}
      <div className={`aspect-video bg-gradient-to-br ${style.bg} flex flex-col items-center justify-center p-6 relative`}>
        <span className="text-5xl mb-3">{style.emoji}</span>
        <p className="text-lg font-black text-center leading-tight" style={{ color: style.accent }}>
          {creative.hookingText}
        </p>
        <p className="text-xs text-gray-400 text-center mt-2 max-w-[280px]">{creative.copyText.slice(0, 50)}...</p>
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-50 hover:opacity-80 transition-opacity">
          <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center">
            <div className="w-0 h-0 border-l-[16px] border-l-white border-y-[10px] border-y-transparent ml-1" />
          </div>
        </div>
        <div className="absolute bottom-2 right-2 bg-black/80 text-[10px] text-white px-1.5 py-0.5 rounded">0:30</div>
      </div>
      {/* Info */}
      <div className="bg-[#0f0f0f] p-3 flex gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-xs font-bold shrink-0">
          {productName[0]}
        </div>
        <div>
          <p className="text-sm font-medium leading-tight">{creative.hookingText} | {productName}</p>
          <p className="text-[10px] text-gray-500 mt-1">{productName} · 조회수 0회 · 방금 전</p>
        </div>
      </div>
    </div>
  );
}

function TiktokCard({ creative, productName }: { creative: Creative; productName: string }) {
  const style = ANGLE_STYLES[creative.angle] || DEFAULT_STYLE;
  return (
    <div className="w-[220px] shrink-0 rounded-xl overflow-hidden border border-white/10">
      <div className={`aspect-[9/16] bg-gradient-to-b ${style.bg} flex flex-col justify-end p-4 relative`}>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
          <span className="text-5xl mb-3">{style.emoji}</span>
          <p className="text-lg font-black text-center leading-tight" style={{ color: style.accent }}>
            {creative.hookingText}
          </p>
        </div>
        {/* Side actions */}
        <div className="absolute right-2 bottom-20 flex flex-col items-center gap-4">
          <div className="text-center"><span className="text-lg">♡</span><p className="text-[9px]">12.3K</p></div>
          <div className="text-center"><span className="text-lg">💬</span><p className="text-[9px]">842</p></div>
          <div className="text-center"><span className="text-lg">📤</span><p className="text-[9px]">1.2K</p></div>
        </div>
        {/* Bottom info */}
        <div>
          <p className="text-xs font-semibold">@{productName.toLowerCase().replace(/\s/g, '')}</p>
          <p className="text-[10px] text-gray-300 mt-1 line-clamp-2">{creative.copyText}</p>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-[10px]">🎵</span>
            <p className="text-[10px] text-gray-400">오리지널 사운드 - {productName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BlogCard({ creative, productName }: { creative: Creative; productName: string }) {
  const style = ANGLE_STYLES[creative.angle] || DEFAULT_STYLE;
  return (
    <div className="w-[340px] shrink-0 rounded-xl overflow-hidden border border-white/10 bg-white text-black">
      {/* Header image */}
      <div className={`h-40 bg-gradient-to-br ${style.bg} flex items-center justify-center`}>
        <span className="text-5xl">{style.emoji}</span>
      </div>
      {/* Content */}
      <div className="p-5">
        <div className="flex gap-2 mb-3">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">{creative.angle}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">SEO</span>
        </div>
        <h2 className="text-lg font-bold leading-tight mb-2">{creative.hookingText}</h2>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">{creative.copyText}</p>
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
          <div>
            <p className="text-xs font-medium">{productName}</p>
            <p className="text-[10px] text-gray-400">방금 전 · 3분 읽기</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CardNewsPreview({
  creatives,
  productName,
}: {
  creatives: Creative[];
  productName: string;
}) {
  // Group by platform
  const platforms = [
    { key: 'instagram', label: 'Instagram 피드', icon: Camera },
    { key: 'tiktok', label: 'TikTok / 릴스', icon: Smartphone },
    { key: 'youtube', label: 'YouTube 썸네일', icon: Video },
    { key: 'blog', label: '블로그 포스트', icon: FileText },
  ];

  return (
    <div className="space-y-8">
      {platforms.map((platform) => {
        // Show all creatives in this platform's format
        const platformCreatives = creatives.filter((c) => c.platform === platform.key);
        const displayCreatives = platformCreatives.length > 0 ? platformCreatives : creatives.slice(0, 3);

        return (
          <div key={platform.key}>
            <div className="flex items-center gap-2 mb-4">
              <platform.icon className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-300">{platform.label}</h3>
              <span className="text-xs text-gray-600">{displayCreatives.length}개 소재</span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {displayCreatives.map((creative) => {
                switch (platform.key) {
                  case 'instagram':
                    return <InstagramCard key={creative.id} creative={creative} productName={productName} />;
                  case 'youtube':
                    return <YoutubeThumbnail key={creative.id} creative={creative} productName={productName} />;
                  case 'tiktok':
                    return <TiktokCard key={creative.id} creative={creative} productName={productName} />;
                  case 'blog':
                    return <BlogCard key={creative.id} creative={creative} productName={productName} />;
                  default:
                    return null;
                }
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
