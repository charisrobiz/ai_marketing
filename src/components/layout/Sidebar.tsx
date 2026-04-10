'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Plus,
  Users,
  Settings,
  Zap,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  Home,
  Library,
} from 'lucide-react';
import { useStore, CORE_AGENTS } from '@/store/useStore';

const NAV_ITEMS = [
  { href: '/', label: '홈', labelEn: 'Home', icon: Home },
  { href: '/dashboard', label: '대시보드', labelEn: 'Dashboard', icon: LayoutDashboard },
  { href: '/campaign/new', label: '새 캠페인', labelEn: 'New Campaign', icon: Plus },
  { href: '/campaigns', label: '캠페인 목록', labelEn: 'Campaigns', icon: FolderOpen },
  { href: '/benchmarks', label: '벤치마크', labelEn: 'Benchmarks', icon: Library },
  { href: '/agents', label: 'AI 직원', labelEn: 'AI Agents', icon: Users },
  { href: '/admin', label: '관리자', labelEn: 'Admin', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, agents } = useStore();

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-40 transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-20'
      }`}
      style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)' }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 h-16">
        {sidebarOpen && (
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Zap className="w-6 h-6 text-blue-400" />
            <span className="font-bold text-lg gradient-text">AutoGrowth</span>
          </Link>
        )}
        {!sidebarOpen && (
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Zap className="w-5 h-5 text-blue-400" />
          </Link>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
        >
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-4 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive
                  ? 'bg-blue-500/10 text-blue-400'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              <item.icon size={20} />
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Agent Status */}
      {sidebarOpen && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t overflow-y-auto" style={{ borderColor: 'var(--border-color)', maxHeight: '320px' }}>
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">AI 직원 ({agents.length}명)</p>
          {agents.map((agent) => (
            <div key={agent.id} className="flex items-center gap-2 mb-1.5">
              <span className="text-sm">{agent.avatar}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{agent.nameKo}</p>
              </div>
              <div
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  agent.status === 'working'
                    ? 'status-working pulse-dot'
                    : agent.status === 'reviewing'
                    ? 'status-reviewing pulse-dot'
                    : 'status-idle'
                }`}
              />
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
