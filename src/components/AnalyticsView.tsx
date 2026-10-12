import React, { useMemo } from 'react';
import {
  ALL_CLASSES,
  FORM1_CLASSES,
  FORM2_CLASSES,
  getAllStudents,
  SCHOOL_INFO,
} from '../data/schoolData';
import { generateStudentTranscript } from '../utils/storage';
import { PieChart, TrendingUp, Users, Award, BookOpen, Printer } from 'lucide-react';

interface AnalyticsViewProps {
  onOpenTranscriptForStudent: (studentName: string, classKey: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  onOpenTranscriptForStudent,
}) => {
  const allStudents = useMemo(() => getAllStudents(), []);

  // Program metrics
  const programStats = useMemo(() => {
    const counts: Record<string, number> = {};
    allStudents.forEach((s) => {
      counts[s.program] = (counts[s.program] || 0) + 1;
    });
    return counts;
  }, [allStudents]);

  // Honor roll: Top 10 highest cumulative GPA students across the entire school
  const honorRoll = useMemo(() => {
    const list = allStudents.map((s) => {
      const t = generateStudentTranscript(s);
      return {
        student: s,
        cgpa: t.cumulativeGpa,
        credits: t.totalCreditsEarned,
      };
    });
    return list.sort((a, b) => b.cgpa - a.cgpa).slice(0, 10);
  }, [allStudents]);

  const f1Count = allStudents.filter((s) => s.form === 'form1').length;
  const f2Count = allStudents.filter((s) => s.form === 'form2').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg p-4 shadow-xs no-print">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <PieChart className="w-6 h-6 text-rose-600" />
            <span>Academic Performance & Enrollment Analytics</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Institutional overview and top student performance metrics · 2026/2027 Academic Year
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-1.5 text-xs font-bold text-white bg-blue-800 hover:bg-blue-900 rounded-md transition-colors shadow-xs flex items-center gap-1.5"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Analytics Report</span>
        </button>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
            <span>Total Enrolment</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-950 font-mono-numbers mt-2">
            {allStudents.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Form 1: <strong>{f1Count}</strong> · Form 2: <strong>{f2Count}</strong>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
            <span>Total Classes</span>
            <BookOpen className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-800 font-mono-numbers mt-2">
            {ALL_CLASSES.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {FORM1_CLASSES.length} in Form 1 · {FORM2_CLASSES.length} in Form 2
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
            <span>Average Class Size</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-800 font-mono-numbers mt-2">
            {(allStudents.length / ALL_CLASSES.length).toFixed(0)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Range: 12 to 77 students per stream
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
            <span>Honor Roll Candidates</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-800 font-mono-numbers mt-2">
            {honorRoll.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            CGPA &ge; 3.60 on 4.00 Ghana grading scale
          </div>
        </div>
      </div>

      {/* Program Distribution & Top Performers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Program Breakdown */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
            <span>Enrolment by Academic Program</span>
            <span className="text-xs text-slate-500 font-mono-numbers">7 Tracks</span>
          </h2>
          <div className="mt-4 space-y-3">
            {Object.entries(programStats).map(([prog, count]) => {
              const percentage = ((count / allStudents.length) * 100).toFixed(1);
              return (
                <div key={prog}>
                  <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1">
                    <span>{prog}</span>
                    <span className="font-mono-numbers text-slate-600">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-700 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 10 Honor Roll */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
            <span>School Honor Roll (Top 10 CGPA)</span>
            <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> High Distinction
            </span>
          </h2>

          <div className="mt-3 divide-y divide-slate-100 text-xs">
            {honorRoll.map((item, idx) => (
              <div
                key={item.student.id}
                className="py-2 flex items-center justify-between hover:bg-slate-50 px-1 rounded transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] grid place-items-center font-mono-numbers shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">
                      {item.student.name}
                    </div>
                    <div className="text-[10.5px] text-slate-500">
                      {item.student.className} · {item.student.program}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-black text-emerald-700 font-mono-numbers text-sm">
                    {item.cgpa.toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenTranscriptForStudent(item.student.name, item.student.classKey)
                    }
                    className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold underline"
                  >
                    Transcript
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
