import React, { useState, useEffect, useMemo } from 'react';
import {
  FORM1_CLASSES,
  FORM2_CLASSES,
  ALL_SUBJECT_OPTIONS,
  SCHOOL_INFO,
  calculateGrade,
} from '../data/schoolData';
import { ClassDefinition, AssessmentScores, FormLevel } from '../types';
import {
  getScoresForClass,
  saveScoresForClass,
  clearScoresForClass,
  getClassMetadata,
  saveClassMetadata,
  populateRealisticSampleScores,
} from '../utils/storage';
import {
  Search,
  Save,
  CheckCircle2,
  Printer,
  Sparkles,
  Trash2,
  FileSpreadsheet,
  Award,
} from 'lucide-react';

interface AssessmentSheetsViewProps {
  onOpenTranscriptForStudent?: (studentName: string, classKey: string) => void;
  showToast: (msg: string) => void;
}

export const AssessmentSheetsView: React.FC<AssessmentSheetsViewProps> = ({
  onOpenTranscriptForStudent,
  showToast,
}) => {
  const [activeForm, setActiveForm] = useState<FormLevel>('form1');
  const [selectedClassKey, setSelectedClassKey] = useState<string>('f1-agric-1');
  const [selectedSubject, setSelectedSubject] = useState<string>('General Agriculture');
  const [formTeacher, setFormTeacher] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [scores, setScores] = useState<Record<number, AssessmentScores>>({});
  const [submissionStatus, setSubmissionStatus] = useState<'Draft' | 'Submitted'>('Draft');

  const currentClasses = activeForm === 'form1' ? FORM1_CLASSES : FORM2_CLASSES;

  const currentClassDef: ClassDefinition = useMemo(() => {
    const found = currentClasses.find((c) => c.key === selectedClassKey);
    return found || currentClasses[0];
  }, [currentClasses, selectedClassKey]);

  // Load scores and metadata when class or subject changes
  useEffect(() => {
    if (!currentClassDef) return;
    const loadedScores = getScoresForClass(currentClassDef.key, selectedSubject);
    setScores(loadedScores);

    const meta = getClassMetadata(currentClassDef.key, selectedSubject);
    setFormTeacher(meta.teacherName || currentClassDef.defaultTeacher || 'Mr. De-Graft Quayson');
    setSubmissionStatus(meta.submissionStatus || 'Draft');
  }, [currentClassDef, selectedSubject]);

  // Switch form level
  const handleFormTab = (form: FormLevel) => {
    setActiveForm(form);
    const classes = form === 'form1' ? FORM1_CLASSES : FORM2_CLASSES;
    setSelectedClassKey(classes[0].key);
    setSearchQuery('');
    showToast(`Switched to ${form === 'form1' ? 'Form 1' : 'Form 2'} assessment sheets`);
  };

  // Handle score input change
  const handleScoreChange = (
    studentIdx: number,
    field: keyof AssessmentScores,
    value: string,
    max: number
  ) => {
    let numVal = parseFloat(value);
    if (!isNaN(numVal)) {
      if (numVal > max) numVal = max;
      if (numVal < 0) numVal = 0;
      value = String(numVal);
    }

    const updated = {
      ...scores,
      [studentIdx]: {
        ...scores[studentIdx],
        [field]: value,
      },
    };
    setScores(updated);

    // Auto save to persistent storage as draft
    saveScoresForClass(currentClassDef.key, selectedSubject, updated);
  };

  // Clear all scores
  const handleClearAll = () => {
    if (window.confirm(`Clear all assessment scores for ${currentClassDef.name} (${selectedSubject})?`)) {
      clearScoresForClass(currentClassDef.key, selectedSubject);
      setScores({});
      showToast('All scores cleared for this sheet.');
    }
  };

  // Fill sample scores
  const handleFillSample = () => {
    const filled = populateRealisticSampleScores(currentClassDef, selectedSubject);
    setScores(filled);
    showToast(`Realistic sample scores filled for ${currentClassDef.name}`);
  };

  // Save draft
  const handleSaveDraft = () => {
    saveScoresForClass(currentClassDef.key, selectedSubject, scores);
    saveClassMetadata(currentClassDef.key, selectedSubject, {
      teacherName: formTeacher,
      subjectName: selectedSubject,
      submissionStatus: 'Draft',
    });
    setSubmissionStatus('Draft');
    showToast('✓ Draft saved to local storage.');
  };

  // Submit sheet
  const handleSubmitSheet = () => {
    const filledCount = Object.values(scores).filter(
      (s) => s.cat1 || s.cat2 || s.cat3 || s.cat4 || s.cat5
    ).length;

    if (filledCount === 0) {
      showToast('Please enter at least one student score before submitting.');
      return;
    }

    if (
      window.confirm(
        `Submit official assessment sheet for ${currentClassDef.name}?\n\n` +
          `Subject: ${selectedSubject}\n` +
          `Students graded: ${filledCount} of ${currentClassDef.students.length}`
      )
    ) {
      saveScoresForClass(currentClassDef.key, selectedSubject, scores);
      saveClassMetadata(currentClassDef.key, selectedSubject, {
        teacherName: formTeacher,
        subjectName: selectedSubject,
        submissionStatus: 'Submitted',
        submittedAt: new Date().toLocaleDateString(),
      });
      setSubmissionStatus('Submitted');
      showToast(`✓ Sheet submitted officially for ${currentClassDef.name}!`);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    let csv = `N/S,Student Name,Individual Class Assessment (15),Mid-Sem Exams (15),Portfolio / Practical (10),Group Project (20),Supervised Exams (40),Total (100),Grade,Remarks\n`;
    currentClassDef.students.forEach((name, idx) => {
      const s = scores[idx] || {};
      const c1 = parseFloat(s.cat1 || '0') || 0;
      const c2 = parseFloat(s.cat2 || '0') || 0;
      const c3 = parseFloat(s.cat3 || '0') || 0;
      const c4 = parseFloat(s.cat4 || '0') || 0;
      const c5 = parseFloat(s.cat5 || '0') || 0;
      const total = c1 + c2 + c3 + c4 + c5;
      const gr = calculateGrade(total);
      const hasScores = s.cat1 || s.cat2 || s.cat3 || s.cat4 || s.cat5;

      csv += `"${idx + 1}","${name}","${s.cat1 || 0}","${s.cat2 || 0}","${s.cat3 || 0}","${s.cat4 || 0}","${s.cat5 || 0}","${hasScores ? total : 0}","${hasScores ? gr.letter : '-'}","${hasScores ? gr.remarks : '-'}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentClassDef.name}_${selectedSubject}_Assessment.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV assessment sheet downloaded.');
  };

  // Filter students by query
  const filteredStudents = useMemo(() => {
    return currentClassDef.students
      .map((name, idx) => ({ name, originalIndex: idx }))
      .filter((item) =>
        searchQuery ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
      );
  }, [currentClassDef.students, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    let count = 0;
    let sum = 0;
    let high = 0;
    let low = 100;
    let gradeCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };

    Object.keys(scores).forEach((key) => {
      const s = scores[parseInt(key, 10)];
      if (!s) return;
      const c1 = parseFloat(s.cat1 || '0') || 0;
      const c2 = parseFloat(s.cat2 || '0') || 0;
      const c3 = parseFloat(s.cat3 || '0') || 0;
      const c4 = parseFloat(s.cat4 || '0') || 0;
      const c5 = parseFloat(s.cat5 || '0') || 0;
      const hasAny = s.cat1 || s.cat2 || s.cat3 || s.cat4 || s.cat5;

      if (hasAny) {
        const total = c1 + c2 + c3 + c4 + c5;
        count++;
        sum += total;
        if (total > high) high = total;
        if (total < low) low = total;
        const gr = calculateGrade(total);
        gradeCounts[gr.letter] = (gradeCounts[gr.letter] || 0) + 1;
      }
    });

    return {
      count,
      avg: count > 0 ? (sum / count).toFixed(1) : '0.0',
      high: count > 0 ? high : 0,
      low: count > 0 ? low : 0,
      gradeCounts,
    };
  }, [scores]);

  return (
    <div className="space-y-6">
      {/* Top Banner and Form Level Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 no-print">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Academic Assessment Sheets (STP)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Continuous Assessment (SBA) and Examination Recording · 2026/2027 Academic Year
          </p>
        </div>

        {/* Form Tabs */}
        <div className="flex items-center gap-2 bg-slate-200/80 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => handleFormTab('form1')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all flex items-center gap-2 ${
              activeForm === 'form1'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <span className="w-5 h-5 rounded bg-white/20 grid place-items-center text-[10px] font-bold">
              F1
            </span>
            <span>Form 1 (20 Classes · 2026/2027)</span>
          </button>

          <button
            type="button"
            onClick={() => handleFormTab('form2')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all flex items-center gap-2 ${
              activeForm === 'form2'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <span className="w-5 h-5 rounded bg-white/20 grid place-items-center text-[10px] font-bold">
              F2
            </span>
            <span>Form 2 (14 Classes · 2026/2027)</span>
          </button>
        </div>
      </div>

      {/* Official Sheet Header Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs border-t-4 border-t-blue-700">
        <div className="flex items-start justify-between flex-wrap gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <img
              src="/logo.jpg"
              alt="Nkroful Crest"
              className="w-14 h-14 object-contain rounded border border-slate-100 p-0.5 bg-slate-50 shadow-2xs"
            />
            <div>
              <div className="text-base font-extrabold text-blue-900 uppercase tracking-wide">
                Nkroful Agricultural Senior High School
              </div>
              <div className="text-xs text-slate-500 font-semibold tracking-wider uppercase mt-0.5">
                Assessment Sheet from STP (School-Based Continuous Assessment)
              </div>
              <div className="text-xs text-slate-600 font-medium mt-0.5">
                {activeForm === 'form1' ? 'First Semester 2026/2027' : 'Second Semester 2026/2027'} · Western Region, Ghana
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs no-print">
            {submissionStatus === 'Submitted' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Submitted Officially
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                Draft (In Progress)
              </span>
            )}
          </div>
        </div>

        {/* Metadata Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
          <div>
            <label className="block text-slate-500 font-semibold mb-1">
              Class / Section
            </label>
            <div className="font-bold text-slate-900 text-sm bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
              {currentClassDef.name} ({currentClassDef.program})
            </div>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-white text-slate-900 border border-slate-300 rounded px-3 py-1.5 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {ALL_SUBJECT_OPTIONS.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">
              Form / Subject Teacher
            </label>
            <input
              type="text"
              value={formTeacher}
              onChange={(e) => setFormTeacher(e.target.value)}
              placeholder="e.g. Mr. De-Graft Quayson"
              className="w-full bg-white text-slate-900 border border-slate-300 rounded px-3 py-1.5 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Class Selector Grid (All classes available) */}
      <div className="no-print">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Select Class ({currentClasses.length} Available)
          </span>
          <span className="text-xs text-slate-400">
            Click any class to load its student roster
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {currentClasses.map((cls) => {
            const isSelected = cls.key === currentClassDef.key;
            return (
              <button
                key={cls.key}
                type="button"
                onClick={() => setSelectedClassKey(cls.key)}
                className={`text-left p-2.5 rounded-lg border transition-all flex items-center gap-2.5 ${
                  isSelected
                    ? 'bg-blue-50/90 border-blue-600 shadow-sm ring-1 ring-blue-600/30'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded text-[11px] font-bold grid place-items-center shrink-0 ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {cls.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {cls.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono-numbers">
                    {cls.students.length} students
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Assessment Table & Action Controls */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        {/* Table Action Bar */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm text-slate-900">
              {currentClassDef.name}
            </span>
            <span className="text-xs text-slate-500 font-mono-numbers">
              {currentClassDef.students.length} students on register
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none w-44"
              />
            </div>

            <button
              type="button"
              onClick={handleFillSample}
              className="px-2.5 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors flex items-center gap-1.5"
              title="Populate authentic sample marks across categories"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fill Sample</span>
            </button>

            <button
              type="button"
              onClick={handleClearAll}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 border border-slate-200 rounded-md transition-colors flex items-center gap-1.5"
              title="Clear all scores"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors flex items-center gap-1.5"
              title="Export as CSV spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Scrollable Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3 text-center w-12 border-r border-white/10">N/S</th>
                <th className="py-2.5 px-4 min-w-[200px] border-r border-white/10">Name of Students</th>
                <th className="py-2.5 px-2 text-center w-24 border-r border-white/10">
                  Class Assess.
                  <span className="block text-[9px] font-normal opacity-80 lowercase">Max 15</span>
                </th>
                <th className="py-2.5 px-2 text-center w-24 border-r border-white/10">
                  Mid-Sem Exams
                  <span className="block text-[9px] font-normal opacity-80 lowercase">Max 15</span>
                </th>
                <th className="py-2.5 px-2 text-center w-24 border-r border-white/10">
                  Portfolio/Pract.
                  <span className="block text-[9px] font-normal opacity-80 lowercase">Max 10</span>
                </th>
                <th className="py-2.5 px-2 text-center w-24 border-r border-white/10">
                  Group Project
                  <span className="block text-[9px] font-normal opacity-80 lowercase">Max 20</span>
                </th>
                <th className="py-2.5 px-2 text-center w-24 border-r border-white/10">
                  Supervised Exam
                  <span className="block text-[9px] font-normal opacity-80 lowercase">Max 40</span>
                </th>
                <th className="py-2.5 px-2 text-center w-20 bg-amber-500 text-slate-950 font-bold border-r border-white/10">
                  Total
                  <span className="block text-[9px] font-semibold text-slate-900 lowercase">/100</span>
                </th>
                <th className="py-2.5 px-2 text-center w-20 bg-emerald-600 text-white font-bold border-r border-white/10">
                  Grade
                </th>
                <th className="py-2.5 px-2 text-center w-24 no-print">
                  Transcript
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((item) => {
                  const idx = item.originalIndex;
                  const s = scores[idx] || {};
                  const c1 = parseFloat(s.cat1 || '0') || 0;
                  const c2 = parseFloat(s.cat2 || '0') || 0;
                  const c3 = parseFloat(s.cat3 || '0') || 0;
                  const c4 = parseFloat(s.cat4 || '0') || 0;
                  const c5 = parseFloat(s.cat5 || '0') || 0;
                  const hasAny = s.cat1 || s.cat2 || s.cat3 || s.cat4 || s.cat5;
                  const total = c1 + c2 + c3 + c4 + c5;
                  const gradeInfo = calculateGrade(total);

                  return (
                    <tr
                      key={idx}
                      className="hover:bg-blue-50/50 transition-colors odd:bg-white even:bg-slate-50/40"
                    >
                      <td className="py-2 px-3 text-center text-slate-500 font-mono-numbers">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-4 font-semibold text-slate-900">
                        {item.name}
                      </td>

                      {/* Cat 1: Max 15 */}
                      <td className="py-1 px-1.5 text-center">
                        <input
                          type="number"
                          min="0"
                          max="15"
                          step="1"
                          value={s.cat1 || ''}
                          onChange={(e) =>
                            handleScoreChange(idx, 'cat1', e.target.value, 15)
                          }
                          className={`w-16 mx-auto text-center py-1 px-1 border rounded text-xs font-mono-numbers focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                            s.cat1
                              ? 'bg-emerald-50 text-emerald-900 font-semibold border-emerald-300'
                              : 'border-slate-300 bg-white text-slate-800'
                          }`}
                        />
                      </td>

                      {/* Cat 2: Max 15 */}
                      <td className="py-1 px-1.5 text-center">
                        <input
                          type="number"
                          min="0"
                          max="15"
                          step="1"
                          value={s.cat2 || ''}
                          onChange={(e) =>
                            handleScoreChange(idx, 'cat2', e.target.value, 15)
                          }
                          className={`w-16 mx-auto text-center py-1 px-1 border rounded text-xs font-mono-numbers focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                            s.cat2
                              ? 'bg-emerald-50 text-emerald-900 font-semibold border-emerald-300'
                              : 'border-slate-300 bg-white text-slate-800'
                          }`}
                        />
                      </td>

                      {/* Cat 3: Max 10 */}
                      <td className="py-1 px-1.5 text-center">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="1"
                          value={s.cat3 || ''}
                          onChange={(e) =>
                            handleScoreChange(idx, 'cat3', e.target.value, 10)
                          }
                          className={`w-16 mx-auto text-center py-1 px-1 border rounded text-xs font-mono-numbers focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                            s.cat3
                              ? 'bg-emerald-50 text-emerald-900 font-semibold border-emerald-300'
                              : 'border-slate-300 bg-white text-slate-800'
                          }`}
                        />
                      </td>

                      {/* Cat 4: Max 20 */}
                      <td className="py-1 px-1.5 text-center">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="1"
                          value={s.cat4 || ''}
                          onChange={(e) =>
                            handleScoreChange(idx, 'cat4', e.target.value, 20)
                          }
                          className={`w-16 mx-auto text-center py-1 px-1 border rounded text-xs font-mono-numbers focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                            s.cat4
                              ? 'bg-emerald-50 text-emerald-900 font-semibold border-emerald-300'
                              : 'border-slate-300 bg-white text-slate-800'
                          }`}
                        />
                      </td>

                      {/* Cat 5: Max 40 */}
                      <td className="py-1 px-1.5 text-center">
                        <input
                          type="number"
                          min="0"
                          max="40"
                          step="1"
                          value={s.cat5 || ''}
                          onChange={(e) =>
                            handleScoreChange(idx, 'cat5', e.target.value, 40)
                          }
                          className={`w-16 mx-auto text-center py-1 px-1 border rounded text-xs font-mono-numbers focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                            s.cat5
                              ? 'bg-emerald-50 text-emerald-900 font-semibold border-emerald-300'
                              : 'border-slate-300 bg-white text-slate-800'
                          }`}
                        />
                      </td>

                      {/* Total */}
                      <td className="py-2 px-2 text-center font-bold font-mono-numbers text-slate-900 bg-amber-50/40">
                        {hasAny ? total : '—'}
                      </td>

                      {/* Grade */}
                      <td className="py-2 px-2 text-center font-semibold font-mono-numbers bg-emerald-50/30">
                        {hasAny ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                              gradeInfo.letter === 'A'
                                ? 'bg-emerald-100 text-emerald-800'
                                : gradeInfo.letter === 'B'
                                ? 'bg-blue-100 text-blue-800'
                                : gradeInfo.letter === 'C'
                                ? 'bg-amber-100 text-amber-800'
                                : gradeInfo.letter === 'D'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {gradeInfo.letter}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-2 px-2 text-center no-print">
                        <button
                          type="button"
                          onClick={() =>
                            onOpenTranscriptForStudent?.(item.name, currentClassDef.key)
                          }
                          className="px-2 py-1 text-[11px] font-medium text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors inline-flex items-center gap-1"
                          title="Generate official academic transcript"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>Transcript</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No students match "{searchQuery}" in {currentClassDef.name}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Statistics Strip */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-2 rounded bg-white border border-slate-200/80">
            <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
              Graded Students
            </div>
            <div className="text-lg font-extrabold text-blue-900 font-mono-numbers mt-0.5">
              {stats.count} / {currentClassDef.students.length}
            </div>
          </div>

          <div className="text-center p-2 rounded bg-white border border-slate-200/80">
            <div className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider">
              Class Average
            </div>
            <div className="text-lg font-extrabold text-emerald-700 font-mono-numbers mt-0.5">
              {stats.avg}%
            </div>
          </div>

          <div className="text-center p-2 rounded bg-white border border-slate-200/80">
            <div className="text-[10px] font-bold uppercase text-amber-600 tracking-wider">
              Highest Score
            </div>
            <div className="text-lg font-extrabold text-amber-700 font-mono-numbers mt-0.5">
              {stats.high}/100
            </div>
          </div>

          <div className="text-center p-2 rounded bg-white border border-slate-200/80">
            <div className="text-[10px] font-bold uppercase text-purple-600 tracking-wider">
              Lowest Score
            </div>
            <div className="text-lg font-extrabold text-purple-700 font-mono-numbers mt-0.5">
              {stats.low}/100
            </div>
          </div>
        </div>

        {/* Grade Legend */}
        <div className="px-4 py-3 bg-white border-t border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-800">Grade Scale:</span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> A · 80–100 ({stats.gradeCounts.A})
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> B · 70–79 ({stats.gradeCounts.B})
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> C · 60–69 ({stats.gradeCounts.C})
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> D · 50–59 ({stats.gradeCounts.D})
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> F · &lt;50 ({stats.gradeCounts.F})
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 no-print">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Draft</span>
            </button>

            <button
              type="button"
              onClick={handleSubmitSheet}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Submit Sheet</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-800 hover:bg-blue-900 rounded-md transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Sheet</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
