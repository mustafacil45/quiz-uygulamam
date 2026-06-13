'use client';
import { useEffect, useState } from 'react';
import api from '@/services/api';
import { BookOpen, Star, Search, Filter, Loader2, Edit, Trash2, Plus } from 'lucide-react';
import Link from 'next/link';
import CreateQuizModal from '@/components/CreateQuizModal';
import EditQuizModal from '@/components/EditQuizModal';

interface Quiz {
  id: number;
  title: string;
  description: string;
  room_id: number;
  is_featured: boolean;
  questions: any[];
}

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/quiz/');
      setQuizzes(res.data);
    } catch (e) {
      console.error(e);
      alert('Quizler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  const toggleFeatured = async (quiz: Quiz) => {
    try {
      // Optimistic update
      const updatedQuizzes = quizzes.map(q =>
        q.id === quiz.id ? { ...q, is_featured: !q.is_featured } : q
      );
      setQuizzes(updatedQuizzes);

      const payload = {
        title: quiz.title,
        description: quiz.description,
        room_id: quiz.room_id,
        is_featured: !quiz.is_featured,
        questions: quiz.questions.map((q: any) => ({
          text: q.text,
          choices: q.choices,
          correct_choice: q.correct_choice
        }))
      };

      await api.put(`/quiz/${quiz.id}`, payload);

    } catch (e) {
      console.error(e);
      alert('Güncelleme sırasında hata oluştu!');
      // Revert
      loadQuizzes();
    }
  };

  const deleteQuiz = async (id: number) => {
    if (!confirm('Bu quizi silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/quiz/${id}`);
      setQuizzes(quizzes.filter(q => q.id !== id));
    } catch (e) {
      console.error(e);
      alert('Silme işlemi başarısız');
    }
  }

  const handleEdit = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setIsEditModalOpen(true);
  };

  const filteredQuizzes = quizzes.filter(q =>
    q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Quiz Yönetimi</h1>
          <p className="text-slate-400">Quizleri düzenle, sil veya anasayfada öne çıkar.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Quiz ara..."
              className="bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 w-full md:w-64 transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition flex items-center gap-2"
          >
            <Plus size={18} /> Yeni Quiz
          </button>
        </div>
      </header>

      <CreateQuizModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadQuizzes}
      />

      <EditQuizModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={loadQuizzes}
        quiz={selectedQuiz}
      />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-blue-500" size={40} />
        </div>
      ) : (
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden backdrop-blur-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-800/80 text-slate-400 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium">Başlık</th>
                <th className="p-4 font-medium text-center">Soru Sayısı</th>
                <th className="p-4 font-medium text-center">Öne Çıkan</th>
                <th className="p-4 font-medium text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredQuizzes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    {searchTerm ? 'Aramanızla eşleşen quiz bulunamadı.' : 'Henüz hiç quiz oluşturulmamış.'}
                  </td>
                </tr>
              ) : (
                filteredQuizzes.map((quiz) => (
                  <tr key={quiz.id} className="hover:bg-slate-700/20 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                          <BookOpen size={20} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-200">{quiz.title}</h3>
                          <p className="text-xs text-slate-500 line-clamp-1">{quiz.description || 'Açıklama yok'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-300">
                        {quiz.questions?.length || 0}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => toggleFeatured(quiz)}
                        className={`p-2 rounded-full transition-all duration-300 ${quiz.is_featured ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : 'bg-slate-700/50 text-slate-600 hover:bg-slate-700 hover:text-slate-400'}`}
                        title={quiz.is_featured ? "Anasayfadan kaldır" : "Anasayfada göster"}
                      >
                        <Star size={18} fill={quiz.is_featured ? "currentColor" : "none"} />
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(quiz)}
                          className="p-2 hover:bg-blue-500/20 hover:text-blue-400 rounded-lg transition-colors" title="Düzenle">
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => deleteQuiz(quiz.id)}
                          className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors"
                          title="Sil"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
