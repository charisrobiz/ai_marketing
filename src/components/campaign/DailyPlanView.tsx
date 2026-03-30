'use client';

import type { DailyPlan } from '@/types';
import { Calendar, Target, CheckCircle, Clock, Play } from 'lucide-react';

export default function DailyPlanView({ plans }: { plans: DailyPlan[] }) {
  const weeks = [1, 2, 3, 4];

  return (
    <div className="glass-card p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-blue-400" />
        <h2 className="text-lg font-semibold">30일 마케팅 플랜</h2>
      </div>

      {weeks.map((week) => {
        const weekPlans = plans.filter((p) => p.week === week);
        if (weekPlans.length === 0) return null;
        return (
          <div key={week} className="mb-6 last:mb-0">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Week {week}</h3>
            <div className="space-y-2">
              {weekPlans.map((plan) => (
                <div
                  key={plan.day}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/8 transition-colors"
                >
                  <div className="mt-0.5">
                    {plan.status === 'completed' ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : plan.status === 'in_progress' ? (
                      <Play className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Clock className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-mono">Day {plan.day}</span>
                      <h4 className="text-sm font-medium">{plan.title}</h4>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{plan.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {plan.channels.map((ch) => (
                        <span key={ch} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
                          {ch}
                        </span>
                      ))}
                      <span className="text-[10px] text-gray-600 flex items-center gap-1">
                        <Target size={10} /> {plan.goal}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
