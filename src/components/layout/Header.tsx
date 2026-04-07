'use client';

import { useState, useEffect } from 'react';
import { Bell, Search, LogOut } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/components/auth/AuthProvider';

export default function Header() {
  const { sidebarOpen, liveEvents } = useStore();
  const { user, signOut } = useAuth();
  const [recentCount, setRecentCount] = useState(0);

  useEffect(() => {
    setRecentCount(
      liveEvents.filter((e) => Date.now() - new Date(e.timestamp).getTime() < 60000).length
    );
  }, [liveEvents]);

  return (
    <header
      className={`fixed top-0 right-0 h-16 z-30 flex items-center justify-between px-6 transition-all duration-300 ${
        sidebarOpen ? 'left-64' : 'left-20'
      }`}
      style={{
        background: 'rgba(10, 10, 15, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="검색..."
            className="pl-10 pr-4 py-2 rounded-lg text-sm bg-white/5 border border-white/10 focus:border-blue-500/50 focus:outline-none transition-colors w-64"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
          <Bell size={20} className="text-gray-400" />
          {recentCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">
              {recentCount}
            </span>
          )}
        </button>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
          <span className="text-sm">👑</span>
          <span className="text-sm font-medium truncate max-w-[140px]">
            {user?.email || 'CEO'}
          </span>
        </div>
        <button
          onClick={signOut}
          className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
          title="로그아웃"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
