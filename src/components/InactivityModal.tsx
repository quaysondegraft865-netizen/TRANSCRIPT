import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, ShieldAlert, LogOut, CheckCircle2 } from 'lucide-react';

export const InactivityModal: React.FC = () => {
  const { inactivityWarning, resetInactivityTimer, logout } = useAuth();
  const [countdown, setCountdown] = useState<number>(120); // 2 minutes

  useEffect(() => {
    if (!inactivityWarning) {
      setCountdown(120);
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          logout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [inactivityWarning, logout]);

  if (!inactivityWarning) return null;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-amber-300 max-w-md w-full p-6 text-center space-y-4">
        <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-amber-50">
          <Clock className="w-8 h-8 animate-pulse" />
        </div>

        <div>
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Session Inactivity Warning
          </h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            For institutional security, your authenticated session will automatically expire due to inactivity.
          </p>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="text-2xl font-black font-mono text-amber-800">
            {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
          </div>
          <div className="text-[11px] font-semibold text-amber-700 mt-0.5">
            Auto-logout countdown
          </div>
        </div>

        <div className="flex gap-2.5 pt-2">
          <button
            onClick={resetInactivityTimer}
            type="button"
            className="flex-1 py-2.5 px-4 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Stay Signed In</span>
          </button>
          <button
            onClick={() => logout()}
            type="button"
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
