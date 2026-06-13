'use client';
import { useEffect, useState } from 'react';
import api from '@/services/api';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface Result {
    id: number;
    user_id: number;
    username: string;
    quiz_title: string;
    score: number;
    created_at: string;
    answers: string; // JSON string
}

export default function ResultsPage() {
    const [results, setResults] = useState<Result[]>([]);
    const [loading, setLoading] = useState(true);

    const loadResults = async () => {
        try {
            const res = await api.get('/quiz/results');
            setResults(res.data);
        } catch (e) {
            console.error("Failed to load results", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadResults();
        const interval = setInterval(loadResults, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8 text-white">Kullanıcı Sonuçları</h1>

            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                {loading && results.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">Sonuçlar yükleniyor...</div>
                ) : results.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">Henüz hiç quiz çözülmedi.</div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-slate-900/50 text-slate-400 uppercase text-sm">
                            <tr>
                                <th className="px-6 py-4">Kullanıcı</th>
                                <th className="px-6 py-4">Quiz</th>
                                <th className="px-6 py-4">Puan</th>
                                <th className="px-6 py-4">Tarih</th>
                                <th className="px-6 py-4">Detay</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700 text-slate-300">
                            {results.map((r) => (
                                <tr key={r.id} className="hover:bg-slate-700/30 transition">
                                    <td className="px-6 py-4 font-medium text-white">{r.username}</td>
                                    <td className="px-6 py-4">{r.quiz_title}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-sm font-bold">
                                            {r.score}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {new Date(r.created_at).toLocaleString('tr-TR')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded transition">
                                            İncele
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
