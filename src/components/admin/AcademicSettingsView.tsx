import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AcademicSystemSettings } from '../../types';
import { SCHOOL_INFO } from '../../data/schoolData';
import {
  Calendar,
  Save,
  CheckCircle2,
  Lock,
  Unlock,
  Building,
  DollarSign,
  PieChart,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface AcademicSettingsViewProps {
  showToast?: (msg: string) => void;
}

export const AcademicSettingsView: React.FC<AcademicSettingsViewProps> = ({ showToast }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AcademicSystemSettings>({
    academicYear: '2026/2027',
    activeSemester: 'Term 1',
    semesterStartDate: '2026-09-08',
    vacationDate: '2026-12-18',
    reopeningDate: '2027-01-12',
    nextTermFees: 850.0,
    sbaWeightPercentage: 30,
    examWeightPercentage: 70,
    resultsApproved: true,
    approvedBy: 'Mr. Emmanuel Armah-Blay (Headmaster)',
    approvalDate: '2026-10-05',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/system/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch settings', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/system/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      setIsSaving(false);

      if (res.ok) {
        setStatusMessage('Academic calendar and institutional settings saved successfully!');
        showToast?.('Settings updated across school reports.');
        setTimeout(() => setStatusMessage(null), 4000);
      } else {
        alert(data.error || 'Failed to update settings.');
      }
    } catch {
      setIsSaving(false);
      alert('Network request failed.');
    }
  };

  const handleToggleApproval = async () => {
    const nextState = !settings.resultsApproved;
    const confirmMsg = nextState
      ? 'Are you sure you want to officially APPROVE and ENDORSE all terminal examination results for this session?'
      : 'Are you sure you want to UNLOCK terminal results for further teacher score revisions?';

    if (!window.confirm(confirmMsg)) return;

    setIsApproving(true);
    try {
      const res = await fetch('/api/system/approve-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approve: nextState }),
      });
      const data = await res.json();
      setIsApproving(false);

      if (res.ok) {
        setSettings((prev) => ({
          ...prev,
          resultsApproved: data.resultsApproved,
          approvedBy: data.approvedBy,
          approvalDate: data.approvalDate,
        }));
        showToast?.(
          nextState
            ? 'Results officially approved and locked by Headmaster.'
            : 'Results unlocked for teacher score corrections.'
        );
      } else {
        alert(data.error || 'Failed to change approval status.');
      }
    } catch {
      setIsApproving(false);
      alert('Network error.');
    }
  };

  const canManage =
    user?.role === 'super_admin' ||
    user?.role === 'headmaster' ||
    user?.role === 'assistant_headmaster';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-indigo-700" />
            <span>Academic Calendar & Term Configuration</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Institutional terms, reopening dates, fee levies, and official result endorsement for {SCHOOL_INFO.name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-lg text-xs font-bold font-mono">
            Active: {settings.academicYear} · {settings.activeSemester}
          </span>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-semibold text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Headmaster Approval Card */}
      <div className={`p-5 rounded-xl border transition-all ${
        settings.resultsApproved
          ? 'bg-emerald-50/60 border-emerald-300'
          : 'bg-amber-50/60 border-amber-300'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`p-3 rounded-xl ${settings.resultsApproved ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>
              {settings.resultsApproved ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {settings.resultsApproved
                    ? 'Terminal Results Officially Approved & Locked'
                    : 'Terminal Results In Draft / Entry Mode'}
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  settings.resultsApproved ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                }`}>
                  {settings.resultsApproved ? 'Endorsed' : 'Unlocked'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {settings.resultsApproved
                  ? `Approved by ${settings.approvedBy || 'The Headmaster'} on ${settings.approvalDate || '2026-10-05'}. Reports & transcripts carry the official seal.`
                  : 'Teachers are currently permitted to enter and edit continuous assessment and exam scores.'}
              </p>
            </div>
          </div>

          {canManage && (
            <button
              onClick={handleToggleApproval}
              disabled={isApproving}
              type="button"
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors whitespace-nowrap shadow-xs ${
                settings.resultsApproved
                  ? 'bg-white border border-rose-300 text-rose-700 hover:bg-rose-50'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
            >
              {isApproving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : settings.resultsApproved ? (
                <Unlock className="w-4 h-4" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              <span>{settings.resultsApproved ? 'Unlock for Revisions' : 'Approve & Endorse Results'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSaveSettings} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Academic Year Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-indigo-700" />
              <span>Current Academic Year</span>
            </label>
            <select
              value={settings.academicYear}
              onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })}
              disabled={!canManage}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="2026/2027">2026/2027 (Current Academic Year)</option>
              <option value="2027/2028">2027/2028 (Upcoming Academic Year)</option>
              <option value="2028/2029">2028/2029</option>
            </select>
            <p className="text-[11px] text-slate-400">
              The portal strictly starts with the 2026/2027 academic session.
            </p>
          </div>

          {/* Current Term / Semester */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-700" />
              <span>Current Term / Semester</span>
            </label>
            <select
              value={settings.activeSemester}
              onChange={(e) => setSettings({ ...settings, activeSemester: e.target.value })}
              disabled={!canManage}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="Term 1">Term 1 (First Semester)</option>
              <option value="Term 2">Term 2 (Second Semester)</option>
              <option value="Term 3">Term 3</option>
            </select>
            <p className="text-[11px] text-slate-400">
              Changes propagate dynamically to terminal reports and assessment tabs.
            </p>
          </div>

          {/* Term Dates */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800">Term Start Date</label>
            <input
              type="date"
              value={settings.semesterStartDate}
              onChange={(e) => setSettings({ ...settings, semesterStartDate: e.target.value })}
              disabled={!canManage}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800">Term Vacation / End Date</label>
            <input
              type="date"
              value={settings.vacationDate}
              onChange={(e) => setSettings({ ...settings, vacationDate: e.target.value })}
              disabled={!canManage}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Next Term Reopening Date */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800">
              Next Term Reopening Date <span className="text-indigo-600 font-normal">(Printed on Report Cards)</span>
            </label>
            <input
              type="date"
              value={settings.reopeningDate}
              onChange={(e) => setSettings({ ...settings, reopeningDate: e.target.value })}
              disabled={!canManage}
              className="w-full px-3.5 py-2.5 bg-indigo-50/50 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Next Term Fees */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Next Term Bills & PTA Levy (GH¢)</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={settings.nextTermFees}
              onChange={(e) => setSettings({ ...settings, nextTermFees: parseFloat(e.target.value) || 0 })}
              disabled={!canManage}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Grading Weightings */}
        <div className="pt-4 border-t border-slate-200 space-y-4">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-purple-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              GES Standard Grading Weightings
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span className="text-xs font-bold text-slate-700">Continuous Assessment (SBA Weight)</span>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="30"
                  max="50"
                  step="10"
                  value={settings.sbaWeightPercentage}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setSettings({
                      ...settings,
                      sbaWeightPercentage: val,
                      examWeightPercentage: 100 - val,
                    });
                  }}
                  disabled={!canManage}
                  className="flex-1 accent-indigo-600"
                />
                <span className="font-mono font-black text-indigo-700 text-sm">
                  {settings.sbaWeightPercentage}%
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                School-based assessment (Class tests, project, practicals).
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span className="text-xs font-bold text-slate-700">Terminal Examination Weight</span>
              <div className="flex items-center gap-3">
                <span className="font-mono font-black text-purple-700 text-sm">
                  {settings.examWeightPercentage}%
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                End-of-term standardized examination paper.
              </p>
            </div>
          </div>
        </div>

        {canManage && (
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save & Publish Configuration</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
