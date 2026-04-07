'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Upload, X, FileVideo, FileImage, FileText, Trash2, Plus, Save } from 'lucide-react';
import { MEDIA_USAGE_LABELS, type MediaUsageIntent, type CampaignMedia, type MediaContent } from '@/types';
import Link from 'next/link';

export default function CampaignMediaPage() {
  const { id } = useParams() as { id: string };
  const [mediaList, setMediaList] = useState<CampaignMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 새로 추가할 텍스트 메모
  const [newNote, setNewNote] = useState('');

  const fetchMedia = async () => {
    const res = await fetch(`/api/campaigns/${id}/media`);
    const data = await res.json();
    setMediaList(
      (data || []).map((m: CampaignMedia) => ({
        ...m,
        parsedContent: m.content ? JSON.parse(m.content) as MediaContent : null,
      }))
    );
    setLoading(false);
  };

  useEffect(() => { fetchMedia(); }, [id]);

  const handleFiles = async (fileList: FileList) => {
    setUploading(true);
    for (const file of Array.from(fileList)) {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      const defaultIntent: MediaUsageIntent = isVideo ? 'video_source' : isImage ? 'ad_image_reference' : 'copy_reference';

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', isVideo ? 'video' : isImage ? 'screenshot' : 'document');
      formData.append('content', JSON.stringify({ description: '', usage_intent: defaultIntent }));
      formData.append('sort_order', String(mediaList.length));

      await fetch(`/api/campaigns/${id}/media`, { method: 'POST', body: formData });
    }
    await fetchMedia();
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  };

  const handleDelete = async (mediaId: string) => {
    await fetch(`/api/campaigns/${id}/media?mediaId=${mediaId}`, { method: 'DELETE' });
    setMediaList((prev) => prev.filter((m) => m.id !== mediaId));
  };

  const handleUpdate = async (mediaId: string, description: string, usageIntent: MediaUsageIntent) => {
    // content 필드를 업데이트하는 API 호출
    await fetch(`/api/campaigns/${id}/media`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mediaId, content: JSON.stringify({ description, usage_intent: usageIntent }) }),
    });
    setMediaList((prev) => prev.map((m) =>
      m.id === mediaId ? { ...m, parsedContent: { description, usage_intent: usageIntent } } : m
    ));
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    const formData = new FormData();
    formData.append('type', 'description');
    formData.append('content', JSON.stringify({ description: newNote, usage_intent: 'copy_reference' as MediaUsageIntent }));
    formData.append('sort_order', String(mediaList.length));

    await fetch(`/api/campaigns/${id}/media`, { method: 'POST', body: formData });
    setNewNote('');
    await fetchMedia();
  };

  const getIcon = (type: string) => {
    if (type === 'video') return <FileVideo size={20} className="text-purple-400" />;
    if (type === 'screenshot') return <FileImage size={20} className="text-green-400" />;
    return <FileText size={20} className="text-blue-400" />;
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/campaign/${id}`} className="p-2 rounded-lg hover:bg-white/5">
          <ArrowLeft size={20} className="text-gray-400" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">미디어 관리</h1>
          <p className="text-gray-500 text-sm">이미지, 동영상, 추가 설명을 업로드하고 AI 활용 방법을 설정하세요</p>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`glass-card p-8 text-center cursor-pointer transition-all mb-6 ${
          dragOver ? 'border-blue-500 bg-blue-500/10' : 'hover:border-white/30'
        }`}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-400">업로드 중...</span>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 text-gray-500 mx-auto mb-3" />
            <p className="text-sm text-gray-400">
              파일을 드래그하거나 <span className="text-blue-400">클릭하여 업로드</span>
            </p>
            <p className="text-xs text-gray-600 mt-1">이미지, 동영상, 문서 (최대 50MB)</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*,.pdf,.pptx,.doc,.docx"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Add Text Note */}
      <div className="glass-card p-4 mb-6">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Plus size={14} className="text-blue-400" />
          추가 설명 / 광고용 내용 입력
        </h3>
        <div className="flex gap-2">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="AI에게 전달할 추가 정보를 입력하세요 (예: 이번 달 프로모션 50% 할인 진행 중, 앱 업데이트로 새 기능 추가됨 등)"
            rows={3}
            className="flex-1 px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none resize-none"
          />
          <button
            onClick={handleAddNote}
            disabled={!newNote.trim()}
            className="px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 disabled:opacity-30 transition-colors self-end h-10 flex items-center gap-1.5"
          >
            <Save size={14} /> 저장
          </button>
        </div>
      </div>

      {/* Media List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : mediaList.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-gray-500 text-sm">등록된 미디어가 없습니다.</p>
          <p className="text-gray-600 text-xs mt-1">위에서 파일을 업로드하거나 텍스트 메모를 추가해보세요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 mb-2">총 {mediaList.length}개 등록됨</p>
          {mediaList.map((media) => {
            const parsed = media.parsedContent;
            return (
              <div key={media.id} className="glass-card p-4">
                <div className="flex items-start gap-3">
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {media.file_url && media.type === 'screenshot' ? (
                      <img src={media.file_url} alt="" className="w-full h-full object-cover" />
                    ) : media.file_url && media.type === 'video' ? (
                      <video src={media.file_url} className="w-full h-full object-cover" muted />
                    ) : (
                      getIcon(media.type)
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    {/* File info */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium truncate">
                          {media.file_name || (media.type === 'description' ? '텍스트 메모' : '파일')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {media.type === 'description' ? '텍스트' : formatSize(media.file_size)}
                          {' · '}{new Date(media.created_at).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                      <button onClick={() => handleDelete(media.id)} className="p-1.5 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Description */}
                    <input
                      type="text"
                      defaultValue={parsed?.description || ''}
                      onBlur={(e) => handleUpdate(media.id, e.target.value, parsed?.usage_intent || 'copy_reference')}
                      placeholder="이 미디어 설명 (예: 앱 메인화면 스크린샷, 할인 프로모션 배너)"
                      className="w-full px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none"
                    />

                    {/* Usage Intent */}
                    <select
                      defaultValue={parsed?.usage_intent || 'copy_reference'}
                      onChange={(e) => handleUpdate(media.id, parsed?.description || '', e.target.value as MediaUsageIntent)}
                      className="w-full px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none"
                    >
                      {(Object.entries(MEDIA_USAGE_LABELS) as [MediaUsageIntent, string][]).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
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
