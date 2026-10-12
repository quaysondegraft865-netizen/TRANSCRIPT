import React from 'react';
import { SCHOOL_INFO } from '../data/schoolData';
import { useAuth } from '../context/AuthContext';
import {
  Printer,
  HelpCircle,
  FileText,
  Award,
  BarChart3,
  Users,
  BookOpen,
  LogOut,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onPrint: () => void;
  onHelp: () => void;
  onToggleMobileMenu: () => void;
  onOpenLogoutModal: () => void;
  onOpenProfile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onPrint,
  onHelp,
  onToggleMobileMenu,
  onOpenLogoutModal,
  onOpenProfile,
}) => {
  const { user } = useAuth();

  // Role display name & color tag
  const roleLabel = user ? user.role.replace('_', ' ').toUpperCase() : 'GUEST';

  // Initials for avatar
  const initials = user
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'DQ';

  return (
    <header className="sticky top-0 z-30 h-14 bg-gradient-to-r from-[#1a3a7a] via-[#16336c] to-[#132d5f] text-white shadow-md border-b border-white/10 px-4 md:px-6 flex items-center justify-between gap-4 no-print">
      {/* Brand Zone */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="md:hidden p-1.5 text-white/80 hover:text-white rounded hover:bg-white/10"
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2.5">
          <img
            src="/logo.jpg"
            alt="Nkroful Agric SHS Crest"
            className="w-8 h-8 rounded object-contain bg-white/10 p-0.5"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-wide text-white whitespace-nowrap">
              NKROFUL AGRIC SHS
            </span>
            <span className="text-[10px] text-amber-300 font-semibold tracking-wider uppercase">
              Staff Portal · 2026/2027
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links for Desktop */}
      <nav className="hidden lg:flex items-center gap-1 text-xs font-medium">
        {user?.role !== 'student' && user?.role !== 'parent' && (
          <button
            type="button"
            onClick={() => setActiveTab('assessment')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'assessment'
                ? 'bg-white/15 text-white font-semibold'
                : 'text-white/75 hover:text-white hover:bg-white/10'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Assessments</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('transcript')}
          className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'transcript'
              ? 'bg-white/15 text-white font-semibold'
              : 'text-white/75 hover:text-white hover:bg-white/10'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-emerald-400" />
          <span>{user?.role === 'student' ? 'My Transcript' : 'Official Transcripts'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reportcard')}
          className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'reportcard'
              ? 'bg-white/15 text-white font-semibold'
              : 'text-white/75 hover:text-white hover:bg-white/10'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          <span>{user?.role === 'student' ? 'My Terminal Report' : 'Terminal Reports'}</span>
        </button>

        {user?.role !== 'student' && user?.role !== 'parent' && (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('broadsheet')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'broadsheet'
                  ? 'bg-white/15 text-white font-semibold'
                  : 'text-white/75 hover:text-white hover:bg-white/10'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-yellow-300" />
              <span>Master Broadsheet</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('students')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'students'
                  ? 'bg-white/15 text-white font-semibold'
                  : 'text-white/75 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-purple-300" />
              <span>Student Directory</span>
            </button>
          </>
        )}
      </nav>

      {/* User Status, Role Badge & Logout */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Role Tag */}
        <div className="hidden sm:flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-md border border-white/15 text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-amber-300 font-mono tracking-wide">{roleLabel}</span>
        </div>

        <button
          type="button"
          onClick={onPrint}
          className="hidden md:flex px-2.5 py-1 text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-md transition-all shadow-sm items-center gap-1.5 whitespace-nowrap"
          title="Print official document"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print</span>
        </button>

        {/* User dot avatar with name tool-tip */}
        <button
          type="button"
          onClick={onOpenProfile}
          className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-bold text-xs grid place-items-center shadow-inner cursor-pointer hover:ring-2 hover:ring-amber-300 transition-all"
          title={`${user?.fullName || 'User'} (${roleLabel}) - Click to manage profile & password`}
        >
          {initials}
        </button>

        {/* Logout Button */}
        <button
          type="button"
          onClick={onOpenLogoutModal}
          className="p-1.5 text-white/80 hover:text-red-200 hover:bg-red-500/20 rounded-md transition-colors flex items-center gap-1 text-xs font-semibold"
          title="Sign Out of Portal"
        >
          <LogOut className="w-4 h-4 text-red-300" />
          <span className="hidden md:inline text-red-100">Sign Out</span>
        </button>
      </div>
    </header>
  );
};
