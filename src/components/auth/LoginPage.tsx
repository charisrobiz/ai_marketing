'use client';

import { useState } from 'react';
import { supabase } from '@/lib/db/supabase';
import { Zap, Mail, Lock, AlertCircle, UserPlus, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSignupSuccess(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '오류가 발생했습니다';
      if (message.includes('Invalid login')) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else if (message.includes('already registered')) {
        setError('이미 등록된 이메일입니다.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (signupSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-4">
        <div className="w-full max-w-md">
          <div className="glass-card p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">이메일을 확인해주세요</h2>
            <p className="text-gray-400 text-sm mb-6">
              <span className="text-white font-medium">{email}</span>로 인증 메일을 발송했습니다.
              <br />메일의 링크를 클릭하면 가입이 완료됩니다.
            </p>
            <button
              onClick={() => { setSignupSuccess(false); setMode('login'); }}
              className="text-blue-400 text-sm hover:underline"
            >
              로그인으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              AutoGrowth
            </span>
          </div>
          <p className="text-gray-500 text-sm">AI 마케팅 자동화 플랫폼</p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8">
          <h2 className="text-lg font-bold mb-1">
            {mode === 'login' ? '관리자 로그인' : '관리자 계정 생성'}
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            {mode === 'login'
              ? '계정 정보를 입력하여 로그인하세요.'
              : '새 관리자 계정을 생성합니다.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">이메일</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">비밀번호</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? '6자 이상 입력' : '••••••••'}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 px-3 py-2 rounded-lg">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium hover:from-blue-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : mode === 'login' ? (
                <>
                  <LogIn size={16} />
                  로그인
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  계정 생성
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            {mode === 'login' ? (
              <p className="text-gray-500 text-sm">
                계정이 없으신가요?{' '}
                <button onClick={() => { setMode('signup'); setError(''); }} className="text-blue-400 hover:underline">
                  계정 생성
                </button>
              </p>
            ) : (
              <p className="text-gray-500 text-sm">
                이미 계정이 있으신가요?{' '}
                <button onClick={() => { setMode('login'); setError(''); }} className="text-blue-400 hover:underline">
                  로그인
                </button>
              </p>
            )}
          </div>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          AutoGrowth Engine v1.0 &middot; AI Marketing Platform
        </p>
      </div>
    </div>
  );
}
