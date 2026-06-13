'use client';
import { useState, useEffect } from 'react';
import api from '@/services/api';
import { X, Users, RefreshCw, Edit, Trash2 } from 'lucide-react';
import EditQuizModal from './EditQuizModal';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    room: any | null;
}

export default function RoomDetailModal({ isOpen, onClose, room }: Props) {
    const [participants, setParticipants] = useState<any[]>([]);
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Edit logic
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedQuiz, setSelectedQuiz] = useState<any | null>(null);

    const loadData = async () => {
        if (!room) return;
        setLoading(true);
        try {
            const [resParts, resQuizzes] = await Promise.all([
                api.get(`/rooms/${room.id}/participants`),
                api.get(`/quiz/`, { params: { room_id: room.id } })
            ]);
            setParticipants(resParts.data);
            setQuizzes(resQuizzes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && room) {
            loadData();
            // Poll every 3 seconds for updates
            const interval = setInterval(loadData, 3000);
            return () => clearInterval(interval);
        }
    }, [isOpen, room]);

    const deleteQuiz = async (id: number) => {
        if (!confirm('Bu quizi silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/quiz/${id}`);
            // Optimistically update or just reload
            setQuizzes(quizzes.filter(q => q.id !== id));
        } catch (e) {
            console.error(e);
            alert('Silme sırasında hata oluştu');
        }
    };

    const handleEdit = (quiz: any) => {
        setSelectedQuiz(quiz);
        setIsEditModalOpen(true);
    };

    if (!isOpen || !room) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-slate-900 w-full max-w-4xl rounded-xl border border-slate-700 shadow-2xl">
                    <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900 rounded-t-xl">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-white">{room.name}</h2>
                            <span className={`text-xs px-2 py-1 rounded ${room.is_private ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                                {room.is_private ? 'Özel' : 'Genel'}
                            </span>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24} /></button>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Participants Section */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Users size={20} className="text-blue-400" />
                                    Katılımcılar ({participants.length})
                                </h3>
                                <button
                                    onClick={loadData}
                                    className={`text-slate-400 hover:text-white transition ${loading ? 'animate-spin' : ''}`}
                                >
                                    <RefreshCw size={18} />
                                </button>
                            </div>

                            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden min-h-[200px] max-h-[300px] overflow-y-auto">
                                {loading && participants.length === 0 ? (
                                    <div className="flex items-center justify-center h-[200px] text-slate-500">Yükleniyor...</div>
                                ) : participants.length === 0 ? (
                                    <div className="flex items-center justify-center h-[200px] text-slate-500 flex-col gap-2">
                                        <Users size={32} className="opacity-50" />
                                        <p>Şu an odada kimse yok.</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left text-sm text-slate-300">
                                        <thead className="bg-slate-900/50 text-slate-400 uppercase sticky top-0">
                                            <tr>
                                                <th className="px-4 py-2">Kullanıcı</th>
                                                <th className="px-4 py-2 text-right">ID</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700">
                                            {participants.map((p, i) => (
                                                <tr key={i} className="hover:bg-slate-700/30">
                                                    <td className="px-4 py-2 font-medium text-white">
                                                        {p.username || 'Misafir'}
                                                    </td>
                                                    <td className="px-4 py-2 text-slate-500 text-right">
                                                        {p.id ? `#${p.id}` : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>

                        {/* Quizzes Section */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Users size={20} className="text-purple-400" /> {/* Reuse Icon or different one */}
                                    Oda Quizleri ({quizzes.length})
                                </h3>
                            </div>

                            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden min-h-[200px] max-h-[300px] overflow-y-auto">
                                {(!quizzes || quizzes.length === 0) ? (
                                    <div className="flex items-center justify-center h-[200px] text-slate-500 flex-col gap-2">
                                        <Users size={32} className="opacity-50" />
                                        <p>Bu odada quiz yok.</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left text-sm text-slate-300">
                                        <thead className="bg-slate-900/50 text-slate-400 uppercase sticky top-0">
                                            <tr>
                                                <th className="px-4 py-2">Başlık</th>
                                                <th className="px-4 py-2 text-center">Soru</th>
                                                <th className="px-4 py-2 text-right">İşlem</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700">
                                            {quizzes.map((q: any, i: number) => (
                                                <tr key={i} className="hover:bg-slate-700/30">
                                                    <td className="px-4 py-2 font-medium text-white">
                                                        {q.title}
                                                    </td>
                                                    <td className="px-4 py-2 text-center text-slate-500">
                                                        {q.questions ? q.questions.length : (q.questions_count || '-')}
                                                    </td>
                                                    <td className="px-4 py-2 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button
                                                                onClick={() => handleEdit(q)}
                                                                className="p-1.5 hover:bg-blue-500/20 hover:text-blue-400 rounded transition"
                                                            >
                                                                <Edit size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => deleteQuiz(q.id)}
                                                                className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded transition"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-slate-700 bg-slate-800/50 rounded-b-xl flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition"
                        >
                            Kapat
                        </button>
                    </div>
                </div>
            </div>

            <EditQuizModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={loadData}
                quiz={selectedQuiz}
            />
        </>
    );
}
