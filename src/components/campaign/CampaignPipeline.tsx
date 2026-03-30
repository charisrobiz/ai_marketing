'use client';

import { CheckCircle, Circle, Loader2 } from 'lucide-react';

const PIPELINE_STEPS = [
  { key: 'intake', label: '정보 수집' },
  { key: 'planning', label: '플랜 생성' },
  { key: 'creating', label: '소재 생성' },
  { key: 'voting', label: '심사위원 투표' },
  { key: 'testing', label: 'A/B 테스트' },
  { key: 'deploying', label: '광고 배포' },
  { key: 'active', label: '운영 중' },
];

const STEP_ORDER = PIPELINE_STEPS.map((s) => s.key);

export default function CampaignPipeline({ status }: { status: string }) {
  const currentIdx = STEP_ORDER.indexOf(status);

  return (
    <div className="glass-card p-6 mb-6">
      <h2 className="text-sm font-semibold text-gray-400 mb-4">캠페인 파이프라인</h2>
      <div className="flex items-center justify-between">
        {PIPELINE_STEPS.map((step, i) => {
          const isCompleted = i < currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <div key={step.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                {isCompleted ? (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                ) : isCurrent ? (
                  <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-600" />
                )}
                <span
                  className={`text-[10px] mt-1.5 text-center ${
                    isCurrent ? 'text-blue-400 font-medium' : isCompleted ? 'text-green-400' : 'text-gray-600'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <div
                  className={`flex-1 h-px mx-2 ${
                    isCompleted ? 'bg-green-500/50' : 'bg-white/5'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
