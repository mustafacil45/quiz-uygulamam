'use client';
import { useEffect, useState } from 'react';
import { getLeaderboard, LeaderboardEntry } from '@/services/leaderboardService';
import { Trophy, Medal } from 'lucide-react';

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getLeaderboard();
        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Trophy className="text-yellow-400" size={32} /> Liderlik Tablosu
        </h1>
        <p className="text-slate-400">En yüksek puanı toplayan kullanıcılar.</p>
      </header>

      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Yükleniyor...</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-slate-400">Henüz veri yok.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/50 text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 w-24 text-center">Sıra</th>
                  <th className="px-6 py-4">Kullanıcı</th>
                  <th className="px-6 py-4 text-right">Toplam Puan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {data.map((entry, index) => (
                  <tr 
                    key={index} 
                    className={`
                      hover:bg-slate-700/50 transition
                      ${index === 0 ? 'bg-yellow-500/10' : ''}
                      ${index === 1 ? 'bg-slate-400/10' : ''}
                      ${index === 2 ? 'bg-orange-500/10' : ''}
                    `}
                  >
                    <td className="px-6 py-4 text-center font-bold text-lg">
                      {index === 0 ? (
                        <Medal className="inline text-yellow-400" />
                      ) : index === 1 ? (
                        <Medal className="inline text-slate-300" />
                      ) : index === 2 ? (
                        <Medal className="inline text-orange-400" />
                      ) : (
                        <span className="text-slate-500">#{index + 1}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-white text-base">
                      {entry.username}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-blue-400 text-base">
                      {entry.score}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

