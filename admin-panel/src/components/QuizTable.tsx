'use client';
import { Trash2, Edit } from 'lucide-react';
import { Quiz } from '@/services/quizService';

interface Props {
  quizzes: Quiz[];
  onDelete: (id: number) => void;
  onEdit: (quiz: Quiz) => void;
}

export default function QuizTable({ quizzes, onDelete, onEdit }: Props) {
  return (
    <div className="overflow-x-auto bg-slate-800 rounded-lg border border-slate-700">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="bg-slate-900 text-slate-400 uppercase">
          <tr>
            <th className="px-6 py-4">ID</th>
            <th className="px-6 py-4">Başlık</th>
            <th className="px-6 py-4">Açıklama</th>
            <th className="px-6 py-4">Soru Sayısı</th>
            <th className="px-6 py-4 text-right">İşlemler</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {quizzes.map((quiz) => (
            <tr key={quiz.id} className="hover:bg-slate-700/50 transition">
              <td className="px-6 py-4 text-slate-500">#{quiz.id}</td>
              <td className="px-6 py-4 font-medium text-slate-200">{quiz.title}</td>
              <td className="px-6 py-4 text-slate-400">{quiz.description}</td>
              <td className="px-6 py-4 text-slate-300">{quiz.questions?.length || 0}</td>
              <td className="px-6 py-4 text-right space-x-2">
                <button 
                  onClick={() => onEdit(quiz)}
                  className="p-2 text-blue-400 hover:bg-blue-500/20 rounded"
                >
                  <Edit size={18} />
                </button>
                <button 
                  onClick={() => onDelete(quiz.id)}
                  className="p-2 text-red-400 hover:bg-red-500/20 rounded"
                >
                  <Trash2 size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
