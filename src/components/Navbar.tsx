import React from 'react';
import { AuthUser } from '../types';
import { LogOut, ShieldCheck, Bike, Sparkles } from 'lucide-react';

interface NavbarProps {
  authUser: AuthUser | null;
  onLogout: () => void;
  onCourierStatusToggle?: (isOnline: boolean) => void;
  isCourierOnline?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  authUser,
  onLogout,
  onCourierStatusToggle,
  isCourierOnline,
}) => {
  return (
    <header className="bg-[#16191F] border-b border-[#2D333D] sticky top-0 z-40 backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">
            ⚡
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
              TEZLAZZAT
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono border border-indigo-500/20">
                PRO
              </span>
            </h1>
            <p className="text-xs text-slate-400">Admin & Kuryer Boshqaruv Portali</p>
          </div>
        </div>

        {/* User Info & Actions */}
        {authUser ? (
          <div className="flex items-center space-x-3 sm:space-x-4">
            {authUser.role === 'courier' && (
              <div className="flex items-center bg-[#1C2128] rounded-xl p-1 border border-[#2D333D]">
                <button
                  onClick={() => onCourierStatusToggle?.(!isCourierOnline)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isCourierOnline
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-[#2D333D] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isCourierOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></span>
                  <span>{isCourierOnline ? 'ONLINE (Aktiv)' : 'OFFLINE (Nofaol)'}</span>
                </button>
              </div>
            )}

            <div className="hidden sm:flex items-center space-x-2 bg-[#1C2128] px-3.5 py-1.5 rounded-xl border border-[#2D333D]">
              {authUser.role === 'admin' ? (
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
              ) : (
                <Bike className="w-4 h-4 text-emerald-400" />
              )}
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-200">{authUser.name}</p>
                <p className="text-[10px] text-slate-400 font-mono capitalize">
                  {authUser.role === 'admin' ? 'Tizim Admini' : `ID: ${authUser.courier_id}`}
                </p>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl border border-rose-500/20 transition-all"
              title="Tizimdan chiqish"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Chiqish</span>
            </button>
          </div>
        ) : (
          <div className="text-xs text-slate-400 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Xush kelibsiz! Kirish uchun tizimga kiring</span>
          </div>
        )}
      </div>
    </header>
  );
};
