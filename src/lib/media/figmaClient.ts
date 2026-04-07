// Figma REST API - 템플릿 구조 읽기 + 프레임 이미지 내보내기

import type { FigmaTemplate, FigmaFrame, FigmaPlaceholder } from '@/types';

const FIGMA_API = 'https://api.figma.com/v1';

// 플레이스홀더로 인식할 노드 이름 패턴
const PLACEHOLDER_NAMES = ['hooking_text', 'copy_text', 'product_image', 'background', 'cta_text', 'logo', 'sub_text'];

// 플랫폼별 프레임 이름 매칭
const PLATFORM_PATTERNS = [
  { pattern: /instagram|insta|ig|1080.*1080/i, name: 'Instagram' },
  { pattern: /tiktok|tik.*tok|reels|9.*16|1080.*1920/i, name: 'TikTok' },
  { pattern: /youtube|yt|thumb|16.*9|1280.*720/i, name: 'YouTube' },
  { pattern: /blog|banner|header/i, name: 'Blog' },
  { pattern: /facebook|fb/i, name: 'Facebook' },
];

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
  children?: FigmaNode[];
  style?: { fontFamily?: string; fontSize?: number; fontWeight?: number; textAlignHorizontal?: string };
}

export function parseFigmaUrl(url: string): { fileKey: string; nodeId?: string } | null {
  try {
    const match = url.match(/figma\.com\/(?:design|file)\/([a-zA-Z0-9]+)/);
    if (!match) return null;
    const fileKey = match[1];
    const urlObj = new URL(url);
    const nodeId = urlObj.searchParams.get('node-id')?.replace('-', ':') || undefined;
    return { fileKey, nodeId };
  } catch {
    return null;
  }
}

function findPlaceholders(node: FigmaNode, frameBounds: { x: number; y: number }): FigmaPlaceholder[] {
  const placeholders: FigmaPlaceholder[] = [];

  const lowerName = node.name.toLowerCase().replace(/\s+/g, '_');
  const isPlaceholder = PLACEHOLDER_NAMES.some((p) => lowerName.includes(p));

  if (isPlaceholder && node.absoluteBoundingBox) {
    const b = node.absoluteBoundingBox;
    placeholders.push({
      name: lowerName,
      type: node.type === 'TEXT' ? 'text' : 'image',
      bounds: {
        x: b.x - frameBounds.x,
        y: b.y - frameBounds.y,
        w: b.width,
        h: b.height,
      },
      textStyle: node.type === 'TEXT' && node.style ? {
        fontSize: node.style.fontSize || 16,
        fontWeight: node.style.fontWeight || 400,
        textAlign: node.style.textAlignHorizontal || 'LEFT',
      } : undefined,
    });
  }

  if (node.children) {
    for (const child of node.children) {
      placeholders.push(...findPlaceholders(child, frameBounds));
    }
  }

  return placeholders;
}

function identifyFrames(document: FigmaNode): FigmaFrame[] {
  const frames: FigmaFrame[] = [];

  function traverse(node: FigmaNode) {
    if (node.type === 'FRAME' && node.absoluteBoundingBox) {
      const b = node.absoluteBoundingBox;
      // 최소 크기 필터 (너무 작은 프레임 제외)
      if (b.width >= 300 && b.height >= 300) {
        const platformMatch = PLATFORM_PATTERNS.find((p) => p.pattern.test(node.name));
        const frameName = platformMatch ? platformMatch.name : node.name;

        frames.push({
          name: frameName,
          nodeId: node.id,
          width: b.width,
          height: b.height,
          placeholders: findPlaceholders(node, { x: b.x, y: b.y }),
        });
      }
    }

    if (node.children) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  traverse(document);
  return frames;
}

export async function fetchFigmaTemplate(
  apiKey: string,
  figmaFileUrl: string
): Promise<FigmaTemplate | null> {
  const parsed = parseFigmaUrl(figmaFileUrl);
  if (!parsed) return null;

  try {
    // 1. 파일 구조 가져오기
    const fileRes = await fetch(`${FIGMA_API}/files/${parsed.fileKey}`, {
      headers: { 'X-Figma-Token': apiKey },
    });
    if (!fileRes.ok) return null;

    const fileData = await fileRes.json();
    const frames = identifyFrames(fileData.document);

    if (frames.length === 0) return null;

    // 2. 각 프레임을 PNG로 내보내기
    const nodeIds = frames.map((f) => f.nodeId).join(',');
    const imgRes = await fetch(
      `${FIGMA_API}/images/${parsed.fileKey}?ids=${nodeIds}&format=png&scale=2`,
      { headers: { 'X-Figma-Token': apiKey } }
    );

    if (imgRes.ok) {
      const imgData = await imgRes.json();
      const images = imgData.images || {};
      for (const frame of frames) {
        frame.imageUrl = images[frame.nodeId] || undefined;
      }
    }

    return { fileKey: parsed.fileKey, frames };
  } catch {
    return null;
  }
}
