import React, { useState, useMemo } from 'react';
import {
  ALL_CLASSES,
  getAllStudents,
  SCHOOL_INFO,
} from '../data/schoolData';
import { ProgramTrack, Student } from '../types';
import { Search, Award, FileText, BookOpen, Users, Filter, CreditCard } from 'lucide-react';
import { StudentIDCardModal } from './StudentIDCardModal';

interface StudentDirectoryViewProps {
  onOpenTranscriptForStudent: (studentName: string, classKey: string) => void;
  onOpenAssessmentForClass: (classKey: string) => void;
  onOpenReportForStudent: (studentName: string, classKey: string) => void;
}

export const StudentDirectoryView: React.FC<StudentDirectoryViewProps> = ({
  onOpenTranscriptForStudent,
  onOpenAssessmentForClass,
  onOpenReportForStudent,
}) => {
  const allStudents = useMemo(() => getAllStudents(), []);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterForm, setFilterForm] = useState<'all' | 'form1' | 'form2'>('all');
  const [filterProgram, setFilterProgram] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedStudentForIDCard, setSelectedStudentForIDCard] = useState<Student | null>(null);
  const pageSize = 25;

  const filteredStudents = useMemo(() => {
    return allStudents.filter((s) => {
      const matchForm = filterForm === 'all' || s.form === filterForm;
      const matchProgram = filterProgram === 'all' || s.program === filterProgram;
      const matchClass = filterClass === 'all' || s.classKey === filterClass;
      const matchSearch =
        !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.indexNumber.includes(searchQuery);
      return matchForm && matchProgram && matchClass && matchSearch;
    });
  }, [allStudents, filterForm, filterProgram, filterClass, searchQuery]);

  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage]);

  const programs: ProgramTrack[] = [
    'Agricultural Science',
    'General Science',
    'General Arts',
    'Home Economics',
    'Business',
    'Applied Tech',
    'Visual Arts',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-purple-600" />
              <span>Student Master Directory</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete Enrolment Records (2026/2027 Academic Year): {allStudents.length} Students Across 34 Classes
            </p>
          </div>

          <div className="text-xs text-slate-600 bg-purple-50 px-3 py-1.5 rounded-md border border-purple-200 font-medium">
            Showing <strong>{filteredStudents.length}</strong> matched students
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Search</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search name or index..."
                className="w-full pl-8 pr-2.5 py-1.5 bg-white text-slate-900 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Form / Level</label>
            <select
              value={filterForm}
              onChange={(e) => {
                setFilterForm(e.target.value as any);
                setFilterClass('all');
                setCurrentPage(1);
              }}
              className="w-full bg-white text-slate-900 border border-slate-300 rounded px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Forms (Form 1 & Form 2)</option>
              <option value="form1">Form 1</option>
              <option value="form2">Form 2</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Academic Program</label>
            <select
              value={filterProgram}
              onChange={(e) => {
                setFilterProgram(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white text-slate-900 border border-slate-300 rounded px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Programs</option>
              {programs.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Specific Class</label>
            <select
              value={filterClass}
              onChange={(e) => {
                setFilterClass(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-white text-slate-900 border border-slate-300 rounded px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Classes</option>
              {ALL_CLASSES.filter((c) => filterForm === 'all' || c.form === filterForm).map((cls) => (
                <option key={cls.key} value={cls.key}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3 text-center w-14">#</th>
                <th className="py-2.5 px-3 w-28">Index Number</th>
                <th className="py-2.5 px-4 min-w-[200px]">Student Full Name</th>
                <th className="py-2.5 px-3">Form</th>
                <th className="py-2.5 px-3">Class Assigned</th>
                <th className="py-2.5 px-3">Program Track</th>
                <th className="py-2.5 px-3 text-center">Admission</th>
                <th className="py-2.5 px-3 text-center w-48">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedStudents.length > 0 ? (
                paginatedStudents.map((std, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr
                      key={std.id}
                      className="hover:bg-blue-50/50 transition-colors odd:bg-white even:bg-slate-50/40"
                    >
                      <td className="py-2 px-3 text-center font-mono-numbers text-slate-500">
                        {globalIdx}
                      </td>
                      <td className="py-2 px-3 font-mono-numbers font-semibold text-blue-900">
                        {std.indexNumber}
                      </td>
                      <td className="py-2 px-4 font-bold text-slate-900">
                        {std.name}
                      </td>
                      <td className="py-2 px-3">
                        <span className="font-semibold text-slate-700">
                          {std.form === 'form1' ? 'Form 1' : 'Form 2'}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-800">
                        {std.className}
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-slate-700 font-medium">
                          {std.program}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center font-mono-numbers text-slate-600">
                        {std.admissionYear}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenTranscriptForStudent(std.name, std.classKey)}
                            className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors flex items-center gap-1"
                            title="Generate Official Transcript"
                          >
                            <Award className="w-3 h-3" />
                            <span>Transcript</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenReportForStudent(std.name, std.classKey)}
                            className="px-2 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors flex items-center gap-1"
                            title="Generate Terminal Report Card"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Report</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedStudentForIDCard(std)}
                            className="px-2 py-1 text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded border border-purple-200 transition-colors flex items-center gap-1"
                            title="Preview & Print Official Student ID Card"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>ID Card</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenAssessmentForClass(std.classKey)}
                            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                            title="Open Class Assessment Sheet"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No students match the selected search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Strip */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredStudents.length)} of{' '}
            {filteredStudents.length} students
          </div>

          <div className="flex items-center gap-1.5 font-mono-numbers">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 border rounded bg-white disabled:opacity-40 hover:bg-slate-50"
            >
              Previous
            </button>
            <span className="px-2 py-1 font-bold text-slate-900">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 border rounded bg-white disabled:opacity-40 hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Student ID Card Modal */}
      <StudentIDCardModal
        student={selectedStudentForIDCard}
        isOpen={!!selectedStudentForIDCard}
        onClose={() => setSelectedStudentForIDCard(null)}
      />
    </div>
  );
};
