'use client';

import { useStore } from '@/store/useStore';
import { JURY_PERSONAS } from '@/data/juryPersonas';
import { Users } from 'lucide-react';
import { DEPARTMENT_LABELS, type Department } from '@/types';

const DEPT_CONFIG: Record<Department, { color: string; border: string }> = {
  pm: { color: 'text-amber-400', border: 'border-amber-500/20' },
  marketing: { color: 'text-red-400', border: 'border-red-500/20' },
  design: { color: 'text-purple-400', border: 'border-purple-500/20' },
  development: { color: 'text-teal-400', border: 'border-teal-500/20' },
};

const PERSONA_GROUP_LABELS: Record<string, { label: string; color: string; count: string }> = {
  trend: { label: '트렌드 민감형', color: 'text-pink-400', count: '20명' },
  practical: { label: '실용주의 가성비형', color: 'text-blue-400', count: '30명' },
  emotional: { label: '감성 추구형', color: 'text-purple-400', count: '20명' },
  analytical: { label: '분석/의심형', color: 'text-yellow-400', count: '20명' },
  impulsive: { label: '충동 구매형', color: 'text-red-400', count: '10명' },
};

const DEPT_ORDER: Department[] = ['pm', 'marketing', 'design', 'development'];

export default function AgentsPage() {
  const { agents } = useStore();

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="flex items-center gap-3 mb-8">
        <Users className="w-6 h-6 text-gray-400" />
        <div>
          <h1 className="text-2xl font-bold">AI 직원</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            핵심 에이전트 {agents.length}명 (PM 1 + 마케팅 3 + 디자인 2 + 개발 2) + 100인 AI 심사위원단
          </p>
        </div>
      </div>

      {/* Core Agents by Department */}
      {DEPT_ORDER.map((dept) => {
        const deptAgents = agents.filter((a) => a.department === dept);
        const config = DEPT_CONFIG[dept];
        if (deptAgents.length === 0) return null;
        return (
          <div key={dept} className="mb-8">
            <h2 className={`text-sm font-semibold mb-3 ${config.color} uppercase tracking-wider`}>
              {DEPARTMENT_LABELS[dept]}
            </h2>
            <div className={`grid gap-3 ${dept === 'pm' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
              {deptAgents.map((agent) => (
                <div
                  key={agent.id}
                  className={`glass-card p-5 border ${config.border}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{agent.avatar}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold" style={{ color: agent.color }}>
                          {agent.nameKo}
                        </h3>
                        <span className="text-xs text-gray-600">({agent.name})</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{agent.roleKo}</p>
                      <p className="text-xs text-gray-500 mt-2">{agent.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            agent.status === 'working' ? 'status-working pulse-dot' : 'status-idle'
                          }`}
                        />
                        <span className="text-[10px] text-gray-500">
                          {agent.status === 'working' ? '작업 중' : agent.status === 'reviewing' ? '검토 중' : '대기 중'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* 100 Jury Members */}
      <div className="mt-12">
        <h2 className="text-lg font-semibold mb-4">100인 AI 심사위원단</h2>
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(PERSONA_GROUP_LABELS).map(([key, info]) => (
            <span
              key={key}
              className={`text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 ${info.color}`}
            >
              {info.label} ({info.count})
            </span>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {JURY_PERSONAS.map((jury) => (
            <div
              key={jury.id}
              className="glass-card p-3 text-center hover:border-blue-500/30 transition-colors"
            >
              <span className="text-2xl">{jury.avatar}</span>
              <p className="text-xs font-medium mt-1 truncate">{jury.name}</p>
              <p className="text-[10px] text-gray-500 truncate">{jury.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
