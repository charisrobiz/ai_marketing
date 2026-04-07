'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { CATEGORY_LABELS, type ProductCategory } from '@/types';
import { ArrowRight, ArrowLeft, Sparkles, CheckCircle, Image, Video, AlertTriangle, Layers } from 'lucide-react';
import MediaUploadStep from '@/components/campaign/MediaUploadStep';
import type { UploadedMedia } from '@/components/campaign/MediaUploadStep';

const CATEGORY_QUESTIONS: Record<ProductCategory, { question: string; placeholder: string }[]> = {
  mobile_app: [
    { question: '이 앱의 핵심 기능을 한 문장으로 설명해주세요.', placeholder: '예: AI가 사진을 자동으로 포토북으로 만들어줍니다.' },
    { question: '다른 앱과 차별화되는 UX 포인트는 무엇인가요?', placeholder: '예: 3번의 탭만으로 포토북 완성' },
    { question: '메인 타겟층이 주로 활동하는 SNS 플랫폼은?', placeholder: '예: 인스타그램, 틱톡' },
    { question: '앱의 수익 모델은 무엇인가요?', placeholder: '예: 프리미엄 구독, 인앱 구매' },
    { question: '현재 앱스토어 등록 상태는?', placeholder: '예: iOS/Android 모두 출시 완료' },
  ],
  web_service: [
    { question: '이 서비스가 해결하는 고객의 핵심 문제(Pain Point)는?', placeholder: '예: 프레젠테이션 제작에 평균 5시간 소요' },
    { question: 'B2B인가요 B2C인가요? 주요 타겟 고객은?', placeholder: '예: B2B, 스타트업 마케팅 팀' },
    { question: '무료 체험 또는 프리미엄 플랜이 있나요?', placeholder: '예: 14일 무료 체험 후 월 29,000원' },
    { question: '경쟁 서비스 대비 핵심 강점은?', placeholder: '예: AI가 자동으로 디자인까지 완성' },
    { question: '서비스 URL이 있다면 알려주세요.', placeholder: 'https://...' },
  ],
  physical_product: [
    { question: '제품의 핵심 소구 포인트는?', placeholder: '예: 100% 유기농 원료, 피부 자극 제로' },
    { question: '가격대와 경쟁 제품 대비 포지셔닝은?', placeholder: '예: 중가, 품질은 프리미엄급' },
    { question: '주요 판매 채널은?', placeholder: '예: 자사몰, 쿠팡, 올리브영' },
    { question: '제품 사진/영상 소재가 있나요?', placeholder: '예: 스튜디오 촬영 완료, 제품 사진 50장 보유' },
    { question: '시즌성이 있는 제품인가요?', placeholder: '예: 여름 시즌 주력 제품' },
  ],
  insurance: [
    { question: '어떤 종류의 보험/금융 상품인가요?', placeholder: '예: 반려동물 의료보험' },
    { question: '타겟 고객의 연령대와 특성은?', placeholder: '예: 30~40대, 반려동물 양육 가구' },
    { question: '경쟁 상품 대비 핵심 차별점은?', placeholder: '예: 보험금 청구 3분 내 완료' },
    { question: '규제 관련 마케팅 제한사항이 있나요?', placeholder: '예: 수익률 보장 문구 사용 불가' },
    { question: '온라인 가입이 가능한가요?', placeholder: '예: 앱에서 3분 내 가입 완료' },
  ],
  education: [
    { question: '어떤 분야의 교육/강의인가요?', placeholder: '예: AI/프로그래밍 입문 온라인 강의' },
    { question: '수강 후 기대 효과는?', placeholder: '예: 4주 만에 AI 앱 개발 가능' },
    { question: '강사/기관의 핵심 크레덴셜은?', placeholder: '예: 前 구글 엔지니어, 수강생 10만명' },
    { question: '가격과 수강 기간은?', placeholder: '예: 월 49,000원, 총 8주 과정' },
    { question: '무료 체험 또는 환불 정책이 있나요?', placeholder: '예: 7일 내 100% 환불 보장' },
  ],
  food_beverage: [
    { question: '제품의 핵심 특장점은?', placeholder: '예: 저칼로리 고단백 프로틴 음료' },
    { question: '타겟 소비자는?', placeholder: '예: 20~30대 헬스/다이어트 관심층' },
    { question: '맛/품질에 대한 자신감 포인트는?', placeholder: '예: 블라인드 테스트 1위' },
    { question: '유통 채널은?', placeholder: '예: 자사몰 + 편의점 입점 예정' },
    { question: '시즌성 또는 트렌드와의 연관성은?', placeholder: '예: 여름 다이어트 시즌 주력' },
  ],
  fashion: [
    { question: '브랜드의 핵심 아이덴티티/무드는?', placeholder: '예: 미니멀, 지속가능한 패션' },
    { question: '타겟 고객층과 연령대는?', placeholder: '예: 25~35세 여성, 오피스룩' },
    { question: '가격 포지셔닝은?', placeholder: '예: 중저가, 합리적 가격의 프리미엄 품질' },
    { question: '현재 판매 채널은?', placeholder: '예: 자사몰, 무신사, 인스타그램 셀링' },
    { question: '브랜드 사진/영상 소재 보유 현황은?', placeholder: '예: 룩북 촬영 완료, 모델 착용샷 보유' },
  ],
  other: [
    { question: '제품/서비스의 핵심 가치를 설명해주세요.', placeholder: '어떤 문제를 해결하나요?' },
    { question: '주요 타겟 고객은 누구인가요?', placeholder: '연령, 성별, 직업 등' },
    { question: '경쟁 제품/서비스와 차별점은?', placeholder: '핵심 차별화 포인트' },
    { question: '현재 마케팅 상태와 목표는?', placeholder: '예: 런칭 전, 3개월 내 1만명 유입 목표' },
    { question: '마케팅 예산 규모는?', placeholder: '예: 월 100만원' },
  ],
};

export default function NewCampaignPage() {
  const router = useRouter();
  const { addCampaign, settings } = useStore();
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<ProductCategory | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [uniqueValue, setUniqueValue] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [mediaFiles, setMediaFiles] = useState<UploadedMedia[]>([]);
  const [generateImage, setGenerateImage] = useState(false);
  const [generateVideo, setGenerateVideo] = useState(false);
  const [composeBanner, setComposeBanner] = useState(false);
  const [figmaFileUrl, setFigmaFileUrl] = useState('');
  const [apiWarning, setApiWarning] = useState('');

  // 캠페인 ID를 미리 생성 (미디어 업로드에 필요)
  const campaignId = useMemo(() => crypto.randomUUID(), []);

  const handleMediaToggle = (type: 'image' | 'video', checked: boolean) => {
    if (type === 'image') {
      setGenerateImage(checked);
      if (checked && !settings.geminiApiKey) {
        setApiWarning('이미지 생성을 위해 관리자 설정에서 Gemini API 키를 먼저 등록해주세요.');
        setGenerateImage(false);
        return;
      }
    }
    if (type === 'video') {
      setGenerateVideo(checked);
      if (checked && !settings.runwayApiKey) {
        setApiWarning('동영상 생성을 위해 관리자 설정에서 Runway API 키를 먼저 등록해주세요.');
        setGenerateVideo(false);
        return;
      }
    }
    setApiWarning('');
  };

  const handleCreate = () => {
    if (!category || !name) return;

    const campaign = {
      id: campaignId,
      productInfo: {
        category,
        name,
        description,
        targetAudience,
        uniqueValue,
        additionalAnswers: answers,
      },
      options: { generateImage, generateVideo, composeBanner, figmaFileUrl },
      status: 'planning' as const,
      createdAt: new Date().toISOString(),
    };

    addCampaign(campaign);

    fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: campaign.id, productInfo: campaign.productInfo, options: campaign.options, status: campaign.status }),
    }).catch(() => {});

    router.push(`/campaign/${campaign.id}`);
  };

  const questions = category ? CATEGORY_QUESTIONS[category] : [];
  const stepLabels = ['카테고리', '기본 정보', '심층 질문', '미디어 업로드', '확인'];
  const totalSteps = stepLabels.length;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">새 캠페인 만들기</h1>
        <p className="text-gray-500 text-sm mt-1">제품 정보를 입력하면 AI 팀이 마케팅을 시작합니다</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8">
        {stepLabels.map((label, i) => (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                i === step
                  ? 'bg-blue-600 text-white'
                  : i < step
                  ? 'bg-green-600 text-white'
                  : 'bg-white/5 text-gray-500'
              }`}
            >
              {i < step ? <CheckCircle size={16} /> : i + 1}
            </div>
            <span className={`text-xs ${i === step ? 'text-white' : 'text-gray-500'} hidden sm:inline`}>
              {label}
            </span>
            {i < totalSteps - 1 && <div className="flex-1 h-px bg-white/10" />}
          </div>
        ))}
      </div>

      <div className="glass-card p-8">
        {/* Step 0: Category */}
        {step === 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">제품/서비스 카테고리를 선택하세요</h2>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(CATEGORY_LABELS) as [ProductCategory, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => { setCategory(key); setStep(1); }}
                  className={`p-4 rounded-lg border text-left transition-all hover:border-blue-500/50 ${
                    category === key
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">기본 정보</h2>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">제품/서비스 이름 *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: SNAPTALE"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">간단한 설명</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="제품/서비스를 한두 문장으로 설명해주세요." rows={3}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none text-sm resize-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">타겟 고객</label>
              <input type="text" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="예: 20~30대 자녀를 가진 부모"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">핵심 차별점</label>
              <input type="text" value={uniqueValue} onChange={(e) => setUniqueValue(e.target.value)} placeholder="예: AI가 자동으로 사진첩을 만들어줌"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none text-sm" />
            </div>
          </div>
        )}

        {/* Step 2: Deep Questions */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-semibold">AI 맞춤 심층 질문</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              {CATEGORY_LABELS[category!]} 카테고리에 맞는 질문을 준비했습니다.
            </p>
            {questions.map((q, i) => (
              <div key={i}>
                <label className="block text-sm text-gray-300 mb-1.5">
                  <span className="text-blue-400 mr-1">Q{i + 1}.</span> {q.question}
                </label>
                <input type="text" value={answers[`q${i}`] || ''} onChange={(e) => setAnswers({ ...answers, [`q${i}`]: e.target.value })} placeholder={q.placeholder}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none text-sm" />
              </div>
            ))}
          </div>
        )}

        {/* Step 3: Media Upload */}
        {step === 3 && (
          <MediaUploadStep
            campaignId={campaignId}
            files={mediaFiles}
            onFilesChange={setMediaFiles}
          />
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">캠페인 정보 확인</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-500">카테고리</span>
                <span>{CATEGORY_LABELS[category!]}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-500">이름</span>
                <span className="font-medium">{name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-500">설명</span>
                <span className="text-right max-w-xs">{description || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-500">타겟</span>
                <span>{targetAudience || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-500">차별점</span>
                <span className="text-right max-w-xs">{uniqueValue || '-'}</span>
              </div>
              {mediaFiles.length > 0 && (
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-gray-500">참고 미디어</span>
                  <span className="text-blue-400">{mediaFiles.filter(f => f.uploaded).length}개 업로드됨</span>
                </div>
              )}
            </div>

            {/* 미디어 생성 옵션 */}
            <div className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10">
              <h3 className="text-sm font-semibold mb-3">AI 미디어 생성 옵션</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={generateImage} onChange={(e) => handleMediaToggle('image', e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/30 focus:ring-offset-0 cursor-pointer" />
                  <Image size={18} className="text-green-400" />
                  <div>
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">AI 이미지 생성</span>
                    <span className="text-xs text-gray-500 ml-2">Gemini &middot; ~$0.04/장</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={generateVideo} onChange={(e) => handleMediaToggle('video', e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/30 focus:ring-offset-0 cursor-pointer" />
                  <Video size={18} className="text-purple-400" />
                  <div>
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">AI 동영상 생성</span>
                    <span className="text-xs text-gray-500 ml-2">Runway Gen-4 &middot; ~$0.25/5초</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={composeBanner} onChange={(e) => {
                    const checked = e.target.checked;
                    if (checked && !settings.figmaApiKey) {
                      setApiWarning('Figma 배너 합성을 위해 관리자 설정에서 Figma API 키를 먼저 등록해주세요.');
                      return;
                    }
                    if (checked && !settings.geminiApiKey) {
                      setApiWarning('배너 합성에 Gemini API 키가 필요합니다. 관리자 설정에서 등록해주세요.');
                      return;
                    }
                    setComposeBanner(checked);
                    setApiWarning('');
                  }}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/30 focus:ring-offset-0 cursor-pointer" />
                  <Layers size={18} className="text-cyan-400" />
                  <div>
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Figma 배너 합성</span>
                    <span className="text-xs text-gray-500 ml-2">템플릿 기반 광고 배너 자동 생성</span>
                  </div>
                </label>
                {composeBanner && (
                  <div className="ml-7 mt-1">
                    <input
                      type="text"
                      value={figmaFileUrl}
                      onChange={(e) => setFigmaFileUrl(e.target.value)}
                      placeholder="Figma 파일 URL (예: https://figma.com/design/ABC123/...)"
                      className="w-full px-3 py-2 rounded-lg text-xs bg-white/5 border border-white/10 focus:border-cyan-500/50 focus:outline-none"
                    />
                    <p className="text-[10px] text-gray-600 mt-1">
                      템플릿에 hooking_text, copy_text, product_image 등 이름의 레이어를 만들어두세요.
                    </p>
                  </div>
                )}
              </div>
              {apiWarning && (
                <div className="mt-3 flex items-center gap-2 text-amber-400 text-xs bg-amber-500/10 px-3 py-2 rounded-lg">
                  <AlertTriangle size={14} />{apiWarning}
                </div>
              )}
            </div>

            <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-blue-400">
                캠페인을 시작하면 AI 팀이 즉시 30일 마케팅 플랜을 생성하고, 크리에이티브 소재 제작을 시작합니다.
                {mediaFiles.some(f => f.uploaded) && ' CEO가 업로드한 미디어를 참고하여 더 정확한 소재를 만듭니다.'}
                {generateImage && ' 각 소재에 AI 이미지가 자동 생성됩니다.'}
                {generateVideo && ' 이미지 기반 숏폼 동영상도 함께 제작됩니다.'}
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ArrowLeft size={16} /> 이전
          </button>
          {step < totalSteps - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={(step === 0 && !category) || (step === 1 && !name)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 disabled:opacity-30 transition-colors"
            >
              {step === 3 ? '건너뛰기 / 다음' : '다음'} <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Sparkles size={16} /> 캠페인 시작
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
