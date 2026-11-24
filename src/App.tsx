import React, { useState, useEffect } from 'react';
import { AuthUser } from './types';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { AdminDashboard } from './components/AdminDashboard';
import { CourierDashboard } from './components/CourierDashboard';

export default function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('tezlazzat_auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isCourierOnline, setIsCourierOnline] = useState(true);

  useEffect(() => {
    if (authUser) {
      localStorage.setItem('tezlazzat_auth_user', JSON.stringify(authUser));
    } else {
      localStorage.removeItem('tezlazzat_auth_user');
    }
  }, [authUser]);

  const handleLogout = () => {
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setAuthUser(null);
  };

  const handleCourierStatusToggle = async (isOnline: boolean) => {
    setIsCourierOnline(isOnline);
    if (authUser?.courier_id) {
      try {
        await fetch('/api/courier/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courier_id: authUser.courier_id, is_online: isOnline }),
        });
      } catch (err) {
        console.error('Failed to update courier status', err);
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0F1115] text-[#E2E8F0] flex flex-col font-sans select-none overflow-x-hidden">
      {!authUser ? (
        <div className="flex-1 overflow-auto flex items-center justify-center p-4">
          <LoginModal onLoginSuccess={(user) => setAuthUser(user)} />
        </div>
      ) : authUser.role === 'admin' || authUser.role === 'ofitsiant' || authUser.role === 'waiter' ? (
        <AdminDashboard authUser={authUser} onLogout={handleLogout} />
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar
            authUser={authUser}
            onLogout={handleLogout}
            onCourierStatusToggle={handleCourierStatusToggle}
            isCourierOnline={isCourierOnline}
          />
          <div className="flex-1 overflow-auto">
            <CourierDashboard courierId={authUser.courier_id!} />
          </div>
        </div>
      )}
    </div>
  );
}
