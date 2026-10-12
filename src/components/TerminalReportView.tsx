import React, { useState, useMemo } from 'react';
import {
  ALL_CLASSES,
  FORM1_CLASSES,
  FORM2_CLASSES,
  getAllStudents,
  SCHOOL_INFO,
} from '../data/schoolData';
import { Student, TermRecord, TranscriptProfile } from '../types';
import { generateStudentTranscript } from '../utils/storage';
import { Printer, Search, FileText, CheckCircle2, UserCheck } from 'lucide-react';

interface TerminalReportViewProps {
  showToast: (msg: string) => void;
}

export const TerminalReportView: React.FC<TerminalReportViewProps> = ({ showToast }) => {
  const allStudents = useMemo(() => getAllStudents(), []);

  const [selectedClassKey, setSelectedClassKey] = useState<string>('f1-agric-1');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(allStudents[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const classStudents = useMemo(() => {
    return allStudents.filter((s) => s.classKey === selectedClassKey);
  }, [allStudents, selectedClassKey]);

  const activeStudent = useMemo(() => {
    const found = allStudents.find((s) => s.id === selectedStudentId);
    return found || classStudents[0] || allStudents[0];
  }, [allStudents, selectedStudentId, classStudents]);

  const transcript = useMemo(() => {
    if (!activeStudent) return null;
    return generateStudentTranscript(activeStudent);
  }, [activeStudent]);

  const latestTerm = useMemo(() => {
    if (!transcript || transcript.terms.length === 0) return null;
    return transcript.terms[transcript.terms.length - 1];
  }, [transcript]);

  const handlePrint = () => {
    window.print();
    showToast('Printing terminal student report card...');
  };

  return (
    <div className="space-y-6">
      {/* Controls (No Print) */}
      <div className="no-print bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-cyan-600" />
              <span>Student Terminal Report Cards</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Official End-of-Term Assessment Slip & Performance Report
            </p>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-1.5 text-xs font-bold text-white bg-blue-800 hover:bg-blue-900 rounded-md transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report Card</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-500 font-semibold mb-1">
              Select Class ({ALL_CLASSES.length})
            </label>
            <select
              value={selectedClassKey}
              onChange={(e) => {
                setSelectedClassKey(e.target.value);
                const first = allStudents.find((s) => s.classKey === e.target.value);
                if (first) setSelectedStudentId(first.id);
              }}
              className="w-full bg-white text-slate-900 border border-slate-300 rounded px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-blue-500"
            >
              {ALL_CLASSES.map((cls) => (
                <option key={cls.key} value={cls.key}>
                  {cls.name} ({cls.form === 'form1' ? 'Form 1' : 'Form 2'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">
              Select Student ({classStudents.length})
            </label>
            <select
              value={activeStudent?.id || ''}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full bg-white text-slate-900 border border-slate-300 rounded px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-blue-500 truncate"
            >
              {classStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.indexNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">
              Search by Student Name
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value) {
                    const match = allStudents.find((s) =>
                      s.name.toLowerCase().includes(e.target.value.toLowerCase())
                    );
                    if (match) {
                      setSelectedClassKey(match.classKey);
                      setSelectedStudentId(match.id);
                    }
                  }
                }}
                placeholder="Search any student..."
                className="w-full pl-8 pr-2.5 py-1.5 bg-white text-slate-900 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Terminal Report Document */}
      {activeStudent && latestTerm ? (
        <div className="bg-white border border-slate-300 rounded-lg p-6 md:p-8 max-w-[850px] mx-auto text-slate-900 text-xs shadow-sm print:border-none print:shadow-none print:p-0 print:w-full">
          {/* Header */}
          <div className="text-center pb-4 border-b-2 border-slate-900">
            <div className="flex items-center justify-between mb-2">
              <div className="text-left text-[10px] text-slate-600 font-bold uppercase">
                <div>Ghana Education Service</div>
                <div>Western Region</div>
              </div>
              <div className="w-16 h-16 mx-auto flex items-center justify-center p-1 bg-white border border-slate-200 rounded">
                <img
                  src="/logo.jpg"
                  alt="Nkroful Crest"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-right text-[10px] text-slate-600 font-bold font-mono-numbers">
                <div>{SCHOOL_INFO.gesCode}</div>
                <div>Terminal Report</div>
              </div>
            </div>

            <h2 className="text-base md:text-lg font-black text-slate-950 uppercase tracking-wide">
              {SCHOOL_INFO.name}
            </h2>
            <p className="text-[10px] text-slate-600">
              {SCHOOL_INFO.location} · Motto: "{SCHOOL_INFO.motto}"
            </p>
            <div className="mt-2 inline-block bg-blue-900 text-white font-bold text-xs uppercase px-4 py-0.5 tracking-wider rounded-xs">
              TERMINAL STUDENT REPORT CARD · {latestTerm.semester} {latestTerm.academicYear}
            </div>
          </div>

          {/* Student Biodata Summary */}
          <div className="my-4 bg-slate-50 border border-slate-300 rounded p-3 print:bg-transparent">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 block text-[9.5px] uppercase font-bold">Name</span>
                <span className="font-extrabold text-slate-950 text-xs">{activeStudent.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px] uppercase font-bold">Index No.</span>
                <span className="font-bold text-blue-900 font-mono-numbers">{activeStudent.indexNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px] uppercase font-bold">Class</span>
                <span className="font-bold text-slate-900">{activeStudent.className}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px] uppercase font-bold">Program</span>
                <span className="font-bold text-slate-900">{activeStudent.program}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px] uppercase font-bold">Position in Class</span>
                <span className="font-black text-amber-700 font-mono-numbers">
                  {latestTerm.position} out of {latestTerm.classSize}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px] uppercase font-bold">Attendance</span>
                <span className="font-semibold text-slate-800 font-mono-numbers">
                  {latestTerm.attendanceDays} / {latestTerm.totalDays} Days
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px] uppercase font-bold">Term GPA</span>
                <span className="font-extrabold text-emerald-800 font-mono-numbers">
                  {latestTerm.gpa.toFixed(2)} / 4.00
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9.5px] uppercase font-bold">Academic Status</span>
                <span className="font-bold text-blue-800">
                  {latestTerm.gpa >= 3.0 ? 'Promoted with Honours' : 'Promoted'}
                </span>
              </div>
            </div>
          </div>

          {/* Subject Performance Breakdown Table */}
          <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-800 text-white font-bold text-[10px] uppercase">
                <th className="py-2 px-3 border border-slate-600">Subject</th>
                <th className="py-2 px-2 text-center border border-slate-600 w-16">Class SBA (60)</th>
                <th className="py-2 px-2 text-center border border-slate-600 w-16">Exam (40)</th>
                <th className="py-2 px-2 text-center border border-slate-600 w-16 bg-slate-900 font-black">Total (100)</th>
                <th className="py-2 px-2 text-center border border-slate-600 w-12">Grade</th>
                <th className="py-2 px-2 text-center border border-slate-600 w-14">Position</th>
                <th className="py-2 px-3 border border-slate-600">Teacher Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {latestTerm.results.map((r, i) => (
                <tr key={r.subjectCode + i} className="hover:bg-slate-50">
                  <td className="py-1.5 px-3 font-semibold text-slate-900 border border-slate-200">
                    {r.subjectName}
                  </td>
                  <td className="py-1.5 px-2 text-center font-mono-numbers text-slate-700 border border-slate-200">
                    {r.classScore}
                  </td>
                  <td className="py-1.5 px-2 text-center font-mono-numbers text-slate-700 border border-slate-200">
                    {r.examScore}
                  </td>
                  <td className="py-1.5 px-2 text-center font-mono-numbers font-bold text-slate-950 bg-slate-100 border border-slate-200">
                    {r.totalScore}
                  </td>
                  <td className="py-1.5 px-2 text-center font-bold font-mono-numbers text-blue-900 border border-slate-200">
                    {r.waecGrade}
                  </td>
                  <td className="py-1.5 px-2 text-center font-mono-numbers text-slate-600 border border-slate-200">
                    {Math.max(1, Math.floor((1 - r.totalScore / 100) * 40) + 1)}th
                  </td>
                  <td className="py-1.5 px-3 text-slate-700 border border-slate-200 text-[10.5px]">
                    {r.remarks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Conduct & Remarks Panel */}
          <div className="mt-4 space-y-2 border border-slate-300 rounded p-3 text-[11px]">
            <div>
              <span className="font-bold text-slate-900 uppercase text-[10px]">Conduct & Attitude:</span>{' '}
              <span className="text-slate-800 italic">{latestTerm.conductRemarks}</span>
            </div>
            <div>
              <span className="font-bold text-slate-900 uppercase text-[10px]">Form Master's Remarks:</span>{' '}
              <span className="text-slate-800 italic">{latestTerm.teacherRemarks}</span>
            </div>
            <div>
              <span className="font-bold text-slate-900 uppercase text-[10px]">Headmaster's Endorsement:</span>{' '}
              <span className="text-slate-800 italic">{latestTerm.headmasterRemarks}</span>
            </div>
          </div>

          {/* Academic Calendar Notices & Next Term Information */}
          <div className="mt-3 grid grid-cols-2 gap-3 p-2.5 bg-slate-50 border border-slate-300 rounded text-[10.5px]">
            <div>
              <span className="font-bold text-slate-900 uppercase text-[9px] block">Next Term Reopening Date:</span>
              <span className="font-bold text-blue-900">Tuesday, 12th January, 2027</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-slate-900 uppercase text-[9px] block">Estimated Bills & PTA Levy:</span>
              <span className="font-bold text-emerald-800 font-mono">GH¢ 850.00 (Cleared: Paid)</span>
            </div>
          </div>

          {/* Signatures & Official Stamp */}
          <div className="mt-5 pt-3 border-t border-slate-300 flex items-end justify-between text-center">
            <div className="w-44 text-center">
              <div className="h-8 border-b border-dashed border-slate-600 font-serif italic text-slate-800 text-xs flex items-center justify-center">
                {ALL_CLASSES.find((c) => c.key === activeStudent.classKey)?.defaultTeacher || 'Class Master'}
              </div>
              <div className="text-[9.5px] font-bold text-slate-800 mt-1 uppercase">Form Master Signature</div>
            </div>

            <div className="w-36 text-center">
              <div className="w-20 h-20 mx-auto rounded-full border-2 border-dashed border-blue-900 p-1 flex flex-col items-center justify-center text-[7.5px] font-black text-blue-950 uppercase tracking-tighter leading-tight bg-blue-50/50">
                <span className="text-[6.5px] text-amber-700">★ GES ★</span>
                <span>OFFICIAL SEAL</span>
                <span className="text-[7px]">NKROFUL AGRIC SHS</span>
                <span className="text-[6.5px] text-emerald-700 font-bold">APPROVED</span>
              </div>
            </div>

            <div className="w-44 text-center">
              <div className="h-8 border-b border-dashed border-slate-600 font-serif italic text-slate-800 text-xs flex items-center justify-center">
                {SCHOOL_INFO.headmaster}
              </div>
              <div className="text-[9.5px] font-bold text-slate-800 mt-1 uppercase">Headmaster Signature</div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
