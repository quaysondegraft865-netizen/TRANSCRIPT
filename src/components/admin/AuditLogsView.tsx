import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Search, Filter, RefreshCw, AlertCircle, CheckCircle, LogOut, Key } from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  eventType: string;
  userIdentifier: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
}

export const AuditLogsView: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('');

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.set('q', searchQuery);
      if (selectedEventType) queryParams.set('event', selectedEventType);

      const res = await fetch(`/api/auth/audit-logs?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedEventType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'LOGIN_SUCCESS':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">LOGIN SUCCESS</span>;
      case 'LOGIN_FAILED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">LOGIN FAILED</span>;
      case 'LOGOUT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">LOGOUT</span>;
      case 'PASSWORD_RESET_REQUESTED':
      case 'PASSWORD_RESET_COMPLETED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">{type.replace(/_/g, ' ')}</span>;
      case 'ACCOUNT_ACTIVATED':
      case 'ACCOUNT_DEACTIVATED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">{type.replace(/_/g, ' ')}</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">{type}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-600" />
              <span>Authentication & Security Audit Logs</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable security event trails for Nkroful Agric SHS Portal
            </p>
          </div>

          <button
            type="button"
            onClick={fetchLogs}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors flex items-center gap-1.5 self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Logs</span>
          </button>
        </div>

        {/* Filter Controls */}
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="sm:col-span-2 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by user identifier, IP, or details..."
              className="w-full pl-8 pr-2.5 py-1.5 bg-white text-slate-900 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 font-medium"
            />
          </div>

          <div>
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="w-full bg-white text-slate-900 border border-slate-300 rounded px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Event Types</option>
              <option value="LOGIN_SUCCESS">Login Success</option>
              <option value="LOGIN_FAILED">Login Failed</option>
              <option value="LOGOUT">Logout</option>
              <option value="PASSWORD_RESET_REQUESTED">Password Reset Request</option>
              <option value="PASSWORD_RESET_COMPLETED">Password Reset Done</option>
              <option value="ACCOUNT_DEACTIVATED">Account Deactivated</option>
              <option value="ACCOUNT_ACTIVATED">Account Activated</option>
            </select>
          </div>
        </form>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3 w-40">Timestamp</th>
                <th className="py-2.5 px-3 w-36">Event Type</th>
                <th className="py-2.5 px-3 w-48">User Identifier</th>
                <th className="py-2.5 px-3">Security Details</th>
                <th className="py-2.5 px-3 w-32">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 odd:bg-white even:bg-slate-50/40">
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                      {new Date(log.timestamp).toLocaleString('en-GB')}
                    </td>
                    <td className="py-2 px-3">
                      {getEventBadge(log.eventType)}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-900">
                      {log.userIdentifier}
                    </td>
                    <td className="py-2 px-3 text-slate-700">
                      {log.details || '—'}
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-500">
                      {log.ipAddress || 'internal'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    {isLoading ? 'Loading audit trail logs...' : 'No security audit logs found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
