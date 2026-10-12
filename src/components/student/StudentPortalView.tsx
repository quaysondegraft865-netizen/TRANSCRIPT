import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAllStudents } from '../../data/schoolData';
import { generateStudentTranscript } from '../../utils/storage';
import { TranscriptView } from '../TranscriptView';
import { TerminalReportView } from '../TerminalReportView';
import { Award, FileText, CheckCircle2, Shield, Printer, BookOpen } from 'lucide-react';

export const StudentPortalView: React.FC = () => {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'transcript' | 'report'>('transcript');

  const allStudents = useMemo(() => getAllStudents(), []);

  // Find the exact student corresponding to this student account
  const studentRecord = useMemo(() => {
    if (!user) return null;
    return (
      allStudents.find((s) => s.indexNumber === user.studentIndexNo) ||
      allStudents.find((s) => s.name.toLowerCase() === user.fullName.toLowerCase()) ||
      allStudents[0]
    );
  }, [user, allStudents]);

  const transcript = useMemo(() => {
    if (!studentRecord) return null;
    return generateStudentTranscript(studentRecord);
  }, [studentRecord]);

  return (
    <div className="space-y-6">
      {/* Student Welcome Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 font-black text-base grid place-items-center shadow-md">
            {studentRecord?.name.slice(0, 2) || 'ST'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm md:text-base font-bold text-white tracking-wide">
                {studentRecord?.name}
              </span>
              <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded">
                Verified Student
              </span>
            </div>
            <div className="text-xs text-blue-200 mt-0.5">
              Index: <strong className="text-white font-mono">{studentRecord?.indexNumber}</strong> · Class:{' '}
              <strong className="text-white">{studentRecord?.className}</strong> ({studentRecord?.program})
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 bg-white/10 p-1 rounded-lg self-start md:self-auto no-print">
          <button
            type="button"
            onClick={() => setActiveSubTab('transcript')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              activeSubTab === 'transcript'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>My Official Transcript</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('report')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              activeSubTab === 'report'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>My Terminal Report</span>
          </button>
        </div>
      </div>

      {/* Render student specific document */}
      {studentRecord && (
        <div className="mt-4">
          {activeSubTab === 'transcript' ? (
            <TranscriptView
              initialStudentName={studentRecord.name}
              initialClassKey={studentRecord.classKey}
              showToast={() => {}}
            />
          ) : (
            <TerminalReportView showToast={() => {}} />
          )}
        </div>
      )}
    </div>
  );
};
