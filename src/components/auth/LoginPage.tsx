import React, { useState } from 'react';
import { useAuth, UserRole } from '../../context/AuthContext';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { SCHOOL_INFO } from '../../data/schoolData';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Users,
  BookOpen,
} from 'lucide-react';

interface LoginPageProps {
  onSuccessToast?: (msg: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccessToast }) => {
  const { login, loggedOutMessage, setLoggedOutMessage } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    if (!identifier.trim()) {
      setErrorMessage('Please enter your email or username.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    const result = await login(identifier.trim(), password, rememberMe);
    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Invalid credentials. Please verify your username and password.');
    } else {
      onSuccessToast?.('Welcome back! Signed in successfully.');
    }
  };

  // Quick Account Preset Fillers for Testing all 6 GES roles
  const handleSelectRolePreset = (
    roleId: UserRole,
    credId: string,
    credPass: string
  ) => {
    setIdentifier(credId);
    setPassword(credPass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c1f44] via-[#132d5f] to-[#1a3a7a] flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 selection:bg-amber-300 selection:text-slate-900">
      <div className="max-w-md w-full mx-auto my-auto space-y-6">
        {/* School Crest & Heading */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-white p-2 shadow-xl border-2 border-amber-400 flex items-center justify-center transform hover:scale-105 transition-transform">
            <img
              src="/logo.jpg"
              alt="Nkroful Agric SHS Crest"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          <div>
            <span className="text-[11px] font-bold tracking-widest text-amber-300 uppercase bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/30">
              GES · 2026/2027 Academic Year · Western Region
            </span>
            <h1 className="text-lg sm:text-xl font-extrabold text-white mt-2 tracking-tight">
              {SCHOOL_INFO.name}
            </h1>
            <p className="text-xs text-blue-200/90 font-medium italic">
              "{SCHOOL_INFO.motto}"
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-white/20 p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Welcome Back
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Sign in to access the school management portal.
            </p>
          </div>

          {/* Logged out message banner */}
          {loggedOutMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{loggedOutMessage}</span>
            </div>
          )}

          {/* Success notice */}
          {successNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Error notice */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email or Username */}
            <div>
              <label
                htmlFor="identifier"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Email Address or Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="identifier"
                  type="text"
                  required
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="name@nkrofulagric.edu.gh or index no."
                  className="w-full pl-9 pr-3 py-2.5 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-9 pr-10 py-2.5 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-blue-800 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <label
                htmlFor="rememberMe"
                className="ml-2 block text-xs text-slate-600 font-medium cursor-pointer"
              >
                Remember Me (Extended 30-day session)
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-[#1a3a7a] via-[#132d5f] to-[#0f244e] text-white font-bold text-xs rounded-lg shadow-md hover:shadow-lg hover:from-[#132d5f] hover:to-[#0a1835] transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In to Portal</span>
              )}
            </button>
          </form>

          {/* Quick Role Tester Bar (Convenient 1-click test selector for evaluators) */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Test Role Credentials</span>
              </span>
              <span className="text-[10px] text-slate-400">Click to autofill</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10.5px]">
              <button
                type="button"
                onClick={() =>
                  handleSelectRolePreset(
                    'super_admin',
                    'superadmin@nkrofulagric.edu.gh',
                    'Admin@2026!'
                  )
                }
                className="p-1.5 text-left rounded-lg bg-slate-50 hover:bg-purple-50 hover:border-purple-300 border border-slate-200 transition-colors"
              >
                <div className="font-bold text-purple-900">Super Admin</div>
                <div className="text-[9.5px] text-slate-500 truncate">De-Graft Quayson</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSelectRolePreset(
                    'headmaster',
                    'headmaster@nkrofulagric.edu.gh',
                    'Head@2026!'
                  )
                }
                className="p-1.5 text-left rounded-lg bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 transition-colors"
              >
                <div className="font-bold text-blue-900">Headmaster</div>
                <div className="text-[9.5px] text-slate-500 truncate">E. Armah-Blay</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSelectRolePreset(
                    'assistant_headmaster',
                    'asst.head@nkrofulagric.edu.gh',
                    'AsstHead@2026!'
                  )
                }
                className="p-1.5 text-left rounded-lg bg-slate-50 hover:bg-sky-50 hover:border-sky-300 border border-slate-200 transition-colors"
              >
                <div className="font-bold text-sky-900">Asst. Head</div>
                <div className="text-[9.5px] text-slate-500 truncate">Faustina Mensah</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSelectRolePreset(
                    'form_master',
                    'formmaster.agric@nkrofulagric.edu.gh',
                    'FormMaster@2026!'
                  )
                }
                className="p-1.5 text-left rounded-lg bg-slate-50 hover:bg-teal-50 hover:border-teal-300 border border-slate-200 transition-colors"
              >
                <div className="font-bold text-teal-900">Form Master</div>
                <div className="text-[9.5px] text-slate-500 truncate">P. Gyasi (Agric)</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSelectRolePreset(
                    'teacher',
                    'teacher.gyasi@nkrofulagric.edu.gh',
                    'Teacher@2026!'
                  )
                }
                className="p-1.5 text-left rounded-lg bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 transition-colors"
              >
                <div className="font-bold text-emerald-900">Teacher</div>
                <div className="text-[9.5px] text-slate-500 truncate">Aug. Baidoo</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSelectRolePreset(
                    'accountant',
                    'accountant@nkrofulagric.edu.gh',
                    'Bursar@2026!'
                  )
                }
                className="p-1.5 text-left rounded-lg bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 transition-colors"
              >
                <div className="font-bold text-amber-900">Accountant</div>
                <div className="text-[9.5px] text-slate-500 truncate">Rebecca Nyame</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSelectRolePreset(
                    'student',
                    '042260001',
                    'Student@2026!'
                  )
                }
                className="p-1.5 text-left rounded-lg bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 border border-slate-200 transition-colors"
              >
                <div className="font-bold text-indigo-900">Student</div>
                <div className="text-[9.5px] text-slate-500 truncate">Ackah Clinton</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSelectRolePreset(
                    'parent',
                    'parent.ackah@nkrofulagric.edu.gh',
                    'Parent@2026!'
                  )
                }
                className="p-1.5 text-left rounded-lg bg-slate-50 hover:bg-rose-50 hover:border-rose-300 border border-slate-200 transition-colors"
              >
                <div className="font-bold text-rose-900">Parent</div>
                <div className="text-[9.5px] text-slate-500 truncate">Elder Ackah</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-blue-200/80 space-y-0.5">
          <p>© {new Date().getFullYear()} {SCHOOL_INFO.name}. All Rights Reserved.</p>
          <p>Protected by GES Academic Security & Cryptographic Sessions.</p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        onSuccess={(msg) => {
          setSuccessNotice(msg);
          setErrorMessage(null);
        }}
      />
    </div>
  );
};
