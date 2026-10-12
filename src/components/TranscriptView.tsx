import React, { useState, useMemo } from 'react';
import {
  ALL_CLASSES,
  FORM1_CLASSES,
  FORM2_CLASSES,
  getAllStudents,
  SCHOOL_INFO,
} from '../data/schoolData';
import { Student, TranscriptProfile } from '../types';
import { generateStudentTranscript } from '../utils/storage';
import {
  Printer,
  Search,
  Award,
  Layers,
  CheckCircle,
  QrCode,
  FileText,
  School,
  ExternalLink,
} from 'lucide-react';

interface TranscriptViewProps {
  initialStudentName?: string;
  initialClassKey?: string;
  showToast: (msg: string) => void;
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({
  initialStudentName,
  initialClassKey,
  showToast,
}) => {
  const allStudents = useMemo(() => getAllStudents(), []);

  const [selectedForm, setSelectedForm] = useState<'all' | 'form1' | 'form2'>('all');
  const [selectedClassKey, setSelectedClassKey] = useState<string>(
    initialClassKey || 'f1-agric-1'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    if (initialStudentName) {
      const match = allStudents.find((s) => s.name === initialStudentName);
      if (match) return match.id;
    }
    return allStudents[0]?.id || '';
  });
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);

  // Filter classes according to selected form
  const availableClasses = useMemo(() => {
    if (selectedForm === 'form1') return FORM1_CLASSES;
    if (selectedForm === 'form2') return FORM2_CLASSES;
    return ALL_CLASSES;
  }, [selectedForm]);

  // Filter students
  const filteredStudents = useMemo(() => {
    return allStudents.filter((s) => {
      const matchForm = selectedForm === 'all' || s.form === selectedForm;
      const matchClass = !selectedClassKey || s.classKey === selectedClassKey;
      const matchSearch =
        !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.indexNumber.includes(searchQuery);
      return matchForm && matchClass && matchSearch;
    });
  }, [allStudents, selectedForm, selectedClassKey, searchQuery]);

  // Current active student
  const activeStudent: Student | undefined = useMemo(() => {
    const found = allStudents.find((s) => s.id === selectedStudentId);
    return found || filteredStudents[0] || allStudents[0];
  }, [allStudents, selectedStudentId, filteredStudents]);

  // Current student transcript data
  const currentTranscript: TranscriptProfile | null = useMemo(() => {
    if (!activeStudent) return null;
    return generateStudentTranscript(activeStudent);
  }, [activeStudent]);

  // Transcripts for batch printing class
  const batchTranscripts: TranscriptProfile[] = useMemo(() => {
    if (!isBatchMode || !selectedClassKey) return [];
    const classStudents = allStudents.filter((s) => s.classKey === selectedClassKey);
    return classStudents.map((s) => generateStudentTranscript(s));
  }, [isBatchMode, selectedClassKey, allStudents]);

  const handlePrint = () => {
    window.print();
    showToast(isBatchMode ? 'Printing class transcripts batch...' : 'Printing student transcript...');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Filter Bar (Screen Only) */}
      <div className="no-print bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Award className="w-6 h-6 text-emerald-600" />
              <span>Official Student Transcripts</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified Academic Transcripts & Permanent Records for Nkroful Agric SHS
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBatchMode(!isBatchMode)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all flex items-center gap-1.5 ${
                isBatchMode
                  ? 'bg-purple-100 text-purple-900 border-purple-300'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isBatchMode ? 'Batch Mode Active' : 'Enable Batch Print'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isBatchMode ? `Print All (${batchTranscripts.length})` : 'Print Transcript'}</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Form Filter */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">
              Level / Form
            </label>
            <select
              value={selectedForm}
              onChange={(e) => {
                setSelectedForm(e.target.value as any);
                setSelectedClassKey('');
              }}
              className="w-full bg-white text-slate-900 border border-slate-300 rounded px-2.5 py-1.5 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Levels (Form 1 & Form 2)</option>
              <option value="form1">Form 1 (20 Classes)</option>
              <option value="form2">Form 2 (14 Classes)</option>
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">
              Class
            </label>
            <select
              value={selectedClassKey}
              onChange={(e) => {
                setSelectedClassKey(e.target.value);
                const first = allStudents.find((s) => s.classKey === e.target.value);
                if (first) setSelectedStudentId(first.id);
              }}
              className="w-full bg-white text-slate-900 border border-slate-300 rounded px-2.5 py-1.5 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Classes</option>
              {availableClasses.map((cls) => (
                <option key={cls.key} value={cls.key}>
                  {cls.name} ({cls.students.length} stds)
                </option>
              ))}
            </select>
          </div>

          {/* Student Selector */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">
              Select Student ({filteredStudents.length})
            </label>
            <select
              value={activeStudent?.id || ''}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full bg-white text-slate-900 border border-slate-300 rounded px-2.5 py-1.5 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 truncate"
            >
              {filteredStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.indexNumber})
                </option>
              ))}
            </select>
          </div>

          {/* Search by Name */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">
              Search by Name or Index No
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. ACKAH, 042260..."
                className="w-full pl-8 pr-2.5 py-1.5 bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>
        </div>

        {isBatchMode && (
          <div className="p-2.5 bg-purple-50 border border-purple-200 rounded text-xs text-purple-900 flex items-center justify-between">
            <span>
              <strong>Batch Mode Enabled:</strong> Currently rendering full transcripts for all{' '}
              <strong>{batchTranscripts.length}</strong> students in{' '}
              <strong>{selectedClassKey ? ALL_CLASSES.find((c) => c.key === selectedClassKey)?.name : 'Class'}</strong>.
              Clicking <strong>Print</strong> will print them with automatic page breaks between each student.
            </span>
            <button
              type="button"
              onClick={() => setIsBatchMode(false)}
              className="text-purple-700 underline font-semibold hover:text-purple-900"
            >
              Back to Single View
            </button>
          </div>
        )}
      </div>

      {/* TRANSCRIPT DISPLAY: Single or Batch */}
      {isBatchMode ? (
        <div className="space-y-8">
          {batchTranscripts.map((t, idx) => (
            <div key={t.student.id} className="print-page-break">
              <SingleTranscriptCard transcript={t} />
            </div>
          ))}
        </div>
      ) : currentTranscript ? (
        <SingleTranscriptCard transcript={currentTranscript} />
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-400">
          No student selected. Please choose a student from the filters above.
        </div>
      )}
    </div>
  );
};

interface SingleTranscriptCardProps {
  transcript: TranscriptProfile;
}

const SingleTranscriptCard: React.FC<SingleTranscriptCardProps> = ({ transcript }) => {
  const { student, terms, cumulativeGpa, totalCreditsEarned, graduationStatus } = transcript;

  return (
    <div className="bg-white border border-slate-300 rounded-lg shadow-sm p-6 md:p-8 max-w-[850px] mx-auto text-slate-900 text-xs print:border-none print:shadow-none print:p-0 print:max-w-none print:w-full">
      {/* Official Header */}
      <div className="text-center pb-4 border-b-2 border-slate-900 relative">
        {/* Crests and Authority */}
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="text-left">
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Republic of Ghana
            </div>
            <div className="text-[9.5px] text-slate-500 font-semibold uppercase">
              Ministry of Education · GES
            </div>
          </div>

          <div className="w-16 h-16 md:w-20 md:h-20 mx-auto flex items-center justify-center p-1 bg-white border border-slate-200 rounded shadow-xs">
            <img
              src="/logo.jpg"
              alt="Nkroful Crest"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          <div className="text-right">
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider font-mono-numbers">
              {SCHOOL_INFO.gesCode}
            </div>
            <div className="text-[9.5px] text-slate-500 font-semibold uppercase">
              Official Academic Record
            </div>
          </div>
        </div>

        {/* Institution Title */}
        <h2 className="text-base md:text-lg font-black text-slate-950 uppercase tracking-wider font-serif">
          {SCHOOL_INFO.name}
        </h2>
        <p className="text-[10px] text-slate-600 font-medium">
          {SCHOOL_INFO.location} · Tel: {SCHOOL_INFO.phone}
        </p>
        <p className="text-[10px] text-slate-600 font-medium">
          Email: {SCHOOL_INFO.email} · Motto: "{SCHOOL_INFO.motto}"
        </p>

        <div className="mt-2.5 inline-block bg-slate-900 text-white font-extrabold text-xs uppercase px-4 py-1 tracking-widest rounded-xs">
          OFFICIAL ACADEMIC TRANSCRIPT
        </div>
      </div>

      {/* Student Biodata Box */}
      <div className="my-4 bg-slate-50 border border-slate-300 rounded p-3.5 print:bg-transparent">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2 gap-x-4 text-[11px]">
          <div>
            <span className="text-slate-500 block text-[9.5px] uppercase font-bold">
              Student Full Name
            </span>
            <span className="font-extrabold text-slate-950 text-xs tracking-wide">
              {student.name}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[9.5px] uppercase font-bold">
              Index / Student ID No.
            </span>
            <span className="font-bold text-blue-900 font-mono-numbers text-xs">
              {student.indexNumber}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[9.5px] uppercase font-bold">
              Program of Study
            </span>
            <span className="font-bold text-slate-950">
              {student.program}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[9.5px] uppercase font-bold">
              Class & Level
            </span>
            <span className="font-bold text-slate-950">
              {student.className} ({student.form === 'form1' ? 'Form 1' : 'Form 2'})
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[9.5px] uppercase font-bold">
              Admission Year
            </span>
            <span className="font-semibold text-slate-800 font-mono-numbers">
              {student.admissionYear} / Academic Year
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[9.5px] uppercase font-bold">
              Date of Issue
            </span>
            <span className="font-semibold text-slate-800 font-mono-numbers">
              {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[9.5px] uppercase font-bold">
              Academic Standing
            </span>
            <span className="font-bold text-emerald-800">
              {graduationStatus}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[9.5px] uppercase font-bold">
              Verification Code
            </span>
            <span className="font-mono-numbers text-slate-600 font-semibold text-[10px]">
              VRF-{student.indexNumber.slice(-6)}-GH
            </span>
          </div>
        </div>
      </div>

      {/* Academic Terms breakdown */}
      <div className="space-y-4">
        {terms.map((term, tIdx) => (
          <div key={term.termId} className="border border-slate-300 rounded overflow-hidden">
            {/* Term Title Ribbon */}
            <div className="bg-slate-800 text-white px-3 py-1.5 flex items-center justify-between text-[11px] font-bold">
              <span className="uppercase tracking-wide">
                {term.formLevel === 'form1' ? 'Form 1' : 'Form 2'} · {term.academicYear} · {term.semester}
              </span>
              <span className="font-mono-numbers">
                Semester GPA: {term.gpa.toFixed(2)} / 4.00 · Credits: {term.totalCredits}
              </span>
            </div>

            {/* Courses Table */}
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-[10px] uppercase">
                  <th className="py-1.5 px-2.5 w-16">Code</th>
                  <th className="py-1.5 px-2.5">Course / Subject Description</th>
                  <th className="py-1.5 px-2 text-center w-12">Credits</th>
                  <th className="py-1.5 px-2 text-center w-14">SBA (60%)</th>
                  <th className="py-1.5 px-2 text-center w-14">Exam (40%)</th>
                  <th className="py-1.5 px-2 text-center w-14 bg-slate-200/70 font-black">Total</th>
                  <th className="py-1.5 px-2 text-center w-12">Grade</th>
                  <th className="py-1.5 px-2 text-center w-12">WAEC</th>
                  <th className="py-1.5 px-2 text-center w-12">Points</th>
                  <th className="py-1.5 px-2.5 w-24">Interpretation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {term.results.map((r, rIdx) => (
                  <tr key={r.subjectCode + rIdx} className="hover:bg-slate-50">
                    <td className="py-1.5 px-2.5 font-mono-numbers font-semibold text-slate-600">
                      {r.subjectCode}
                    </td>
                    <td className="py-1.5 px-2.5 font-medium text-slate-900">
                      {r.subjectName}{' '}
                      {r.isCore && (
                        <span className="text-[9px] text-slate-400 font-normal">
                          (Core)
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 px-2 text-center font-mono-numbers text-slate-600">
                      {r.creditHours}
                    </td>
                    <td className="py-1.5 px-2 text-center font-mono-numbers text-slate-700">
                      {r.classScore}
                    </td>
                    <td className="py-1.5 px-2 text-center font-mono-numbers text-slate-700">
                      {r.examScore}
                    </td>
                    <td className="py-1.5 px-2 text-center font-mono-numbers font-bold text-slate-950 bg-slate-100">
                      {r.totalScore}
                    </td>
                    <td className="py-1.5 px-2 text-center font-bold font-mono-numbers text-slate-900">
                      {r.grade}
                    </td>
                    <td className="py-1.5 px-2 text-center font-bold font-mono-numbers text-blue-900">
                      {r.waecGrade}
                    </td>
                    <td className="py-1.5 px-2 text-center font-mono-numbers text-slate-700">
                      {r.gradePoint.toFixed(1)}
                    </td>
                    <td className="py-1.5 px-2.5 text-slate-700 text-[10px]">
                      {r.remarks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Cumulative GPA & Summary Section */}
      <div className="mt-4 p-3 bg-slate-900 text-white rounded flex items-center justify-between text-xs font-semibold print:bg-slate-100 print:text-slate-900 print:border print:border-slate-300">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block print:text-slate-600">
              Total Credits Earned
            </span>
            <span className="font-extrabold text-sm font-mono-numbers">
              {totalCreditsEarned} Credits
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block print:text-slate-600">
              Cumulative GPA (CGPA)
            </span>
            <span className="font-black text-base text-amber-300 font-mono-numbers print:text-slate-950">
              {cumulativeGpa.toFixed(2)} / 4.00
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase font-bold block print:text-slate-600">
            Graduation Standing
          </span>
          <span className="font-bold text-emerald-400 print:text-emerald-800">
            {cumulativeGpa >= 3.6 ? 'Distinction / Honor Roll' : cumulativeGpa >= 2.5 ? 'Good Standing' : 'Pass'}
          </span>
        </div>
      </div>

      {/* Grading Scheme Rubric Key (Ghana SHS Standard) */}
      <div className="mt-4 pt-3 border-t border-slate-300 text-[9.5px] text-slate-600">
        <div className="font-bold uppercase tracking-wider text-slate-800 mb-1">
          Ghana Senior High School / WASSCE Grading Scale Key:
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1 text-center font-mono-numbers">
          <div className="p-1 border border-slate-200 rounded bg-slate-50">
            <span className="font-bold text-slate-900 block">A1 (4.0)</span>
            <span>80–100%</span>
            <span className="block text-[8.5px] text-emerald-700">Excellent</span>
          </div>
          <div className="p-1 border border-slate-200 rounded bg-slate-50">
            <span className="font-bold text-slate-900 block">B2 (3.5)</span>
            <span>75–79%</span>
            <span className="block text-[8.5px] text-blue-700">Very Good</span>
          </div>
          <div className="p-1 border border-slate-200 rounded bg-slate-50">
            <span className="font-bold text-slate-900 block">B3 (3.0)</span>
            <span>70–74%</span>
            <span className="block text-[8.5px] text-blue-700">Good</span>
          </div>
          <div className="p-1 border border-slate-200 rounded bg-slate-50">
            <span className="font-bold text-slate-900 block">C4 (2.5)</span>
            <span>65–69%</span>
            <span className="block text-[8.5px] text-amber-700">Credit</span>
          </div>
          <div className="p-1 border border-slate-200 rounded bg-slate-50">
            <span className="font-bold text-slate-900 block">C5 (2.0)</span>
            <span>60–64%</span>
            <span className="block text-[8.5px] text-amber-700">Credit</span>
          </div>
          <div className="p-1 border border-slate-200 rounded bg-slate-50">
            <span className="font-bold text-slate-900 block">C6 (1.5)</span>
            <span>50–59%</span>
            <span className="block text-[8.5px] text-slate-700">Pass</span>
          </div>
          <div className="p-1 border border-slate-200 rounded bg-slate-50">
            <span className="font-bold text-slate-900 block">D7 (1.0)</span>
            <span>45–49%</span>
            <span className="block text-[8.5px] text-orange-700">Pass</span>
          </div>
          <div className="p-1 border border-slate-200 rounded bg-slate-50">
            <span className="font-bold text-slate-900 block">E8 (0.5)</span>
            <span>40–44%</span>
            <span className="block text-[8.5px] text-orange-700">Pass</span>
          </div>
          <div className="p-1 border border-slate-200 rounded bg-slate-50">
            <span className="font-bold text-slate-900 block">F9 (0.0)</span>
            <span>&lt;40%</span>
            <span className="block text-[8.5px] text-red-700">Fail</span>
          </div>
        </div>
      </div>

      {/* Official Signatures & Verification Seal */}
      <div className="mt-8 pt-4 border-t border-slate-400 print:border-slate-900 flex items-end justify-between gap-4 text-center">
        {/* Exam Officer */}
        <div className="w-44 text-center">
          <div className="h-10 border-b border-dashed border-slate-700 flex items-center justify-center font-serif italic text-slate-800 text-sm">
            {SCHOOL_INFO.examOfficer}
          </div>
          <div className="text-[10px] font-bold text-slate-900 mt-1 uppercase">
            Head of Examinations
          </div>
          <div className="text-[9px] text-slate-500">
            Nkroful Agric SHS
          </div>
        </div>

        {/* Official School Seal / Stamp */}
        <div className="text-center px-4">
          <div className="w-20 h-20 mx-auto rounded-full border-2 border-dashed border-blue-900/60 p-1 flex flex-col items-center justify-center text-[7.5px] uppercase font-bold text-blue-900 leading-tight">
            <span>Official Seal</span>
            <span className="text-[6.5px] text-slate-500">NKROFUL AGRIC SHS</span>
            <span className="text-[6px] font-mono-numbers mt-0.5">GES APPROVED</span>
          </div>
          <div className="text-[8.5px] text-slate-500 mt-1 font-mono-numbers">
            SEC/GH/2026-VAL
          </div>
        </div>

        {/* Headmaster / Principal */}
        <div className="w-44 text-center">
          <div className="h-10 border-b border-dashed border-slate-700 flex items-center justify-center font-serif italic text-slate-800 text-sm">
            {SCHOOL_INFO.headmaster}
          </div>
          <div className="text-[10px] font-bold text-slate-900 mt-1 uppercase">
            Headmaster / Principal
          </div>
          <div className="text-[9px] text-slate-500">
            Nkroful Agric Senior High School
          </div>
        </div>
      </div>
    </div>
  );
};
