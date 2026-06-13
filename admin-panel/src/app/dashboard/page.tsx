'use client';
import { useEffect, useState } from 'react';
import api from '@/services/api';
import {
  Users,
  BookOpen,
  Activity,
  ArrowUp,
  Clock
} from 'lucide-react';


interface Stats {
  total_quizzes: number;
  active_rooms: number;
  total_users: number;
  system_status: string;
  uptime: number;
  recent_activities: {
    type: 'quiz' | 'room';
    message: string;
    time: string;
  }[];
}

function formatUptime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}s ${m}d ${s}sn`;
  if (m > 0) return `${m}d ${s}sn`;
  return `${s}sn`;
}

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds} saniye önce`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} dakika önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;
  return `${Math.floor(hours / 24)} gün önce`;
}

export default function DashboardHome() {
  const [stats, setStats] = useState<Stats | null>(null);

  const loadStats = async () => {
    try {
      const res = await api.get('/stats/');
      setStats(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 5000); // 5 saniyede bir güncelle
    return () => clearInterval(interval);
  }, []);

  if (!stats) return <div className="text-white p-8">Yükleniyor...</div>;

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">Sistem genel durum özeti ve istatistikler (Canlı Güncellenir)</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Özet Kartları */}
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm hover:border-slate-600 transition-colors shadow-xl group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider flex items-center gap-2">
              <BookOpen size={16} /> Toplam Quiz
            </h3>
            <div className="w-2 h-2 rounded-full bg-purple-500 group-hover:scale-125 transition-transform"></div>
          </div>
          <p className="text-4xl font-bold text-white">{stats.total_quizzes}</p>
          <div className="mt-4 text-xs text-slate-500">
            Sistemdeki toplam kayıtlı quiz
          </div>
        </div>

        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm hover:border-slate-600 transition-colors shadow-xl group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider flex items-center gap-2">
              <Users size={16} /> Aktif Odalar
            </h3>
            <div className="w-2 h-2 rounded-full bg-blue-500 group-hover:scale-125 transition-transform"></div>
          </div>
          <p className="text-4xl font-bold text-blue-400">{stats.active_rooms}</p>
          <div className="mt-4 text-xs text-slate-500">
            Şu an açık olan odalar
          </div>
        </div>

        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm hover:border-slate-600 transition-colors shadow-xl group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider flex items-center gap-2">
              <Users size={16} /> Kullanıcılar
            </h3>
            <div className="w-2 h-2 rounded-full bg-yellow-500 group-hover:scale-125 transition-transform"></div>
          </div>
          <p className="text-4xl font-bold text-yellow-400">{stats.total_users}</p>
          <div className="mt-4 text-xs text-slate-500">
            Toplam kayıtlı kullanıcı
          </div>
        </div>

        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-sm hover:border-slate-600 transition-colors shadow-xl group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider flex items-center gap-2">
              <Activity size={16} /> Sistem Durumu
            </h3>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          </div>
          <p className="text-4xl font-bold text-green-400">{stats.system_status}</p>
          <div className="mt-4 text-xs text-slate-500 flex items-center gap-1">
            <Clock size={12} /> Uptime: {formatUptime(stats.uptime)}
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 min-h-[300px]">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ArrowUp size={20} className="text-green-400" /> Son Aktiviteler
          </h3>
          <div className="space-y-4">
            {stats.recent_activities.length === 0 ? (
              <div className="text-slate-500 text-sm">Henüz aktivite yok.</div>
            ) : (
              stats.recent_activities.map((act, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 transition hover:bg-slate-800/80">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${act.type === 'quiz' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`}>
                    {act.type === 'quiz' ? 'Q' : 'R'}
                  </div>
                  <div>
                    <p className="text-sm text-slate-200">{act.message}</p>
                    <p className="text-xs text-slate-500">{timeAgo(act.time)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 min-h-[300px] flex flex-col items-center justify-center text-slate-500">
          {/* Placeholder for future chart */}
          <Activity size={48} className="mb-4 text-slate-700" />
          <p>Anlık Kullanıcı Grafiği</p>
          <span className="text-xs mt-2 bg-slate-800 px-2 py-1 rounded border border-slate-700">Çok Yakında</span>
        </div>
      </div>
    </div>
  );
}
