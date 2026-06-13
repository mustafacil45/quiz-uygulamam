'use client';
import { useState } from 'react';
import { login } from '@/services/authService';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    try {
      await login(username, password);
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.detail || 'Giriş başarısız. Sunucuya ulaşılamıyor veya bilgiler yanlış.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100">
      <div className="bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-700">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 p-3 rounded-full">
            <Lock className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center mb-6">Admin Panel Giriş</h2>
        
        {error && <div className="bg-red-500/20 text-red-200 p-3 rounded mb-4 text-sm border border-red-500/50">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-400">Kullanıcı Adı</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 bg-slate-900 border border-slate-600 rounded focus:ring-2 focus:ring-blue-500 outline-none transition text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-400">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-slate-900 border border-slate-600 rounded focus:ring-2 focus:ring-blue-500 outline-none transition text-white"
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded font-bold transition text-white shadow-lg hover:shadow-blue-600/20">
            Giriş Yap
          </button>
        </form>
      </div>
    </div>
  );
}
