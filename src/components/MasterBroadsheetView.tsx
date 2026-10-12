import React, { useState, useMemo } from 'react';
import {
  ALL_CLASSES,
  FORM1_CLASSES,
  FORM2_CLASSES,
  getAllStudents,
  SCHOOL_INFO,
  SUBJECTS_BY_TRACK,
  calculateGrade,
} from '../data/schoolData';
import { generateStudentTranscript } from '../utils/storage';
import { Printer, Download, Search, BarChart3 } from 'lucide-react';

interface MasterBroadsheetViewProps {
  onOpenTranscriptForStudent?: (studentName: string, classKey: string) => void;
  showToast: (msg: string) => void;
}

export const MasterBroadsheetView: React.FC<MasterBroadsheetViewProps> = ({
  onOpenTranscriptForStudent,
  showToast,
}) => {
  const allStudents = useMemo(() => getAllStudents(), []);

  const [selectedClassKey, setSelectedClassKey] = useState<string>('f1-agric-1');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const currentClassDef = useMemo(() => {
    return ALL_CLASSES.find((c) => c.key === selectedClassKey) || ALL_CLASSES[0];
  }, [selectedClassKey]);

  const classStudents = useMemo(() => {
    return allStudents.filter((s) => s.classKey === currentClassDef.key);
  }, [allStudents, currentClassDef]);

  const trackSubjects = useMemo(() => {
    return SUBJECTS_BY_TRACK[currentClassDef.program] || SUBJECTS_BY_TRACK['General Arts'];
  }, [currentClassDef]);

  // Generate broadsheet rows with ranked scores
  const broadsheetRows = useMemo(() => {
    const rows = classStudents.map((std, idx) => {
      const transcript = generateStudentTranscript(std);
      const latestTerm = transcript.terms[transcript.terms.length - 1];
      const results = latestTerm?.results || [];

      // Calculate total marks across subjects
      const totalMarks = results.reduce((acc, r) => acc + r.totalScore, 0);
      const avgMarks = Number((totalMarks / (results.length || 1)).toFixed(1));

      return {
        student: std,
        originalIndex: idx + 1,
        results,
        totalMarks,
        avgMarks,
        gpa: latestTerm?.gpa || 0,
      };
    });

    // Rank rows by totalMarks descending
    const sorted = [...rows].sort((a, b) => b.totalMarks - a.totalMarks);
    return sorted.map((row, rankIdx) => ({
      ...row,
      rank: rankIdx + 1,
    }));
  }, [classStudents]);

  // Filtered rows by search
  const filteredRows = useMemo(() => {
    if (!searchQuery) return broadsheetRows;
    return broadsheetRows.filter((r) =>
      r.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.student.indexNumber.includes(searchQuery)
    );
  }, [broadsheetRows, searchQuery]);

  // Export to CSV
  const handleExportCSV = () => {
    let headers = `Rank,N/S,Index No,Student Name,`;
    trackSubjects.forEach((sub) => {
      headers += `${sub.name} (100),`;
    });
    headers += `Total Marks,Average %,GPA,Status\n`;

    let rowsText = '';
    broadsheetRows.forEach((r) => {
      let row = `"${r.rank}","${r.originalIndex}","${r.student.indexNumber}","${r.student.name}",`;
      trackSubjects.forEach((sub) => {
        const found = r.results.find((res) => res.subjectCode === sub.code);
        row += `"${found ? found.totalScore : '-'}",`;
      });
      row += `"${r.totalMarks}","${r.avgMarks}","${r.gpa.toFixed(2)}","${r.avgMarks >= 50 ? 'Passed' : 'Failed'}"\n`;
      rowsText += row;
    });

    const blob = new Blob([headers + rowsText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentClassDef.name}_Master_Broadsheet.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Broadsheet CSV exported.');
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs no-print space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-amber-600" />
              <span>Master Broadsheet & Class Rankings</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive Multi-Subject Master Ledger for Nkroful Agric SHS
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Broadsheet</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-800 hover:bg-blue-900 rounded-md transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Broadsheet</span>
            </button>
          </div>
        </div>

        {/* Class Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-500 font-semibold mb-1">
              Select Class ({ALL_CLASSES.length} Classes)
            </label>
            <select
              value={selectedClassKey}
              onChange={(e) => setSelectedClassKey(e.target.value)}
              className="w-full bg-white text-slate-900 border border-slate-300 rounded px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-blue-500"
            >
              {ALL_CLASSES.map((cls) => (
                <option key={cls.key} value={cls.key}>
                  {cls.name} · {cls.program} ({cls.students.length} students)
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
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter ranked students..."
                className="w-full pl-8 pr-2.5 py-1.5 bg-white text-slate-900 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>

          <div className="flex items-end">
            <div className="p-2 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600 w-full">
              Form Master: <strong>{currentClassDef.defaultTeacher || 'Mr. De-Graft Quayson'}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Broadsheet Container */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        {/* Printable Official Heading */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Crest" className="w-10 h-10 object-contain rounded" />
            <div>
              <div className="text-sm font-extrabold text-blue-950 uppercase">
                {SCHOOL_INFO.name} · MASTER BROADSHEET
              </div>
              <div className="text-xs text-slate-600">
                Class: <strong className="text-slate-900">{currentClassDef.name}</strong> · Program: <strong className="text-slate-900">{currentClassDef.program}</strong> · Academic Year 2026/2027
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-600 font-mono-numbers">
            Class Size: <strong>{classStudents.length}</strong> Students · Evaluated: <strong>{trackSubjects.length}</strong> Subjects
          </div>
        </div>

        {/* Dense Broadsheet Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-slate-900 to-blue-950 text-white font-bold text-[10px] uppercase">
                <th className="py-2 px-2 text-center w-12 border-r border-white/10">Rank</th>
                <th className="py-2 px-2 text-center w-12 border-r border-white/10">N/S</th>
                <th className="py-2 px-2.5 w-24 border-r border-white/10">Index No</th>
                <th className="py-2 px-3 min-w-[180px] border-r border-white/10">Student Full Name</th>

                {/* Subject Columns */}
                {trackSubjects.map((sub) => (
                  <th
                    key={sub.code}
                    className="py-2 px-1.5 text-center w-20 border-r border-white/10"
                    title={sub.name}
                  >
                    <div className="truncate font-semibold">{sub.name.slice(0, 8)}..</div>
                    <span className="text-[8.5px] opacity-75 font-normal block lowercase">/100</span>
                  </th>
                ))}

                <th className="py-2 px-2 text-center w-16 bg-amber-500 text-slate-950 font-black border-r border-white/10">
                  Total
                </th>
                <th className="py-2 px-2 text-center w-16 bg-emerald-600 text-white font-black border-r border-white/10">
                  Avg %
                </th>
                <th className="py-2 px-2 text-center w-14 bg-indigo-700 text-white font-black border-r border-white/10">
                  GPA
                </th>
                <th className="py-2 px-2 text-center w-16 no-print">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRows.map((row) => (
                <tr
                  key={row.student.id}
                  className="hover:bg-blue-50/60 transition-colors odd:bg-white even:bg-slate-50/40"
                >
                  <td className="py-1.5 px-2 text-center font-bold font-mono-numbers text-slate-900 bg-amber-50/40">
                    {row.rank === 1 ? '🥇 1st' : row.rank === 2 ? '🥈 2nd' : row.rank === 3 ? '🥉 3rd' : `${row.rank}th`}
                  </td>
                  <td className="py-1.5 px-2 text-center text-slate-500 font-mono-numbers">
                    {row.originalIndex}
                  </td>
                  <td className="py-1.5 px-2.5 font-mono-numbers text-blue-900 font-semibold text-[10.5px]">
                    {row.student.indexNumber}
                  </td>
                  <td className="py-1.5 px-3 font-semibold text-slate-900">
                    {row.student.name}
                  </td>

                  {/* Subject Scores */}
                  {trackSubjects.map((sub) => {
                    const result = row.results.find((r) => r.subjectCode === sub.code);
                    const score = result ? result.totalScore : 0;
                    return (
                      <td
                        key={sub.code}
                        className={`py-1.5 px-1.5 text-center font-mono-numbers font-medium ${
                          score >= 80
                            ? 'text-emerald-700 font-bold bg-emerald-50/30'
                            : score >= 60
                            ? 'text-slate-800'
                            : score >= 50
                            ? 'text-amber-700'
                            : 'text-red-600 font-bold bg-red-50/30'
                        }`}
                      >
                        {score}
                      </td>
                    );
                  })}

                  <td className="py-1.5 px-2 text-center font-bold font-mono-numbers text-slate-900 bg-amber-50">
                    {row.totalMarks}
                  </td>
                  <td className="py-1.5 px-2 text-center font-bold font-mono-numbers text-emerald-800 bg-emerald-50">
                    {row.avgMarks}%
                  </td>
                  <td className="py-1.5 px-2 text-center font-bold font-mono-numbers text-indigo-900 bg-indigo-50">
                    {row.gpa.toFixed(2)}
                  </td>
                  <td className="py-1.5 px-2 text-center no-print">
                    <button
                      type="button"
                      onClick={() => onOpenTranscriptForStudent?.(row.student.name, currentClassDef.key)}
                      className="text-blue-700 hover:text-blue-900 text-[10px] font-semibold underline"
                    >
                      Transcript
                    </button>
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
