import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAllStudents } from '../../data/schoolData';
import { TerminalReportView } from '../TerminalReportView';
import { TranscriptView } from '../TranscriptView';
import { Users, FileText, CheckCircle2, Award } from 'lucide-react';

export const ParentPortalView: React.FC = () => {
  const { user } = useAuth();
  const allStudents = useMemo(() => getAllStudents(), []);

  const linkedStudent = useMemo(() => {
    return (
      allStudents.find((s) => s.indexNumber === user?.studentIndexNo) ||
      allStudents.find((s) => s.name === user?.linkedStudentName) ||
      allStudents[0]
    );
  }, [user, allStudents]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-rose-900 via-indigo-950 to-slate-900 text-white rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 font-black text-base grid place-items-center shadow-md">
            PG
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm md:text-base font-bold text-white tracking-wide">
                Parent / Guardian Portal
              </span>
              <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded">
                Verified Guardian
              </span>
            </div>
            <div className="text-xs text-rose-200 mt-0.5">
              Ward: <strong className="text-white">{linkedStudent?.name}</strong> · Index:{' '}
              <strong className="text-white font-mono">{linkedStudent?.indexNumber}</strong> · Class:{' '}
              <strong className="text-white">{linkedStudent?.className}</strong>
            </div>
          </div>
        </div>
      </div>

      {linkedStudent && (
        <TerminalReportView showToast={() => {}} />
      )}
    </div>
  );
};
