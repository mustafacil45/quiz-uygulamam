'use client';
import { useState, useEffect } from 'react';
import { updateQuiz, Quiz, Question } from '@/services/quizService';
import api from '@/services/api';
import { X, Plus, Trash } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  quiz: Quiz | null;
}

export default function EditQuizModal({ isOpen, onClose, onSuccess, quiz }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [roomId, setRoomId] = useState<number | null>(null);
  const [isRetakeable, setIsRetakeable] = useState(false);
  const [scoringMode, setScoringMode] = useState('first_score');
  const [rooms, setRooms] = useState<any[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    if (isOpen && quiz) {
        api.get('/rooms/').then(res => setRooms(res.data)).catch(console.error);
        setTitle(quiz.title);
        setDescription(quiz.description);
        setRoomId(quiz.room_id || null);
        setIsRetakeable((quiz as any).is_retakeable || false);
        setScoringMode((quiz as any).scoring_mode || 'first_score');
        setQuestions(quiz.questions || []);
    }
  }, [isOpen, quiz]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { text: '', choices: ['', '', '', ''], correct_choice: 0 }
    ]);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const updateChoice = (qIndex: number, cIndex: number, value: string) => {
    const newQuestions = [...questions];
    const newChoices = [...newQuestions[qIndex].choices];
    newChoices[cIndex] = value;
    newQuestions[qIndex].choices = newChoices;
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const [uploadingImageFor, setUploadingImageFor] = useState<number | null>(null);

  const handleImageUpload = async (qIndex: number, file: File) => {
    try {
      setUploadingImageFor(qIndex);
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      updateQuestion(qIndex, 'image_url', res.data.url);
    } catch (err) {
      console.error(err);
      alert('Resim yüklenemedi');
    } finally {
      setUploadingImageFor(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quiz) return;
    
    try {
      await updateQuiz(quiz.id, {
        title,
        description,
        room_id: roomId as any,
        is_featured: (quiz as any).is_featured ?? false,
        is_retakeable: isRetakeable,
        scoring_mode: scoringMode,
        questions
      });
      onSuccess();
      onClose();
    } catch (err) {
      alert('Quiz güncellenirken hata oluştu');
      console.error(err);
    }
  };

  if (!isOpen || !quiz) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 p-2 md:p-4 overflow-y-auto flex justify-center items-start">
      <div className="bg-slate-900 w-full max-w-4xl mx-auto rounded-xl border border-slate-700 shadow-2xl my-4 md:my-8 flex flex-col">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-900 rounded-t-xl z-20">
          <h2 className="text-xl font-bold text-white">Quiz Düzenle: {quiz.title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Quiz Başlığı</label>
              <input 
                type="text" 
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Oda Seçimi</label>
              <select 
                value={roomId === null ? 'homepage' : roomId}
                onChange={e => {
                  const val = e.target.value;
                  if (val === 'homepage') {
                    setRoomId(null);
                  } else {
                    setRoomId(Number(val));
                  }
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="homepage">🏠 Anasayfa (Genel)</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.is_private ? 'Özel' : 'Genel'})</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1">Açıklama</label>
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                rows={2}
              />
            </div>

            {/* Tekrar Çözülebilirlik Seçeneği */}
            <div className="md:col-span-2 bg-slate-800/30 border border-slate-700/50 p-4 rounded-lg space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="retakeable"
                  checked={isRetakeable}
                  onChange={e => setIsRetakeable(e.target.checked)}
                  className="accent-blue-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="retakeable" className="text-sm font-medium text-slate-300 cursor-pointer flex-1">
                  ✓ Quizi Tekrar Çözülebilir Yap
                </label>
              </div>

              {isRetakeable && (
                <div className="pl-7 space-y-3 border-l-2 border-blue-500/50">
                  <label className="block text-sm font-medium text-slate-400">Puanlama Modu:</label>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="scoringMode"
                        value="first_score"
                        checked={scoringMode === 'first_score'}
                        onChange={e => setScoringMode(e.target.value)}
                        className="accent-green-500"
                      />
                      <span className="text-sm text-slate-300">📍 İlk Çözülen Puan (First Score)</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="scoringMode"
                        value="best_score"
                        checked={scoringMode === 'best_score'}
                        onChange={e => setScoringMode(e.target.value)}
                        className="accent-green-500"
                      />
                      <span className="text-sm text-slate-300">🏆 En Yüksek Puan (Best Score)</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-700 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Sorular</h3>
              <button 
                type="button" 
                onClick={addQuestion}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded flex items-center gap-2 text-sm"
              >
                <Plus size={16} /> Soru Ekle
              </button>
            </div>

            <div className="space-y-6">
              {questions.map((q, qIndex) => (
                <div key={qIndex} className="bg-slate-800 p-4 rounded-lg border border-slate-700 relative group">
                  <button 
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                    className="absolute top-2 right-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash size={18} />
                  </button>
                  
                  <div className="mb-4 pr-8">
                    <label className="block text-xs text-slate-400 mb-1">Soru Metni</label>
                    <input 
                      type="text" 
                      required
                      value={q.text}
                      onChange={e => updateQuestion(qIndex, 'text', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm"
                      placeholder="Soru metnini giriniz..."
                    />
                    
                    {/* Image Upload */}
                    <div className="mt-3 flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        id={`editQImage-${qIndex}`}
                        className="hidden"
                        onChange={e => {
                          if (e.target.files?.[0]) {
                            handleImageUpload(qIndex, e.target.files[0]);
                          }
                        }}
                      />
                      <label htmlFor={`editQImage-${qIndex}`} className="cursor-pointer px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white transition flex items-center gap-1">
                        {uploadingImageFor === qIndex ? 'Yükleniyor...' : 'Görsel Ekle / Değiştir'}
                      </label>
                      {q.image_url && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-green-400 truncate max-w-[150px]">Görsel mevcut</span>
                          <img src={`${api.defaults.baseURL}${q.image_url}`} alt="Q" className="h-8 w-8 object-cover rounded border border-slate-600" />
                          <button type="button" onClick={() => updateQuestion(qIndex, 'image_url', null)} className="text-red-400 hover:text-red-300 text-xs ml-1">
                            Kaldır
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.choices.map((choice, cIndex) => (
                      <div key={cIndex} className="flex items-center gap-2">
                        <input 
                          type="radio"
                          name={`correct-${qIndex}`}
                          checked={q.correct_choice === cIndex}
                          onChange={() => updateQuestion(qIndex, 'correct_choice', cIndex)}
                          className="accent-blue-500"
                        />
                        <input 
                          type="text"
                          required
                          value={choice}
                          onChange={e => updateChoice(qIndex, cIndex, e.target.value)}
                          className={`flex-1 bg-slate-900 border ${q.correct_choice === cIndex ? 'border-blue-500/50' : 'border-slate-700'} rounded px-2 py-1.5 text-white text-sm`}
                          placeholder={`Seçenek ${cIndex + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {questions.length === 0 && (
                <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-700 rounded-lg">
                  Henüz soru eklenmemiş.
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-slate-300 hover:text-white transition"
            >
              İptal
            </button>
            <button 
              type="submit" 
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-medium transition"
            >
              Güncelle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

