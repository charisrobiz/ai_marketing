'use client';

import type { VoteResult, Creative } from '@/types';
import { Trophy, MessageCircle } from 'lucide-react';

export default function VotingArena({
  votes,
  creatives,
}: {
  votes: VoteResult[];
  creatives: Creative[];
}) {
  const sortedVotes = [...votes].sort((a, b) => b.averageScore - a.averageScore);
  const maxScore = sortedVotes[0]?.averageScore || 10;

  return (
    <div className="glass-card p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-yellow-400" />
        <h2 className="text-lg font-semibold">100인 AI 심사위원 투표 결과</h2>
      </div>

      <div className="space-y-4">
        {sortedVotes.map((result, idx) => {
          const creative = creatives.find((c) => c.id === result.creativeId);
          const barWidth = (result.averageScore / maxScore) * 100;
          const isWinner = idx === 0;

          return (
            <div
              key={result.creativeId}
              className={`p-4 rounded-lg ${isWinner ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-white/5'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {isWinner && <span className="text-lg">👑</span>}
                  <span className="font-medium">
                    {creative?.angle || `소재 ${idx + 1}`}
                  </span>
                  <span className="text-xs text-gray-500">#{idx + 1}</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold">{result.averageScore.toFixed(1)}</span>
                  <span className="text-xs text-gray-500">/10</span>
                </div>
              </div>

              {/* Score bar */}
              <div className="w-full h-2 bg-white/5 rounded-full mb-3">
                <div
                  className={`vote-bar h-full rounded-full ${
                    isWinner
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                      : 'bg-gradient-to-r from-blue-500 to-purple-500'
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>

              {/* Hook text */}
              {creative && (
                <p className="text-sm text-gray-400 mb-3">&ldquo;{creative.hookingText}&rdquo;</p>
              )}

              {/* Sample comments */}
              {result.votes.slice(0, 3).map((vote) => (
                <div key={vote.juryId} className="flex items-start gap-2 mb-1.5">
                  <MessageCircle className="w-3 h-3 text-gray-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-gray-500">
                    <span className="text-gray-400">심사위원 #{vote.juryId}</span>: {vote.comment}{' '}
                    <span className="text-yellow-500">({vote.score}/10)</span>
                  </p>
                </div>
              ))}
              {result.votes.length > 3 && (
                <p className="text-[10px] text-gray-600 mt-1">
                  +{result.votes.length - 3}개 더 보기
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
