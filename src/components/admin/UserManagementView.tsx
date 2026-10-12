import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  KeyRound,
  UserX,
  UserCheck,
  UserPlus,
  X,
  Loader2,
  ShieldAlert,
  Copy,
} from 'lucide-react';

interface ManagedUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  phone?: string;
  isActive: boolean;
  studentIndexNo?: string;
  linkedStudentName?: string;
  assignedClasses?: string[];
  lastLogin?: string;
}

export const UserManagementView: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Force reset modal
  const [resetModalInfo, setResetModalInfo] = useState<{
    userName: string;
    tempPassword?: string;
    loading: boolean;
  } | null>(null);

  // Create user modal
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState('teacher');
  const [newPassword, setNewPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch user list', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (targetId: string, currentStatus: boolean, name: string) => {
    const actionName = currentStatus ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${actionName} the account for "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/auth/users/${targetId}/status`, {
        method: 'PATCH',
      });
      const data = await res.json();

      if (res.ok) {
        setActionNotice(data.message || `Account ${actionName}d successfully.`);
        fetchUsers();
        setTimeout(() => setActionNotice(null), 4000);
      } else {
        alert(data.error || 'Failed to update account status.');
      }
    } catch {
      alert('Network request failed.');
    }
  };

  const handleForceReset = async (targetId: string, name: string) => {
    if (!window.confirm(`Force password reset for "${name}"? An immediate temporary credential will be generated.`)) {
      return;
    }

    setResetModalInfo({ userName: name, loading: true });
    try {
      const res = await fetch(`/api/auth/users/${targetId}/force-reset`, {
        method: 'POST',
      });
      const data = await res.json();

      if (res.ok && data.temporaryPassword) {
        setResetModalInfo({
          userName: name,
          tempPassword: data.temporaryPassword,
          loading: false,
        });
      } else {
        alert(data.error || 'Failed to force password reset.');
        setResetModalInfo(null);
      }
    } catch {
      alert('Network communication error.');
      setResetModalInfo(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);

    try {
      const res = await fetch('/api/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername.trim(),
          email: newEmail.trim(),
          fullName: newFullName.trim(),
          role: newRole,
          rawPassword: newPassword,
          phone: newPhone.trim(),
        }),
      });

      const data = await res.json();
      setCreateLoading(false);

      if (res.ok) {
        setActionNotice(data.message || 'User created successfully.');
        setCreateUserOpen(false);
        setNewUsername('');
        setNewEmail('');
        setNewFullName('');
        setNewPassword('');
        setNewPhone('');
        fetchUsers();
        setTimeout(() => setActionNotice(null), 4000);
      } else {
        setCreateError(data.error || 'Failed to create user account.');
      }
    } catch {
      setCreateLoading(false);
      setCreateError('Network failure contacting authentication service.');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    if (!matchRole) return false;

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      (u.studentIndexNo && u.studentIndexNo.includes(q))
    );
  });

  const roleNameFormat: Record<string, string> = {
    super_admin: 'Super Admin',
    headmaster: 'Headmaster',
    assistant_headmaster: 'Asst. Headmaster',
    form_master: 'Form Master',
    teacher: 'Subject Teacher',
    accountant: 'Accountant',
    student: 'Student',
    parent: 'Parent',
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Users className="w-6 h-6 text-purple-600" />
              <span>User Accounts & Institutional Role Permissions</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Role-based access control (RBAC), password overrides, and account lifecycle management
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-purple-800 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200 font-bold">
              Total Profiles: {users.length}
            </span>

            {(user?.role === 'super_admin' || user?.role === 'headmaster') && (
              <button
                onClick={() => setCreateUserOpen(true)}
                type="button"
                className="px-3.5 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add User Account</span>
              </button>
            )}
          </div>
        </div>

        {actionNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Search & Role Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, username, or student index number..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Roles ({users.length})</option>
            <option value="super_admin">Super Admins</option>
            <option value="headmaster">Headmasters</option>
            <option value="assistant_headmaster">Asst. Headmasters</option>
            <option value="form_master">Form Masters</option>
            <option value="teacher">Subject Teachers</option>
            <option value="accountant">Accountants</option>
            <option value="student">Students</option>
            <option value="parent">Parents</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">User Identity</th>
                <th className="py-3 px-3 w-36">Role Profile</th>
                <th className="py-3 px-3 w-40">Assigned Scope</th>
                <th className="py-3 px-3 w-28 text-center">Status</th>
                <th className="py-3 px-3 w-32">Last Login</th>
                <th className="py-3 px-4 w-48 text-center">Security & Admin Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 odd:bg-white even:bg-slate-50/40">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{u.fullName}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {u.email} · <span className="text-slate-400">@{u.username}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md text-[11px]">
                      {roleNameFormat[u.role] || u.role}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[11px] text-slate-600">
                    {u.studentIndexNo && <div>Index: <strong className="font-mono text-emerald-800">{u.studentIndexNo}</strong></div>}
                    {u.linkedStudentName && <div>Ward: <strong>{u.linkedStudentName}</strong></div>}
                    {u.assignedClasses && <div>Class: <strong className="text-indigo-700">{u.assignedClasses.join(', ')}</strong></div>}
                    {!u.studentIndexNo && !u.linkedStudentName && !u.assignedClasses && (
                      <span className="text-slate-400 italic">Full School Scope</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {u.isActive ? (
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        <XCircle className="w-3 h-3 text-rose-600" /> Disabled
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-500 text-[11px]">
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-GB') : 'Never'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Force Password Reset */}
                      <button
                        type="button"
                        onClick={() => handleForceReset(u.id, u.fullName)}
                        title="Generate temporary password"
                        className="px-2 py-1 text-[10.5px] font-bold rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors flex items-center gap-1"
                      >
                        <KeyRound className="w-3 h-3 text-amber-600" />
                        <span>Reset Pass</span>
                      </button>

                      {/* Toggle status (Super admin only, not on self) */}
                      {user?.role === 'super_admin' && u.id !== user.id && (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u.id, u.isActive, u.fullName)}
                          className={`px-2 py-1 text-[10.5px] font-bold rounded-md transition-colors flex items-center gap-1 ${
                            u.isActive
                              ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200'
                              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {u.isActive ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                          <span>{u.isActive ? 'Deactivate' : 'Activate'}</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Force Reset Modal */}
      {resetModalInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <span>Password Reset Generated</span>
              </h3>
              <button
                onClick={() => setResetModalInfo(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {resetModalInfo.loading ? (
              <div className="py-8 text-center space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                <p className="text-xs text-slate-500">Generating secure cryptographic credentials...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  A temporary password has been initialized for <strong>{resetModalInfo.userName}</strong>. All active sessions have been invalidated.
                </p>

                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl space-y-1">
                  <span className="text-[10.5px] font-bold text-amber-800 uppercase tracking-wider">Temporary Password</span>
                  <div className="flex items-center justify-between font-mono font-black text-slate-900 text-base">
                    <span>{resetModalInfo.tempPassword}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (resetModalInfo.tempPassword) {
                          navigator.clipboard.writeText(resetModalInfo.tempPassword);
                          alert('Temporary password copied to clipboard!');
                        }
                      }}
                      className="p-1 hover:bg-amber-200 rounded text-amber-800"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  Instruct the user to sign in using this temporary credential and promptly change their password under their profile tab.
                </p>

                <button
                  type="button"
                  onClick={() => setResetModalInfo(null)}
                  className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold mt-2"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create User Account Modal */}
      {createUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-700" />
                <span>Create Institutional User Profile</span>
              </h3>
              <button
                onClick={() => setCreateUserOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 font-semibold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. Mr. Augustine Baidoo"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Username</label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. teacher.baidoo"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Institutional Email</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="e.g. abaidoo@nkrofulagric.edu.gh"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Role Profile</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-semibold"
                  >
                    <option value="super_admin">Super Administrator</option>
                    <option value="headmaster">Headmaster</option>
                    <option value="assistant_headmaster">Assistant Headmaster</option>
                    <option value="form_master">Form Master / Class Teacher</option>
                    <option value="teacher">Subject Teacher</option>
                    <option value="accountant">Accountant / Bursar</option>
                    <option value="student">Student</option>
                    <option value="parent">Parent</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Initial Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Phone Number (Optional)</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+233 24 000 0000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateUserOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {createLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  <span>Provision Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
