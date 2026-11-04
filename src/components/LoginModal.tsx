import React, { useState } from 'react';
import { AuthUser } from '../types';
import { KeyRound, User, Lock, AlertCircle, ShieldAlert, Bike, ShieldCheck } from 'lucide-react';

interface LoginModalProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError('Login va parolni kiriting!');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Login yoki parol noto\'g\'ri! Kirish rad etildi.');
        setLoading(false);
        return;
      }

      onLoginSuccess(data.user);
    } catch (err) {
      setError('Server bilan bog\'lanishda xatolik yuz berdi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1115]/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-[#1C2128] border border-[#2D333D] rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 bg-[#16191F] border-b border-[#2D333D] text-center relative">
          <div className="mx-auto w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white mb-3 shadow-lg shadow-indigo-500/20">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-white">Tizimga Kirish</h2>
          <p className="text-xs text-slate-400 mt-1">
            Sayt faqat Admin va Kuryerlar uchun mo'ljallangan
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start space-x-3 text-rose-400 text-xs">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Kirish Taqiqlangan</p>
                <p className="mt-0.5 opacity-90">{error}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Foydalanuvchi nomi (Username)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="masalan: admin yoki kuryer_101"
                className="w-full bg-[#0F1115] border border-[#2D333D] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#E2E8F0] placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Maxfiy Parol
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0F1115] border border-[#2D333D] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#E2E8F0] placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Tekshirilmoqda...</span>
            ) : (
              <>
                <span>Kirish</span>
                <KeyRound className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Quick info badges */}
          <div className="pt-3 border-t border-[#2D333D] flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Admin: env</span>
            </div>
            <div className="flex items-center space-x-1">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>Ofitsiant: ofitsiant123</span>
            </div>
            <div className="flex items-center space-x-1">
              <Bike className="w-3.5 h-3.5 text-emerald-400" />
              <span>Kuryer</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
