'use client';

import { useStore } from '@/store/useStore';
import { DEPARTMENT_LABELS, type Department } from '@/types';

const STATUS_LABELS: Record<string, string> = {
  idle: '대기',
  working: '작업 중',
  reviewing: '검토 중',
  completed: '완료',
};

const DEPT_ORDER: Department[] = ['pm', 'marketing', 'design', 'development'];
const DEPT_COLORS: Record<Department, string> = {
  pm: 'text-amber-400',
  marketing: 'text-red-400',
  design: 'text-purple-400',
  development: 'text-teal-400',
};

export default function AgentStatusPanel() {
  const { agents } = useStore();

  return (
    <div className="glass-card p-6">
      <h2 className="text-lg font-semibold mb-4">AI 직원 상태</h2>
      <div className="space-y-4">
        {DEPT_ORDER.map((dept) => {
          const deptAgents = agents.filter((a) => a.department === dept);
          if (deptAgents.length === 0) return null;
          return (
            <div key={dept}>
              <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${DEPT_COLORS[dept]}`}>
                {DEPARTMENT_LABELS[dept]}
              </p>
              {deptAgents.map((agent) => (
                <div key={agent.id} className="flex items-center gap-2 py-1.5">
                  <span className="text-sm">{agent.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{agent.nameKo}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        agent.status === 'working'
                          ? 'status-working pulse-dot'
                          : agent.status === 'reviewing'
                          ? 'status-reviewing pulse-dot'
                          : agent.status === 'completed'
                          ? 'bg-green-400'
                          : 'status-idle'
                      }`}
                    />
                    <span className="text-[10px] text-gray-500">{STATUS_LABELS[agent.status]}</span>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
