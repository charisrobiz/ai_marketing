'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Sparkles, Loader2, ExternalLink, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { SOCIAL_PLATFORM_CONFIG, type SocialPlatform, type SocialChannel, type ChannelRecommendation } from '@/types';

export default function SocialChannelManager() {
  const [channels, setChannels] = useState<SocialChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  const [recommending, setRecommending] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, { accountId: string; accountUrl: string }>>({});
  const [brandInfo, setBrandInfo] = useState({ name: '', category: '', targetAudience: '', uniqueValue: '', description: '' });
  const [copied, setCopied] = useState('');

  useEffect(() => {
    fetch('/api/social-channels').then((r) => r.json()).then((data) => { setChannels(data || []); setLoading(false); });
    // 최근 캠페인에서 브랜드 정보 가져오기
    fetch('/api/campaigns').then((r) => r.json()).then((campaigns) => {
      if (campaigns.length > 0) {
        const p = campaigns[0].productInfo;
        setBrandInfo({ name: p.name, category: p.category || '', targetAudience: p.targetAudience || '', uniqueValue: p.uniqueValue || '', description: p.description || '' });
      }
    });
  }, []);

  const getChannel = (platform: SocialPlatform): SocialChannel | undefined =>
    channels.find((c) => c.platform === platform);

  const handleRegister = async (platform: SocialPlatform) => {
    const val = editValues[platform];
    if (!val?.accountId) return;
    await fetch('/api/social-channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform, accountId: val.accountId, accountUrl: val.accountUrl, status: 'registered' }),
    });
    const res = await fetch('/api/social-channels');
    setChannels(await res.json());
  };

  const handleRecommend = async (platform: SocialPlatform) => {
    if (!brandInfo.name) return;
    setRecommending(platform);
    try {
      const res = await fetch('/api/social-channels/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, productInfo: brandInfo }),
      });
      const data = await res.json();
      if (data.recommendation) {
        const updated = await fetch('/api/social-channels');
        setChannels(await updated.json());
      }
    } catch { /* empty */ }
    setRecommending(null);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 1500);
  };

  const platforms = Object.keys(SOCIAL_PLATFORM_CONFIG) as SocialPlatform[];

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-500" /></div>;
  }

  return (
    <div className="space-y-3">
      {/* Status Overview */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
        {platforms.map((p) => {
          const config = SOCIAL_PLATFORM_CONFIG[p];
          const channel = getChannel(p);
          const status = channel?.status || 'none';
          return (
            <div key={p} className="glass-card p-3 text-center">
              <p className="text-lg mb-1">{config.emoji}</p>
              <p className={`text-[10px] font-semibold ${config.color}`}>{config.label}</p>
              <p className={`text-[10px] mt-1 ${status === 'registered' ? 'text-green-400' : status === 'ai_recommended' ? 'text-amber-400' : 'text-gray-500'}`}>
                {status === 'registered' ? '등록됨' : status === 'ai_recommended' ? 'AI 추천' : '미등록'}
              </p>
            </div>
          );
        })}
      </div>

      {/* Channel Cards */}
      {platforms.map((platform) => {
        const config = SOCIAL_PLATFORM_CONFIG[platform];
        const channel = getChannel(platform);
        const isExpanded = expandedPlatform === platform;
        const rec = channel?.ai_recommendation as ChannelRecommendation | undefined;

        return (
          <div key={platform} className="rounded-lg bg-white/[0.02] border border-white/5 overflow-hidden">
            {/* Header */}
            <button
              onClick={() => setExpandedPlatform(isExpanded ? null : platform)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{config.emoji}</span>
                <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                {channel?.status === 'registered' && (
                  <span className="flex items-center gap-1 text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                    <CheckCircle size={10} /> {channel.account_id}
                  </span>
                )}
                {channel?.status === 'ai_recommended' && (
                  <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    <Sparkles size={10} /> AI 추천 완료
                  </span>
                )}
                {(!channel || channel.status === 'none') && (
                  <span className="text-[10px] text-gray-500">미등록</span>
                )}
              </div>
              {isExpanded ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
            </button>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="px-4 pb-4 space-y-4">
                {/* Register existing account */}
                <div className="p-3 rounded-lg bg-white/5">
                  <h4 className="text-xs font-semibold text-gray-400 mb-2">이미 계정이 있어요</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="@아이디 또는 채널명"
                      value={editValues[platform]?.accountId || channel?.account_id || ''}
                      onChange={(e) => setEditValues({ ...editValues, [platform]: { ...editValues[platform], accountId: e.target.value, accountUrl: editValues[platform]?.accountUrl || '' } })}
                      className="flex-1 px-3 py-2 rounded-lg text-xs bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="프로필 URL (선택)"
                      value={editValues[platform]?.accountUrl || channel?.account_url || ''}
                      onChange={(e) => setEditValues({ ...editValues, [platform]: { ...editValues[platform], accountUrl: e.target.value, accountId: editValues[platform]?.accountId || '' } })}
                      className="flex-1 px-3 py-2 rounded-lg text-xs bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none"
                    />
                    <button onClick={() => handleRegister(platform)}
                      className="px-3 py-2 rounded-lg text-xs bg-green-600 text-white hover:bg-green-500 transition-colors whitespace-nowrap">
                      등록
                    </button>
                  </div>
                </div>

                {/* AI Recommendation */}
                <div className="p-3 rounded-lg bg-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-gray-400">계정이 없어요 - AI 추천 받기</h4>
                    <button
                      onClick={() => handleRecommend(platform)}
                      disabled={recommending === platform || !brandInfo.name}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-40 transition-colors"
                    >
                      {recommending === platform ? (
                        <><Loader2 size={12} className="animate-spin" /> AI 분석 중...</>
                      ) : (
                        <><Sparkles size={12} /> AI 추천 받기</>
                      )}
                    </button>
                  </div>
                  {!brandInfo.name && (
                    <p className="text-[10px] text-amber-400 flex items-center gap-1"><AlertCircle size={10} /> 캠페인을 먼저 생성해야 브랜드 정보 기반 추천이 가능합니다.</p>
                  )}
                </div>

                {/* AI Recommendation Result */}
                {rec && (
                  <div className="space-y-3">
                    {/* Agent Discussion */}
                    {rec.agentDiscussion && rec.agentDiscussion.length > 0 && (
                      <div className="p-3 rounded-lg bg-white/5">
                        <h4 className="text-xs font-semibold text-gray-400 mb-2">AI 팀 회의</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {rec.agentDiscussion.map((msg, i) => (
                            <div key={i} className="flex gap-2">
                              <span className="text-[10px] font-semibold text-blue-400 whitespace-nowrap">{msg.name}</span>
                              <p className="text-[10px] text-gray-400 leading-relaxed">{msg.message}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: '추천 이름', value: rec.recommendedName },
                        { label: '추천 ID', value: rec.recommendedId },
                        { label: '카테고리', value: rec.category },
                        { label: '프로필 이미지 컨셉', value: rec.profileImageConcept },
                      ].map(({ label, value }) => (
                        <div key={label} className="p-2 rounded bg-white/5">
                          <p className="text-[10px] text-gray-500 mb-1">{label}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium truncate mr-2">{value}</p>
                            <button onClick={() => copyToClipboard(value, label)} className="p-1 hover:bg-white/10 rounded flex-shrink-0">
                              <Copy size={10} className={copied === label ? 'text-green-400' : 'text-gray-500'} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Bio */}
                    <div className="p-2 rounded bg-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] text-gray-500">추천 바이오 ({config.bioLimit}자 이내)</p>
                        <button onClick={() => copyToClipboard(rec.bio, 'bio')} className="p-1 hover:bg-white/10 rounded">
                          <Copy size={10} className={copied === 'bio' ? 'text-green-400' : 'text-gray-500'} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">{rec.bio}</p>
                    </div>

                    {/* Algorithm Tips */}
                    {rec.algorithmTips && (
                      <div className="p-2 rounded bg-white/5">
                        <p className="text-[10px] text-gray-500 mb-1">{config.label} 알고리즘 팁</p>
                        {rec.algorithmTips.map((tip, i) => (
                          <p key={i} className="text-[10px] text-gray-400 pl-2 my-0.5">• {tip}</p>
                        ))}
                      </div>
                    )}

                    {/* SEO Keywords */}
                    {rec.seoKeywords && (
                      <div className="p-2 rounded bg-white/5">
                        <p className="text-[10px] text-gray-500 mb-1">SEO 키워드</p>
                        <div className="flex flex-wrap gap-1">
                          {rec.seoKeywords.map((kw, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">#{kw}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Content Strategy */}
                    {rec.initialContentStrategy && (
                      <div className="p-2 rounded bg-white/5">
                        <p className="text-[10px] text-gray-500 mb-1">초기 콘텐츠 전략</p>
                        <p className="text-xs text-gray-400 leading-relaxed">{rec.initialContentStrategy}</p>
                      </div>
                    )}

                    {/* Apply button */}
                    <button
                      onClick={() => {
                        setEditValues({
                          ...editValues,
                          [platform]: { accountId: rec.recommendedId, accountUrl: '' },
                        });
                      }}
                      className="w-full py-2 rounded-lg text-xs bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink size={12} /> 추천 ID로 계정 등록하기
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
