import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { LogoutConfirmModal } from './components/auth/LogoutConfirmModal';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { AssessmentSheetsView } from './components/AssessmentSheetsView';
import { TranscriptView } from './components/TranscriptView';
import { TerminalReportView } from './components/TerminalReportView';
import { MasterBroadsheetView } from './components/MasterBroadsheetView';
import { StudentDirectoryView } from './components/StudentDirectoryView';
import { AnalyticsView } from './components/AnalyticsView';
import { AuditLogsView } from './components/admin/AuditLogsView';
import { UserManagementView } from './components/admin/UserManagementView';
import { StudentPortalView } from './components/student/StudentPortalView';
import { ParentPortalView } from './components/parent/ParentPortalView';
import { AccountantPortalView } from './components/accountant/AccountantPortalView';
import { AcademicSettingsView } from './components/admin/AcademicSettingsView';
import { UserProfileModal } from './components/UserProfileModal';
import { InactivityModal } from './components/InactivityModal';
import { BackupModal } from './components/BackupModal';
import { SCHOOL_INFO } from './data/schoolData';
import { CheckCircle2, ShieldAlert } from 'lucide-react';

function MainApp() {
  const { user, isAuthenticated, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('assessment');
  const [selectedStudentForTranscript, setSelectedStudentForTranscript] = useState<{
    name: string;
    classKey: string;
  } | null>(null);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<{
    name: string;
    classKey: string;
  } | null>(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState<boolean>(false);
  const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);
  const [backupModalOpen, setBackupModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTimer, setToastTimer] = useState<number | null>(null);

  // Set default tab based on user role upon login
  useEffect(() => {
    if (user) {
      if (user.role === 'student') {
        setActiveTab('transcript');
      } else if (user.role === 'parent') {
        setActiveTab('reportcard');
      } else if (user.role === 'accountant') {
        setActiveTab('bursar');
      } else {
        setActiveTab('assessment');
      }
    }
  }, [user?.role]);

  const showToast = (msg: string) => {
    if (toastTimer) window.clearTimeout(toastTimer);
    setToastMessage(msg);
    const timer = window.setTimeout(() => {
      setToastMessage(null);
    }, 3000);
    setToastTimer(timer);
  };

  const handleOpenTranscriptForStudent = (name: string, classKey: string) => {
    setSelectedStudentForTranscript({ name, classKey });
    setActiveTab('transcript');
    showToast(`Loaded transcript for ${name}`);
  };

  const handleOpenReportForStudent = (name: string, classKey: string) => {
    setSelectedStudentForReport({ name, classKey });
    setActiveTab('reportcard');
    showToast(`Loaded terminal report for ${name}`);
  };

  const handleOpenAssessmentForClass = (classKey: string) => {
    setActiveTab('assessment');
  };

  const handleHelp = () => {
    showToast('Nkroful Agric SHS Portal: Access authorized modules using the sidebar.');
  };

  // If loading session check
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-white p-2 shadow-2xl border-2 border-amber-400 flex items-center justify-center animate-pulse">
          <img src="/logo.jpg" alt="Crest" className="w-full h-full object-contain" />
        </div>
        <div className="text-center">
          <h2 className="text-base font-bold tracking-wide">Nkroful Agric Senior High School</h2>
          <p className="text-xs text-slate-400 mt-1">Verifying encrypted session credentials...</p>
        </div>
      </div>
    );
  }

  // If unauthenticated: Render Login Page Guard
  if (!isAuthenticated || !user) {
    return <LoginPage onSuccessToast={showToast} />;
  }

  // Role Access Guard: Prevent student or parent from accessing administrative tabs
  const isRestrictedForStudentOrParent =
    (user.role === 'student' || user.role === 'parent') &&
    (activeTab === 'assessment' ||
      activeTab === 'broadsheet' ||
      activeTab === 'students' ||
      activeTab === 'analytics' ||
      activeTab === 'usermanagement' ||
      activeTab === 'auditlogs');

  return (
    <div className="min-h-screen bg-[#f5f7fa] flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Top Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onPrint={() => window.print()}
        onHelp={handleHelp}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        onOpenLogoutModal={() => setLogoutModalOpen(true)}
        onOpenProfile={() => setProfileModalOpen(true)}
      />

      {/* Main Layout */}
      <div className="flex-1 flex max-w-[1700px] w-full mx-auto">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpenMobile={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          onOpenBackup={() => setBackupModalOpen(true)}
          onOpenLogoutModal={() => setLogoutModalOpen(true)}
          onOpenProfile={() => setProfileModalOpen(true)}
        />

        {/* Dynamic Viewport */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 min-w-0">
          {/* Permission Guard Alert if URL or state tampering occurs */}
          {isRestrictedForStudentOrParent ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-3 max-w-lg mx-auto my-12">
              <ShieldAlert className="w-10 h-10 text-red-600 mx-auto" />
              <h3 className="text-base font-bold text-red-900">Unauthorized Module Access</h3>
              <p className="text-xs text-red-700">
                Your role account ({user.role}) is restricted from viewing or editing staff grading sheets and records.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab(user.role === 'student' ? 'transcript' : 'reportcard')}
                className="px-4 py-2 bg-red-700 text-white rounded-lg text-xs font-bold"
              >
                Return to My Records
              </button>
            </div>
          ) : (
            <>
              {/* Specialized Student Portal */}
              {user.role === 'student' && <StudentPortalView />}

              {/* Specialized Parent Portal */}
              {user.role === 'parent' && <ParentPortalView />}

              {/* Accountant Portal */}
              {activeTab === 'bursar' && <AccountantPortalView />}

              {/* General Staff & Admin Tabs */}
              {user.role !== 'student' && user.role !== 'parent' && (
                <>
                  {activeTab === 'assessment' && (
                    <AssessmentSheetsView
                      onOpenTranscriptForStudent={handleOpenTranscriptForStudent}
                      showToast={showToast}
                    />
                  )}

                  {activeTab === 'transcript' && (
                    <TranscriptView
                      initialStudentName={selectedStudentForTranscript?.name}
                      initialClassKey={selectedStudentForTranscript?.classKey}
                      showToast={showToast}
                    />
                  )}

                  {activeTab === 'reportcard' && (
                    <TerminalReportView showToast={showToast} />
                  )}

                  {activeTab === 'broadsheet' && (
                    <MasterBroadsheetView
                      onOpenTranscriptForStudent={handleOpenTranscriptForStudent}
                      showToast={showToast}
                    />
                  )}

                  {activeTab === 'students' && (
                    <StudentDirectoryView
                      onOpenTranscriptForStudent={handleOpenTranscriptForStudent}
                      onOpenAssessmentForClass={handleOpenAssessmentForClass}
                      onOpenReportForStudent={handleOpenReportForStudent}
                    />
                  )}

                  {activeTab === 'analytics' && (
                    <AnalyticsView
                      onOpenTranscriptForStudent={handleOpenTranscriptForStudent}
                    />
                  )}

                  {/* Academic Calendar & Settings */}
                  {activeTab === 'calendarsettings' && (
                    <AcademicSettingsView showToast={showToast} />
                  )}

                  {/* Super Admin & Headmaster */}
                  {activeTab === 'usermanagement' && <UserManagementView />}

                  {/* Super Admin Only */}
                  {activeTab === 'auditlogs' && <AuditLogsView />}
                </>
              )}
            </>
          )}

          {/* Footer */}
          <footer className="mt-12 pt-6 border-t border-slate-200 text-center text-xs text-slate-500 no-print space-y-1">
            <div>
              Staff & Academic Portal · 2026/2027 Academic Year · {SCHOOL_INFO.name}
            </div>
            <div className="text-[11px] text-slate-400">
              Authenticated Session: <span className="font-semibold text-slate-700">{user.fullName}</span> (
              <span className="capitalize">{user.role.replace('_', ' ')}</span>) · Developer:{' '}
              <span className="font-bold text-indigo-700">{SCHOOL_INFO.developerName}</span>
            </div>
          </footer>
        </main>
      </div>

      {/* User Profile & Security Modal */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onSuccessToast={showToast}
      />

      {/* Session Inactivity Monitor Modal */}
      <InactivityModal />

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
      />

      {/* Backup & Sync Modal */}
      <BackupModal
        isOpen={backupModalOpen}
        onClose={() => setBackupModalOpen(false)}
        showToast={showToast}
      />

      {/* Toast Notification Bar */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2.5 border-l-4 border-amber-400 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
