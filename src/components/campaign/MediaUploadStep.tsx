'use client';

import { useState, useRef } from 'react';
import { Upload, X, FileVideo, FileImage, FileText, AlertCircle } from 'lucide-react';
import { MEDIA_USAGE_LABELS, type MediaUsageIntent } from '@/types';

interface UploadedMedia {
  tempId: string;
  file: File;
  description: string;
  usageIntent: MediaUsageIntent;
  uploading: boolean;
  uploaded: boolean;
  mediaId?: string;
  previewUrl?: string;
}

interface MediaUploadStepProps {
  campaignId: string;
  files: UploadedMedia[];
  onFilesChange: (files: UploadedMedia[]) => void;
}

export type { UploadedMedia };

export default function MediaUploadStep({ campaignId, files, onFilesChange }: MediaUploadStepProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList) => {
    const newFiles: UploadedMedia[] = Array.from(fileList).map((file) => {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      return {
        tempId: crypto.randomUUID(),
        file,
        description: '',
        usageIntent: isVideo ? 'video_source' as MediaUsageIntent : isImage ? 'ad_image_reference' as MediaUsageIntent : 'copy_reference' as MediaUsageIntent,
        uploading: false,
        uploaded: false,
        previewUrl: isImage ? URL.createObjectURL(file) : undefined,
      };
    });
    onFilesChange([...files, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  };

  const updateFile = (tempId: string, updates: Partial<UploadedMedia>) => {
    onFilesChange(files.map((f) => f.tempId === tempId ? { ...f, ...updates } : f));
  };

  const removeFile = (tempId: string) => {
    const file = files.find((f) => f.tempId === tempId);
    if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
    onFilesChange(files.filter((f) => f.tempId !== tempId));
  };

  const uploadFile = async (media: UploadedMedia) => {
    updateFile(media.tempId, { uploading: true });

    const formData = new FormData();
    formData.append('file', media.file);
    formData.append('type', media.file.type.startsWith('video/') ? 'video' : media.file.type.startsWith('image/') ? 'screenshot' : 'document');
    formData.append('content', JSON.stringify({ description: media.description, usage_intent: media.usageIntent }));
    formData.append('sort_order', String(files.indexOf(media)));

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/media`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.id) {
        updateFile(media.tempId, { uploading: false, uploaded: true, mediaId: data.id });
      } else {
        updateFile(media.tempId, { uploading: false });
      }
    } catch {
      updateFile(media.tempId, { uploading: false });
    }
  };

  const uploadAll = async () => {
    const pending = files.filter((f) => !f.uploaded && !f.uploading);
    for (const f of pending) {
      await uploadFile(f);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('video/')) return <FileVideo size={24} className="text-purple-400" />;
    if (file.type.startsWith('image/')) return <FileImage size={24} className="text-green-400" />;
    return <FileText size={24} className="text-blue-400" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const pendingCount = files.filter((f) => !f.uploaded).length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">참고 미디어 업로드</h2>
        <p className="text-sm text-gray-500">
          AI가 더 정확한 광고 소재를 만들 수 있도록 참고 자료를 업로드하세요. (선택사항)
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragOver ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/30 bg-white/[0.02]'
        }`}
      >
        <Upload className="w-8 h-8 text-gray-500 mx-auto mb-3" />
        <p className="text-sm text-gray-400">
          파일을 드래그하거나 <span className="text-blue-400">클릭하여 업로드</span>
        </p>
        <p className="text-xs text-gray-600 mt-1">이미지, 동영상, 문서 지원 (최대 50MB)</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*,.pdf,.pptx,.doc,.docx"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Uploaded Files */}
      {files.length > 0 && (
        <div className="space-y-3">
          {files.map((media) => (
            <div key={media.tempId} className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-start gap-3">
                {/* Preview */}
                <div className="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {media.previewUrl ? (
                    <img src={media.previewUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getFileIcon(media.file)
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  {/* File info */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium truncate">{media.file.name}</p>
                      <p className="text-xs text-gray-500">{formatSize(media.file.size)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {media.uploaded && <span className="text-xs text-green-400">✓ 업로드 완료</span>}
                      {media.uploading && <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />}
                      <button onClick={() => removeFile(media.tempId)} className="p-1 hover:bg-white/10 rounded">
                        <X size={14} className="text-gray-500" />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <input
                    type="text"
                    value={media.description}
                    onChange={(e) => updateFile(media.tempId, { description: e.target.value })}
                    placeholder="이 미디어는 무엇인가요? (예: 앱 메인화면 스크린샷)"
                    className="w-full px-3 py-2 rounded-lg text-xs bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none"
                  />

                  {/* Usage Intent */}
                  <select
                    value={media.usageIntent}
                    onChange={(e) => updateFile(media.tempId, { usageIntent: e.target.value as MediaUsageIntent })}
                    className="w-full px-3 py-2 rounded-lg text-xs bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none"
                  >
                    {(Object.entries(MEDIA_USAGE_LABELS) as [MediaUsageIntent, string][]).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}

          {/* Upload Button */}
          {pendingCount > 0 && (
            <button
              onClick={uploadAll}
              className="w-full py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
            >
              <Upload size={16} />
              {pendingCount}개 파일 업로드
            </button>
          )}
        </div>
      )}

      {files.length === 0 && (
        <div className="flex items-center gap-2 text-gray-500 text-xs px-1">
          <AlertCircle size={12} />
          건너뛰기 가능 — AI가 텍스트 정보만으로도 소재를 생성할 수 있습니다.
        </div>
      )}
    </div>
  );
}
