// URL에서 메타데이터 추출 (oEmbed + OG 태그)

import type { BenchmarkPlatform } from '@/types';

export interface URLMetadata {
  platform: BenchmarkPlatform;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  author?: string;
  stats?: { views?: number; likes?: number; comments?: number };
}

export function detectPlatform(url: string): BenchmarkPlatform {
  if (/youtube\.com|youtu\.be/.test(url)) return 'youtube';
  if (/instagram\.com/.test(url)) return 'instagram';
  if (/tiktok\.com/.test(url)) return 'tiktok';
  if (/facebook\.com|fb\.com/.test(url)) return 'facebook';
  if (/twitter\.com|x\.com/.test(url)) return 'x';
  if (/threads\.net/.test(url)) return 'threads';
  if (/blog\.naver\.com|tistory\.com|brunch\.co\.kr|medium\.com|velog\.io/.test(url)) return 'blog';
  return 'other';
}

// YouTube Video ID 추출
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/shorts\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

// YouTube oEmbed (API 키 불필요)
async function fetchYouTubeOEmbed(url: string): Promise<URLMetadata | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oembedUrl);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      platform: 'youtube',
      title: data.title,
      author: data.author_name,
      thumbnailUrl: data.thumbnail_url,
    };
  } catch {
    return null;
  }
}

// YouTube 고화질 썸네일 URL (API 없이)
function getYouTubeThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
}

// YouTube Data API (선택, 키 있으면 사용)
async function fetchYouTubeDataAPI(videoId: string, apiKey: string): Promise<Partial<URLMetadata> | null> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const item = data.items?.[0];
    if (!item) return null;

    return {
      title: item.snippet?.title,
      description: item.snippet?.description,
      author: item.snippet?.channelTitle,
      thumbnailUrl: item.snippet?.thumbnails?.maxres?.url || item.snippet?.thumbnails?.high?.url,
      stats: {
        views: parseInt(item.statistics?.viewCount || '0'),
        likes: parseInt(item.statistics?.likeCount || '0'),
        comments: parseInt(item.statistics?.commentCount || '0'),
      },
    };
  } catch {
    return null;
  }
}

// Instagram/TikTok oEmbed (제한적)
async function fetchOEmbedFallback(url: string, platform: BenchmarkPlatform): Promise<URLMetadata | null> {
  try {
    let oembedUrl = '';
    if (platform === 'instagram') {
      oembedUrl = `https://api.instagram.com/oembed?url=${encodeURIComponent(url)}`;
    } else if (platform === 'tiktok') {
      oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    }

    if (!oembedUrl) return null;
    const res = await fetch(oembedUrl);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      platform,
      title: data.title || data.author_name,
      author: data.author_name,
      thumbnailUrl: data.thumbnail_url,
    };
  } catch {
    return null;
  }
}

// Open Graph 메타 태그 파싱 (블로그, 일반 페이지)
async function fetchOGTags(url: string): Promise<URLMetadata | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AutoGrowthBot/1.0)' },
    });
    if (!res.ok) return null;
    const html = await res.text();

    const getMeta = (property: string): string | undefined => {
      const re = new RegExp(`<meta\\s+(?:property|name)=["']${property}["']\\s+content=["']([^"']+)["']`, 'i');
      const m = html.match(re);
      return m ? m[1] : undefined;
    };

    const title = getMeta('og:title') || getMeta('twitter:title');
    const description = getMeta('og:description') || getMeta('twitter:description');
    const image = getMeta('og:image') || getMeta('twitter:image');

    if (!title && !image) return null;

    return {
      platform: detectPlatform(url),
      title,
      description,
      thumbnailUrl: image,
    };
  } catch {
    return null;
  }
}

// 메인 함수: URL → 메타데이터
export async function analyzeURL(url: string, youtubeApiKey?: string): Promise<URLMetadata> {
  const platform = detectPlatform(url);

  // YouTube
  if (platform === 'youtube') {
    const videoId = extractYouTubeId(url);

    // API 키 있으면 우선 사용
    if (videoId && youtubeApiKey) {
      const apiData = await fetchYouTubeDataAPI(videoId, youtubeApiKey);
      if (apiData) return { platform, ...apiData };
    }

    // oEmbed
    const oembed = await fetchYouTubeOEmbed(url);
    if (oembed) {
      // 썸네일 고화질로 교체
      if (videoId) oembed.thumbnailUrl = getYouTubeThumbnail(videoId);
      return oembed;
    }

    // 최소 정보
    if (videoId) {
      return { platform, thumbnailUrl: getYouTubeThumbnail(videoId), title: '제목 없음' };
    }
  }

  // Instagram, TikTok
  if (platform === 'instagram' || platform === 'tiktok') {
    const oembed = await fetchOEmbedFallback(url, platform);
    if (oembed) return oembed;
  }

  // 블로그, 기타 - OG 태그
  const og = await fetchOGTags(url);
  if (og) return og;

  // 최소 fallback
  return { platform, title: url };
}
