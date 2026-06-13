'use client';
import { useState, useEffect } from 'react';
import api from '@/services/api';
import { X, Plus, Trash, Check, Save } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface QuestionDraft {
  text: string;
  image_url?: string;
  choices: string[];
  correct_choice: number;
}

export default function CreateQuizModal({ isOpen, onClose, onSuccess }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [roomId, setRoomId] = useState<number | null>(null);
  const [isFeatured, setIsFeatured] = useState(false);

  const [rooms, setRooms] = useState<any[]>([]);

  const [questions, setQuestions] = useState<QuestionDraft[]>([]);

  // Current question being added
  const [qText, setQText] = useState('');
  const [qChoices, setQChoices] = useState(['', '', '', '']); // Default 4 choices
  const [qCorrect, setQCorrect] = useState(0);
  const [qImageUrl, setQImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.get('/rooms/').then(res => setRooms(res.data)).catch(console.error);
    }
  }, [isOpen]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setQImageUrl(res.data.url);
    } catch (err) {
      console.error(err);
      alert('Resim yüklenemedi');
    } finally {
      setUploadingImage(false);
    }
  };

  const addQuestion = () => {
    if (!qText.trim()) return alert('Soru metni giriniz');
    if (qChoices.some(c => !c.trim())) return alert('Tüm şıklar dolu olmalı');

    setQuestions([...questions, {
      text: qText,
      image_url: qImageUrl || undefined,
      choices: [...qChoices],
      correct_choice: qCorrect
    }]);

    // Reset form
    setQText('');
    setQChoices(['', '', '', '']);
    setQCorrect(0);
    setQImageUrl(null);
  };

  const removeQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!title.trim()) return alert('Başlık gerekli');
    if (questions.length === 0) return alert('En az 1 soru ekleyin');

    try {
      await api.post('/quiz/', {
        title,
        description,
        room_id: roomId,
        is_featured: isFeatured,
        questions
      });
      alert('Quiz oluşturuldu!');
      onSuccess();
      onClose();
      // Reset all
      setTitle('');
      setDescription('');
      setRoomId(null);
      setQuestions([]);
    } catch (e) {
      console.error(e);
      alert('Oluşturulurken hata oluştu.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 w-full max-w-4xl rounded-xl border border-slate-700 shadow-2xl my-8 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900 rounded-t-xl shrink-0">
          <h2 className="text-xl font-bold text-white">Yeni Quiz Oluştur</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24} /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Quiz Başlığı</label>
                <input
                  type="text"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Örn: React Temelleri"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Açıklama</label>
                <textarea
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none h-24 resize-none"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Quiz hakkında kısa bilgi..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Oda Atama (İsteğe bağlı)</label>
                <select
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                  value={roomId || ''}
                  onChange={e => setRoomId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Genel (Atanmamış)</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Question Builder */}
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
              <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
                <Plus size={16} className="text-green-400" /> Soru Ekle
              </h3>

              <div className="space-y-3">
                <input
                  type="text"
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white"
                  placeholder="Soru metni..."
                  value={qText}
                  onChange={e => setQText(e.target.value)}
                />

                {/* Image Upload */}
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    id="qImage"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <label htmlFor="qImage" className="cursor-pointer px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white transition flex items-center gap-1">
                    {uploadingImage ? 'Yükleniyor...' : 'Görsel Ekle'}
                  </label>
                  {qImageUrl && <span className="text-xs text-green-400 truncate max-w-[150px]">Görsel eklendi</span>}
                </div>

                <div className="space-y-2">
                  {qChoices.map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correct"
                        checked={qCorrect === i}
                        onChange={() => setQCorrect(i)}
                        className="accent-green-500"
                      />
                      <input
                        type="text"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white"
                        placeholder={`Seçenek ${i + 1}`}
                        value={c}
                        onChange={e => {
                          const newChoices = [...qChoices];
                          newChoices[i] = e.target.value;
                          setQChoices(newChoices);
                        }}
                      />
                    </div>
                  ))}
                </div>

                <button
                  onClick={addQuestion}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition"
                >
                  Soruyu Listeye Ekle
                </button>
              </div>
            </div>
          </div>

          {/* Added Questions List */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Eklenen Sorular ({questions.length})</h3>
            {questions.length === 0 ? (
              <div className="text-center p-8 border-2 border-dashed border-slate-700 rounded-xl text-slate-500">
                Henüz soru eklenmedi.
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <div key={idx} className="bg-slate-800 p-4 rounded-lg flex justify-between items-start group">
                    <div>
                      {q.image_url && (
                        <img src={`${api.defaults.baseURL}${q.image_url}`} alt="Q" className="w-20 h-20 object-cover rounded mb-2 border border-slate-600" />
                      )}
                      <p className="text-white font-medium">{idx + 1}. {q.text}</p>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {q.choices.map((c, i) => (
                          <span key={i} className={`text-xs px-2 py-1 rounded ${i === q.correct_choice ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-slate-700 text-slate-400'}`}>
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => removeQuestion(idx)} className="text-slate-500 hover:text-red-400 transition">
                      <Trash size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-700 bg-slate-800/50 rounded-b-xl flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition flex items-center gap-2"
          >
            <Save size={18} />
            Quizi Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
