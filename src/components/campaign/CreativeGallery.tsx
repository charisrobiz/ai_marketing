'use client';

import type { Creative } from '@/types';
import { Palette, Camera, Video, FileText, Smartphone } from 'lucide-react';

const PLATFORM_ICONS: Record<string, typeof Camera> = {
  instagram: Camera,
  youtube: Video,
  blog: FileText,
  tiktok: Smartphone,
};

const ANGLE_COLORS: Record<string, string> = {
  '감성형': 'border-pink-500/30 bg-pink-500/5',
  '유머형': 'border-yellow-500/30 bg-yellow-500/5',
  '기능형': 'border-blue-500/30 bg-blue-500/5',
  '스토리형': 'border-purple-500/30 bg-purple-500/5',
  'FOMO형': 'border-red-500/30 bg-red-500/5',
};

export default function CreativeGallery({ creatives }: { creatives: Creative[] }) {
  return (
    <div className="glass-card p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Palette className="w-5 h-5 text-purple-400" />
        <h2 className="text-lg font-semibold">크리에이티브 소재</h2>
        <span className="text-xs text-gray-500 ml-auto">{creatives.length}개 생성됨</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {creatives.map((creative) => {
          const PlatformIcon = PLATFORM_ICONS[creative.platform] || FileText;
          const angleColor = ANGLE_COLORS[creative.angle] || 'border-gray-500/30 bg-gray-500/5';
          return (
            <div key={creative.id} className={`rounded-lg border p-4 ${angleColor}`}>
              {/* Image placeholder */}
              {creative.imageUrl ? (
                <div className="w-full h-40 rounded-lg bg-cover bg-center mb-3" style={{ backgroundImage: `url(${creative.imageUrl})` }} />
              ) : (
                <div className="w-full h-40 rounded-lg bg-white/5 flex items-center justify-center mb-3">
                  <span className="text-4xl">🎨</span>
                </div>
              )}

              {/* Labels */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-300">
                  {creative.angle}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-300 flex items-center gap-1">
                  <PlatformIcon size={10} /> {creative.platform}
                </span>
              </div>

              {/* Hook text */}
              <p className="text-sm font-medium mb-1">{creative.hookingText}</p>

              {/* Copy */}
              <p className="text-xs text-gray-500 line-clamp-3">{creative.copyText}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
