import React from 'react';
import { SCHOOL_INFO } from '../data/schoolData';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  Award,
  FileText,
  BarChart3,
  Users,
  PieChart,
  HardDriveDownload,
  ShieldCheck,
  DollarSign,
  UserCheck,
  LogOut,
  Calendar,
  User,
  X,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenBackup: () => void;
  onOpenLogoutModal: () => void;
  onOpenProfile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpenMobile,
  onCloseMobile,
  onOpenBackup,
  onOpenLogoutModal,
  onOpenProfile,
}) => {
  const { user } = useAuth();

  // Role-based navigation items
  const getNavItems = () => {
    if (!user) return [];

    if (user.role === 'student') {
      return [
        {
          id: 'transcript',
          label: 'My Official Transcript',
          badge: 'Verified',
          icon: Award,
          color: 'text-emerald-600',
        },
        {
          id: 'reportcard',
          label: 'My Terminal Report',
          badge: '2026/2027',
          icon: FileText,
          color: 'text-cyan-600',
        },
      ];
    }

    if (user.role === 'parent') {
      return [
        {
          id: 'reportcard',
          label: 'Ward Terminal Report',
          badge: 'Latest',
          icon: FileText,
          color: 'text-cyan-600',
        },
        {
          id: 'transcript',
          label: 'Ward Academic Transcript',
          badge: 'Cumulative',
          icon: Award,
          color: 'text-emerald-600',
        },
      ];
    }

    if (user.role === 'accountant') {
      return [
        {
          id: 'bursar',
          label: 'Student Fee Clearance',
          badge: 'Bursary',
          icon: DollarSign,
          color: 'text-amber-600',
        },
        {
          id: 'broadsheet',
          label: 'Master Broadsheet',
          badge: 'Full Class',
          icon: BarChart3,
          color: 'text-indigo-600',
        },
        {
          id: 'students',
          label: 'Student Directory',
          badge: 'Enrolment',
          icon: Users,
          color: 'text-purple-600',
        },
      ];
    }

    // Teacher, Form Master, Asst Headmaster, Headmaster, Super Admin
    const items = [
      {
        id: 'assessment',
        label: 'Assessment Sheets',
        badge: 'STP SBA',
        icon: BookOpen,
        color: 'text-indigo-600',
      },
      {
        id: 'transcript',
        label: 'Official Transcripts',
        badge: 'Academic',
        icon: Award,
        color: 'text-emerald-600',
      },
      {
        id: 'reportcard',
        label: 'Terminal Report Cards',
        badge: 'End of Term',
        icon: FileText,
        color: 'text-cyan-600',
      },
      {
        id: 'broadsheet',
        label: 'Master Broadsheet',
        badge: 'Full Class',
        icon: BarChart3,
        color: 'text-amber-600',
      },
      {
        id: 'students',
        label: 'Student Directory',
        badge: '1,000+ Stds',
        icon: Users,
        color: 'text-purple-600',
      },
      {
        id: 'analytics',
        label: 'Academic Analytics',
        badge: 'Performance',
        icon: PieChart,
        color: 'text-rose-600',
      },
    ];

    if (
      user.role === 'headmaster' ||
      user.role === 'super_admin' ||
      user.role === 'assistant_headmaster'
    ) {
      items.push({
        id: 'calendarsettings',
        label: 'Calendar & Terms',
        badge: '2026/2027',
        icon: Calendar,
        color: 'text-indigo-600',
      });
    }

    if (
      user.role === 'headmaster' ||
      user.role === 'super_admin' ||
      user.role === 'assistant_headmaster'
    ) {
      items.push({
        id: 'usermanagement',
        label: 'User Accounts & Roles',
        badge: 'Admin',
        icon: UserCheck,
        color: 'text-blue-600',
      });
    }

    if (user.role === 'super_admin') {
      items.push({
        id: 'auditlogs',
        label: 'Security Audit Logs',
        badge: 'Security',
        icon: ShieldCheck,
        color: 'text-indigo-700',
      });
    }

    return items;
  };

  const navItems = getNavItems();

  const handleSelect = (id: string) => {
    setActiveTab(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-950/40 z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed md:sticky top-14 z-40 w-64 h-[calc(100vh-3.5rem)] bg-white border-r border-slate-200 flex flex-col justify-between p-3.5 transition-transform duration-200 ease-in-out no-print ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex-1 overflow-y-auto pr-1">
          {/* Mobile Header Close */}
          <div className="flex items-center justify-between md:hidden pb-2 mb-2 border-b border-slate-100">
            <span className="font-semibold text-xs text-slate-700">Navigation Menu</span>
            <button
              onClick={onCloseMobile}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* School Crest & User Identity Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center mb-3">
            <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center bg-white rounded-lg border border-slate-200 p-1 shadow-xs">
              <img
                src="/logo.jpg"
                alt="Nkroful Agric SHS Crest"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <h2 className="text-xs font-bold text-slate-900 leading-tight">
              Nkroful Agric SHS
            </h2>
            <div className="mt-1 text-[10px] font-semibold text-amber-800 bg-amber-50 py-0.5 px-1.5 rounded inline-block uppercase">
              {user?.role.replace('_', ' ')}
            </div>
            <div className="text-[11px] font-bold text-slate-800 mt-1 truncate">
              {user?.fullName}
            </div>
          </div>

          {/* Navigation Section */}
          <div className="space-y-1">
            <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Navigation & Records
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-blue-50 text-blue-900 font-semibold border border-blue-200/60 shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-700' : item.color}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9.5px] px-1.5 py-0.5 rounded font-mono-numbers shrink-0 ${
                        isActive
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* System Section */}
          {(user?.role === 'super_admin' || user?.role === 'headmaster') && (
            <div className="space-y-1 mt-4 pt-3 border-t border-slate-100">
              <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                System Administration
              </div>

              <button
                type="button"
                onClick={onOpenBackup}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors text-left"
              >
                <HardDriveDownload className="w-4 h-4 text-slate-500" />
                <span>Backup & Data Sync</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer with Working Logout Action */}
        <div className="pt-3 border-t border-slate-200/80 space-y-2">
          {onOpenProfile && (
            <button
              type="button"
              onClick={onOpenProfile}
              className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-slate-200"
            >
              <User className="w-3.5 h-3.5 text-indigo-700" />
              <span>My Profile & Password</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenLogoutModal}
            className="w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-md text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-red-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Session</span>
          </button>

          <div className="text-[10px] text-slate-400 text-center">
            GES Academic Security System · NASS
          </div>
        </div>
      </aside>
    </>
  );
};
