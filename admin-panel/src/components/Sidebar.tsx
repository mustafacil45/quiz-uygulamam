'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BookOpen, Users, LogOut, Trophy } from 'lucide-react';
import { logout } from '@/services/authService';
import clsx from 'clsx';

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Quiz Yönetimi', href: '/dashboard/quizzes', icon: BookOpen },
  { name: 'Oda Yönetimi', href: '/dashboard/rooms', icon: Users },
  { name: 'Liderlik Tablosu', href: '/dashboard/leaderboard', icon: Trophy },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-blue-400 tracking-wide">TrendQuiz</h1>
        <span className="text-xs text-slate-500 uppercase tracking-wider">Admin Panel</span>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group',
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-100'
              )}
            >
              <Icon size={20} className={clsx('transition-transform group-hover:scale-110', isActive && 'scale-110')} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-700 bg-slate-800/50">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-all duration-200 group"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Çıkış Yap</span>
        </button>
      </div>
    </div>
  );
}
