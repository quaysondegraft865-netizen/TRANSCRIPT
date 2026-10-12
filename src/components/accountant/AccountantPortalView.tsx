import React, { useState, useMemo } from 'react';
import { getAllStudents, SCHOOL_INFO } from '../../data/schoolData';
import { DollarSign, CheckCircle2, AlertCircle, Search, Filter, Printer, FileText } from 'lucide-react';

export const AccountantPortalView: React.FC = () => {
  const allStudents = useMemo(() => getAllStudents(), []);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'cleared' | 'pending'>('all');

  // Deterministic fee ledger for students
  const feeRecords = useMemo(() => {
    return allStudents.map((std, idx) => {
      // Deterministic clearance based on index
      const isCleared = (idx % 5 !== 0); // 80% cleared
      const balance = isCleared ? 0 : 350 + (idx % 3) * 120;
      return {
        student: std,
        termFee: 850,
        paid: isCleared ? 850 : 850 - balance,
        balance,
        status: isCleared ? 'Cleared' : 'Pending',
        receiptNo: `REC-2026-${String(idx + 1).padStart(4, '0')}`,
      };
    });
  }, [allStudents]);

  const filteredRecords = feeRecords.filter((r) => {
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'cleared' && r.status === 'Cleared') ||
      (filterStatus === 'pending' && r.status === 'Pending');
    const matchQuery =
      !searchQuery ||
      r.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.student.indexNumber.includes(searchQuery);
    return matchStatus && matchQuery;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-amber-600" />
              <span>Bursary & Student Academic Financial Clearance</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Terminal fee clearance verification (2026/2027 Academic Year) before transcript and report issuance
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-800 hover:bg-blue-900 rounded-md transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Ledger</span>
          </button>
        </div>

        {/* Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student or index number..."
              className="w-full pl-8 pr-2.5 py-1.5 bg-white text-slate-900 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 text-xs font-medium"
            />
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full bg-white text-slate-900 border border-slate-300 rounded px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Clearance Statuses</option>
              <option value="cleared">Cleared for Transcript & Report</option>
              <option value="pending">Pending Balance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3 w-12">#</th>
                <th className="py-2.5 px-3 w-28">Index No</th>
                <th className="py-2.5 px-3 min-w-[180px]">Student Name</th>
                <th className="py-2.5 px-3">Class</th>
                <th className="py-2.5 px-3 text-right">Term Fee (GH₵)</th>
                <th className="py-2.5 px-3 text-right">Paid (GH₵)</th>
                <th className="py-2.5 px-3 text-right">Balance (GH₵)</th>
                <th className="py-2.5 px-3 text-center w-28">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRecords.slice(0, 50).map((r, idx) => (
                <tr key={r.student.id} className="hover:bg-slate-50 odd:bg-white even:bg-slate-50/40">
                  <td className="py-2 px-3 font-mono text-slate-500">{idx + 1}</td>
                  <td className="py-2 px-3 font-mono font-semibold text-blue-900">{r.student.indexNumber}</td>
                  <td className="py-2 px-3 font-bold text-slate-900">{r.student.name}</td>
                  <td className="py-2 px-3 text-slate-700">{r.student.className}</td>
                  <td className="py-2 px-3 text-right font-mono font-medium">{r.termFee.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right font-mono text-emerald-700 font-semibold">{r.paid.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right font-mono text-amber-800 font-bold">{r.balance.toFixed(2)}</td>
                  <td className="py-2 px-3 text-center">
                    {r.status === 'Cleared' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        CLEARED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        PENDING
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
