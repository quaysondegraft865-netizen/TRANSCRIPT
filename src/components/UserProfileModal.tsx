import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { SCHOOL_INFO } from '../data/schoolData';
import {
  User,
  Shield,
  KeyRound,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  X,
  Loader2,
  Lock,
  Clock,
  Building,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast?: (msg: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onSuccessToast,
}) => {
  const { user, changePassword, toggleMfa } = useAuth();
  const [activeTab, setActiveTab] = useState<'details' | 'security' | 'mfa'>('details');

  // Change password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // MFA states
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaMessage, setMfaMessage] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    const res = await changePassword(currentPassword, newPassword);
    setPasswordLoading(false);

    if (res.success) {
      setPasswordSuccess('Password changed successfully! Keep your credentials confidential.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onSuccessToast?.('Your password has been updated securely.');
    } else {
      setPasswordError(res.error || 'Failed to update password.');
    }
  };

  const handleToggleMfa = async () => {
    setMfaLoading(true);
    const res = await toggleMfa();
    setMfaLoading(false);
    if (res.success) {
      setMfaMessage(res.message || 'MFA status updated.');
      setTimeout(() => setMfaMessage(null), 4000);
      onSuccessToast?.(`Two-Factor Authentication ${user.mfaEnabled ? 'disabled' : 'enabled'}.`);
    }
  };

  const roleLabels: Record<string, string> = {
    super_admin: 'Super Administrator',
    headmaster: 'Headmaster / School Administrator',
    assistant_headmaster: 'Assistant Headmaster (Academics)',
    form_master: 'Form Master / Class Teacher',
    teacher: 'Subject Teacher',
    accountant: 'Accountant / Bursar',
    student: 'Student',
    parent: 'Parent / Guardian',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-[#102a5c] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-lg shadow-sm">
              {user.fullName.charAt(0)}
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">{user.fullName}</h2>
              <p className="text-xs text-blue-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {roleLabels[user.role] || user.role}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('details')}
            type="button"
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'details'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile & Identity</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            type="button"
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'security'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Change Password</span>
          </button>
          <button
            onClick={() => setActiveTab('mfa')}
            type="button"
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'mfa'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Two-Factor Auth (2FA)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Username / ID</span>
                  <div className="font-mono text-slate-900 font-bold mt-0.5">{user.username}</div>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Email Address</span>
                  <div className="text-slate-900 font-medium truncate mt-0.5">{user.email}</div>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Role Profile</span>
                  <div className="text-indigo-700 font-bold mt-0.5 capitalize">
                    {roleLabels[user.role] || user.role}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">Phone Number</span>
                  <div className="text-slate-900 font-medium mt-0.5">{user.phone || '+233 24 100 2000'}</div>
                </div>
                {user.studentIndexNo && (
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Student Index No</span>
                    <div className="font-mono font-bold text-emerald-700 mt-0.5">{user.studentIndexNo}</div>
                  </div>
                )}
                {user.linkedStudentName && (
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Ward / Student</span>
                    <div className="text-slate-900 font-bold mt-0.5">{user.linkedStudentName}</div>
                  </div>
                )}
                {user.assignedClasses && user.assignedClasses.length > 0 && (
                  <div className="col-span-2">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Assigned Classes</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {user.assignedClasses.map((cls) => (
                        <span key={cls} className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-[11px] font-semibold">
                          {cls.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="border border-slate-200 rounded-xl p-3 bg-amber-50/50 flex items-start gap-2.5">
                <Building className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Institutional Affiliation</div>
                  <div className="text-slate-600 mt-0.5">
                    {SCHOOL_INFO.name} · GES Code: {SCHOOL_INFO.gesCode} · Ellembelle District
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Last Login Activity
                </span>
                <span className="font-mono text-slate-800 font-semibold">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Active Session'}
                </span>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <p className="text-slate-600 text-xs">
                To update your security credentials, provide your existing password followed by your new password.
              </p>

              {passwordError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    placeholder="Minimum 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  placeholder="Re-type new password"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full py-2.5 px-4 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {passwordLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  <span>Update Password Securely</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'mfa' && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${user.mfaEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">
                        {user.mfaEnabled ? 'Two-Factor Authentication Active' : 'Two-Factor Authentication Disabled'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {user.mfaEnabled
                          ? 'Your account requires two-step OTP verification on new logins.'
                          : 'Add an extra verification layer to protect student academic marks.'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleToggleMfa}
                    disabled={mfaLoading}
                    type="button"
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                      user.mfaEnabled
                        ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {mfaLoading ? 'Updating...' : user.mfaEnabled ? 'Disable 2FA' : 'Activate 2FA'}
                  </button>
                </div>

                {mfaMessage && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 font-semibold text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{mfaMessage}</span>
                  </div>
                )}
              </div>

              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl space-y-1.5">
                <span className="font-bold text-blue-950 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-blue-700" />
                  Institutional Security Compliance (GES ICT Directive)
                </span>
                <p className="text-blue-800 text-[11px] leading-relaxed">
                  Headmasters, Examination Officers, and Form Masters handling confidential terminal results are advised to maintain Multi-Factor Authentication active at all times.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
