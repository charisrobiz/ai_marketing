'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { JURY_PERSONAS } from '@/data/juryPersonas';
import { Users, Plus, Pencil, Trash2, X, Check, Calendar } from 'lucide-react';
import { DEPARTMENT_LABELS, type Department, type Agent } from '@/types';

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

const AVATAR_OPTIONS = ['👩‍💼', '👨‍💻', '📊', '🔍', '📈', '🎨', '🎬', '🔬', '💡', '🚀', '⚡', '🎯', '📝', '🧠', '🔧', '📱', '🌐', '🎙️', '📸', '🛡️'];
const COLOR_OPTIONS = ['#FF6B6B', '#F59E0B', '#4ECDC4', '#A78BFA', '#F472B6', '#EF4444', '#8B5CF6', '#06B6D4', '#10B981', '#6366F1'];

const EMPTY_AGENT: Omit<Agent, 'id'> = {
  name: '',
  nameKo: '',
  role: '',
  roleKo: '',
  department: 'marketing',
  description: '',
  avatar: '💡',
  color: '#6366F1',
  gradient: 'from-indigo-500 to-blue-500',
  status: 'idle',
  hireDate: new Date().toISOString().slice(0, 10),
};

function daysSince(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function AgentsPage() {
  const { agents, addAgent, updateAgent, removeAgent } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Agent, 'id'>>(EMPTY_AGENT);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_AGENT, hireDate: new Date().toISOString().slice(0, 10) });
    setShowModal(true);
  };

  const openEdit = (agent: Agent) => {
    setEditingId(agent.id);
    setForm({
      name: agent.name,
      nameKo: agent.nameKo,
      role: agent.role,
      roleKo: agent.roleKo,
      department: agent.department,
      description: agent.description,
      avatar: agent.avatar,
      color: agent.color,
      gradient: agent.gradient,
      status: agent.status,
      hireDate: agent.hireDate,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.nameKo || !form.roleKo) return;

    if (editingId) {
      updateAgent(editingId, form);
    } else {
      const newAgent: Agent = {
        ...form,
        id: crypto.randomUUID(),
        status: 'idle',
      };
      addAgent(newAgent);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    removeAgent(id);
    setDeleteConfirm(null);
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-gray-400" />
          <div>
            <h1 className="text-2xl font-bold">AI 직원</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              핵심 에이전트 {agents.length}명 + 100인 AI 심사위원단
            </p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors"
        >
          <Plus size={16} /> 직원 추가
        </button>
      </div>

      {/* Core Agents by Department */}
      {DEPT_ORDER.map((dept) => {
        const deptAgents = agents.filter((a) => a.department === dept);
        const config = DEPT_CONFIG[dept];
        if (deptAgents.length === 0) return null;
        return (
          <div key={dept} className="mb-8">
            <h2 className={`text-sm font-semibold mb-3 ${config.color} uppercase tracking-wider`}>
              {DEPARTMENT_LABELS[dept]} ({deptAgents.length}명)
            </h2>
            <div className={`grid gap-3 ${dept === 'pm' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
              {deptAgents.map((agent) => (
                <div
                  key={agent.id}
                  className={`glass-card p-5 border ${config.border} group relative`}
                >
                  {/* Edit/Delete buttons */}
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(agent)}
                      className="p-1.5 rounded-md hover:bg-white/10 text-gray-500 hover:text-blue-400 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    {deleteConfirm === agent.id ? (
                      <button
                        onClick={() => handleDelete(agent.id)}
                        className="p-1.5 rounded-md bg-red-500/20 text-red-400"
                      >
                        <Check size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(agent.id)}
                        className="p-1.5 rounded-md hover:bg-white/10 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

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
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              agent.status === 'working' ? 'status-working pulse-dot' : 'status-idle'
                            }`}
                          />
                          <span className="text-[10px] text-gray-500">
                            {agent.status === 'working' ? '작업 중' : agent.status === 'reviewing' ? '검토 중' : '대기 중'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-gray-600">
                          <Calendar size={10} />
                          <span>입사 {daysSince(agent.hireDate)}일</span>
                          <span className="text-gray-700">({agent.hireDate})</span>
                        </div>
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">
                {editingId ? '직원 정보 수정' : '새 직원 추가'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-white/10 rounded">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Avatar & Color */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">아바타</label>
                  <div className="flex flex-wrap gap-1.5">
                    {AVATAR_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setForm({ ...form, avatar: emoji })}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
                          form.avatar === emoji ? 'bg-blue-500/20 border border-blue-500' : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">테마 색상</label>
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setForm({ ...form, color: c })}
                        className={`w-7 h-7 rounded-full transition-all ${
                          form.color === c ? 'ring-2 ring-white scale-110' : 'hover:scale-105'
                        }`}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Names */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">한글 이름 *</label>
                  <input
                    value={form.nameKo}
                    onChange={(e) => setForm({ ...form, nameKo: e.target.value })}
                    placeholder="예: 서현"
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">영문 이름</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="예: Seohyun"
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none text-sm"
                  />
                </div>
              </div>

              {/* Role */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">직책 (한글) *</label>
                  <input
                    value={form.roleKo}
                    onChange={(e) => setForm({ ...form, roleKo: e.target.value })}
                    placeholder="예: 콘텐츠 마케터"
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">직책 (영문)</label>
                  <input
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    placeholder="예: Content Marketer"
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none text-sm"
                  />
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">부서</label>
                <div className="grid grid-cols-4 gap-2">
                  {DEPT_ORDER.map((dept) => (
                    <button
                      key={dept}
                      onClick={() => setForm({ ...form, department: dept })}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        form.department === dept
                          ? 'bg-blue-500/20 border border-blue-500 text-blue-400'
                          : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {DEPARTMENT_LABELS[dept]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">업무 설명</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="이 직원이 담당하는 주요 업무를 설명하세요."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none text-sm resize-none"
                />
              </div>

              {/* Hire Date */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">입사일</label>
                <input
                  type="date"
                  value={form.hireDate}
                  onChange={(e) => setForm({ ...form, hireDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none text-sm"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-[10px] text-gray-500 mb-2">미리보기</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{form.avatar}</span>
                <div>
                  <p className="font-bold text-sm" style={{ color: form.color }}>
                    {form.nameKo || '이름'} <span className="text-xs text-gray-600">({form.name || 'Name'})</span>
                  </p>
                  <p className="text-xs text-gray-400">{form.roleKo || '직책'} &middot; {DEPARTMENT_LABELS[form.department]}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-gray-400 text-sm hover:bg-white/5 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={!form.nameKo || !form.roleKo}
                className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 disabled:opacity-30 transition-colors"
              >
                {editingId ? '수정 완료' : '직원 추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
