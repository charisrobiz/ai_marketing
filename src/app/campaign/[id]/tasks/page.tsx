'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Clock, Play, ClipboardList } from 'lucide-react';
import { CORE_AGENTS } from '@/store/useStore';

interface AgentTask {
  id: string;
  campaign_id: string;
  agent_id: string;
  agent_name: string;
  title: string;
  description: string;
  status: string;
  result: string | null;
  created_at: string;
  completed_at: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  pending: { label: '대기', icon: Clock, color: 'text-gray-400' },
  in_progress: { label: '진행 중', icon: Play, color: 'text-blue-400' },
  completed: { label: '완료', icon: CheckCircle, color: 'text-green-400' },
};

export default function TasksPage() {
  const params = useParams();
  const campaignId = params.id as string;
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch(`/api/tasks?campaignId=${campaignId}`);
        const data = await res.json();
        setTasks(data);
      } catch { /* empty */ }
      setLoading(false);
    };
    fetchTasks();
    const interval = setInterval(fetchTasks, 3000);
    return () => clearInterval(interval);
  }, [campaignId]);

  const columns = [
    { key: 'pending', label: '대기', color: 'border-gray-500/30' },
    { key: 'in_progress', label: '진행 중', color: 'border-blue-500/30' },
    { key: 'completed', label: '완료', color: 'border-green-500/30' },
  ];

  return (
    <div className="max-w-6xl mx-auto py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/campaign/${campaignId}`} className="text-gray-500 hover:text-gray-300">
          <ArrowLeft size={18} />
        </Link>
        <ClipboardList className="w-5 h-5 text-gray-400" />
        <h1 className="text-xl font-bold">작업 보드</h1>
        <span className="text-xs text-gray-500 ml-2">{tasks.length}개 작업</span>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500 text-sm">로딩 중...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.key);
            return (
              <div key={col.key}>
                <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${col.color}`}>
                  {(() => {
                    const Cfg = STATUS_CONFIG[col.key];
                    return <Cfg.icon size={14} className={Cfg.color} />;
                  })()}
                  <h2 className="text-sm font-semibold">{col.label}</h2>
                  <span className="text-xs text-gray-500 ml-auto">{colTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {colTasks.length === 0 ? (
                    <p className="text-xs text-gray-600 text-center py-8">없음</p>
                  ) : (
                    colTasks.map((task) => {
                      const agent = CORE_AGENTS.find((a) => a.id === task.agent_id);
                      return (
                        <div key={task.id} className="glass-card p-3">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-sm">{agent?.avatar || '🤖'}</span>
                            <span className="text-xs font-medium" style={{ color: agent?.color }}>
                              {task.agent_name}
                            </span>
                          </div>
                          <h3 className="text-sm font-medium mb-1">{task.title}</h3>
                          {task.description && (
                            <p className="text-xs text-gray-500 mb-2">{task.description}</p>
                          )}
                          {task.result && (
                            <p className="text-xs text-green-400 bg-green-500/10 rounded px-2 py-1">
                              {task.result}
                            </p>
                          )}
                          <p className="text-[10px] text-gray-600 mt-2">
                            {new Date(task.created_at).toLocaleString('ko-KR')}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
