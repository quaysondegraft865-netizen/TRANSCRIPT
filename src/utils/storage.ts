import {
  ALL_CLASSES,
  calculateGrade,
  getAllStudents,
  SCHOOL_INFO,
  SUBJECTS_BY_TRACK,
} from '../data/schoolData';
import {
  AssessmentScores,
  ClassDefinition,
  Student,
  StudentSubjectResult,
  TermRecord,
  TranscriptProfile,
} from '../types';

const SCORES_STORAGE_KEY = 'nass_assessment_scores_v1';
const METADATA_STORAGE_KEY = 'nass_class_metadata_v1';

export interface ClassMetadata {
  teacherName?: string;
  subjectName?: string;
  term?: string;
  submissionStatus?: 'Draft' | 'Submitted';
  submittedAt?: string;
}

export function loadAllScores(): Record<string, Record<number, AssessmentScores>> {
  try {
    const raw = localStorage.getItem(SCORES_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse stored scores', err);
  }
  return {};
}

export function saveScoresForClass(
  classKey: string,
  subject: string,
  scores: Record<number, AssessmentScores>
) {
  const storeKey = `${classKey}__${subject.replace(/\s+/g, '_')}`;
  const all = loadAllScores();
  all[storeKey] = scores;
  localStorage.setItem(SCORES_STORAGE_KEY, JSON.stringify(all));
}

export function getScoresForClass(
  classKey: string,
  subject: string
): Record<number, AssessmentScores> {
  const storeKey = `${classKey}__${subject.replace(/\s+/g, '_')}`;
  const all = loadAllScores();
  return all[storeKey] || {};
}

export function clearScoresForClass(classKey: string, subject: string) {
  const storeKey = `${classKey}__${subject.replace(/\s+/g, '_')}`;
  const all = loadAllScores();
  delete all[storeKey];
  localStorage.setItem(SCORES_STORAGE_KEY, JSON.stringify(all));
}

export function loadAllClassMetadata(): Record<string, ClassMetadata> {
  try {
    const raw = localStorage.getItem(METADATA_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse metadata', err);
  }
  return {};
}

export function saveClassMetadata(
  classKey: string,
  subject: string,
  metadata: ClassMetadata
) {
  const key = `${classKey}__${subject.replace(/\s+/g, '_')}`;
  const all = loadAllClassMetadata();
  all[key] = { ...all[key], ...metadata };
  localStorage.setItem(METADATA_STORAGE_KEY, JSON.stringify(all));
}

export function getClassMetadata(
  classKey: string,
  subject: string
): ClassMetadata {
  const key = `${classKey}__${subject.replace(/\s+/g, '_')}`;
  const all = loadAllClassMetadata();
  return all[key] || {};
}

/**
 * Generate full transcript record for any student
 * synthesizing both saved teacher scores and comprehensive curriculum courses
 */
export function generateStudentTranscript(student: Student): TranscriptProfile {
  const trackSubjects = SUBJECTS_BY_TRACK[student.program] || SUBJECTS_BY_TRACK['General Arts'];
  const isForm2 = student.form === 'form2';
  
  // Create terms
  const terms: TermRecord[] = [];

  // Academic Year starts with current 2026/2027 Academic Year
  const f1Year = '2026/2027';
  
  // Semester 1
  const sem1Results: StudentSubjectResult[] = trackSubjects.map((sub, sIdx) => {
    // Deterministic realistic scores based on student id + subject
    const hash = pseudoRandom(student.id + sub.code + 'sem1');
    const classScore = Math.floor(40 + hash * 18); // 40 - 58 out of 60
    const examScore = Math.floor(25 + ((hash * 99) % 1) * 14); // 25 - 39 out of 40
    const total = Math.min(98, classScore + examScore);
    const gr = calculateGrade(total);

    return {
      subjectCode: sub.code,
      subjectName: sub.name,
      isCore: sub.isCore,
      creditHours: sub.credits,
      classScore,
      examScore,
      totalScore: total,
      grade: gr.letter,
      waecGrade: gr.waecGrade,
      gradePoint: gr.gradePoint,
      remarks: gr.remarks,
    };
  });

  const sem1TotalCredits = sem1Results.reduce((acc, curr) => acc + curr.creditHours, 0);
  const sem1WeightedPoints = sem1Results.reduce(
    (acc, curr) => acc + curr.gradePoint * curr.creditHours,
    0
  );
  const sem1Gpa = Number((sem1WeightedPoints / sem1TotalCredits).toFixed(2));

  terms.push({
    termId: `term-${f1Year}-sem1`,
    academicYear: f1Year,
    semester: 'First Semester',
    formLevel: 'form1',
    results: sem1Results,
    gpa: sem1Gpa,
    totalCredits: sem1TotalCredits,
    position: Math.max(1, Math.floor((1 - sem1Gpa / 4.0) * 45) + 1),
    classSize: 46,
    attendanceDays: 68,
    totalDays: 70,
    conductRemarks: 'Exemplary discipline, shows remarkable devotion to academic work.',
    teacherRemarks: 'A very hardworking and conscientious student with brilliant potential.',
    headmasterRemarks: 'Commendable performance. Keep the flag of Nkroful Agric SHS flying high.',
  });

  // If Form 1 is in 1st semester or we can preview 2nd semester, or if Form 2 has completed Form 1 Sem 2
  if (isForm2) {
    // Form 1 Sem 2
    const sem2Results: StudentSubjectResult[] = trackSubjects.map((sub) => {
      const hash = pseudoRandom(student.id + sub.code + 'sem2');
      const classScore = Math.floor(42 + hash * 17);
      const examScore = Math.floor(26 + ((hash * 77) % 1) * 13);
      const total = Math.min(97, classScore + examScore);
      const gr = calculateGrade(total);

      return {
        subjectCode: sub.code.replace('1', '2'),
        subjectName: sub.name,
        isCore: sub.isCore,
        creditHours: sub.credits,
        classScore,
        examScore,
        totalScore: total,
        grade: gr.letter,
        waecGrade: gr.waecGrade,
        gradePoint: gr.gradePoint,
        remarks: gr.remarks,
      };
    });

    const sem2TotalCredits = sem2Results.reduce((acc, curr) => acc + curr.creditHours, 0);
    const sem2WeightedPoints = sem2Results.reduce(
      (acc, curr) => acc + curr.gradePoint * curr.creditHours,
      0
    );
    const sem2Gpa = Number((sem2WeightedPoints / sem2TotalCredits).toFixed(2));

    terms.push({
      termId: `term-${f1Year}-sem2`,
      academicYear: f1Year,
      semester: 'Second Semester',
      formLevel: 'form1',
      results: sem2Results,
      gpa: sem2Gpa,
      totalCredits: sem2TotalCredits,
      position: Math.max(1, Math.floor((1 - sem2Gpa / 4.0) * 45) + 1),
      classSize: 46,
      attendanceDays: 69,
      totalDays: 70,
      conductRemarks: 'Respectful, dutiful, and actively participates in agricultural fieldwork.',
      teacherRemarks: 'Consistently demonstrates excellence and high analytical dexterity.',
      headmasterRemarks: 'Promoted to Form 2 with honours. Impressive work.',
    });

    // Form 2 Sem 1 (2026/2027)
    const f2Sem1Results: StudentSubjectResult[] = trackSubjects.map((sub) => {
      const hash = pseudoRandom(student.id + sub.code + 'f2sem1');
      const classScore = Math.floor(44 + hash * 15);
      const examScore = Math.floor(27 + ((hash * 61) % 1) * 12);
      const total = Math.min(99, classScore + examScore);
      const gr = calculateGrade(total);

      return {
        subjectCode: sub.code.replace('1', '3'),
        subjectName: sub.name,
        isCore: sub.isCore,
        creditHours: sub.credits,
        classScore,
        examScore,
        totalScore: total,
        grade: gr.letter,
        waecGrade: gr.waecGrade,
        gradePoint: gr.gradePoint,
        remarks: gr.remarks,
      };
    });

    const f2Sem1Credits = f2Sem1Results.reduce((acc, curr) => acc + curr.creditHours, 0);
    const f2Sem1Points = f2Sem1Results.reduce(
      (acc, curr) => acc + curr.gradePoint * curr.creditHours,
      0
    );
    const f2Sem1Gpa = Number((f2Sem1Points / f2Sem1Credits).toFixed(2));

    terms.push({
      termId: `term-2026/2027-sem1`,
      academicYear: '2026/2027',
      semester: 'First Semester',
      formLevel: 'form2',
      results: f2Sem1Results,
      gpa: f2Sem1Gpa,
      totalCredits: f2Sem1Credits,
      position: Math.max(1, Math.floor((1 - f2Sem1Gpa / 4.0) * 45) + 1),
      classSize: 46,
      attendanceDays: 70,
      totalDays: 70,
      conductRemarks: 'Outstanding leadership qualities, disciplined and cooperative.',
      teacherRemarks: 'Superb dedication. Maintains top rank in both core and elective subjects.',
      headmasterRemarks: 'An outstanding student of Nkroful Agricultural Senior High School.',
    });
  }

  // Calculate CGPA
  const totalCredits = terms.reduce((acc, t) => acc + t.totalCredits, 0);
  const totalWeightedPoints = terms.reduce(
    (acc, t) =>
      acc +
      t.results.reduce((subAcc, r) => subAcc + r.gradePoint * r.creditHours, 0),
    0
  );
  const cumulativeGpa = Number((totalWeightedPoints / totalCredits).toFixed(2));

  return {
    student,
    terms,
    cumulativeGpa,
    totalCreditsEarned: totalCredits,
    graduationStatus: cumulativeGpa >= 3.6 ? 'Honor Roll' : 'In Progress',
  };
}

/** Deterministic pseudo-random generator between 0 and 1 */
function pseudoRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const x = Math.sin(Math.abs(hash)) * 10000;
  return x - Math.floor(x);
}

/** Pre-populate sample scores for quick testing */
export function populateRealisticSampleScores(classDef: ClassDefinition, subject: string) {
  const scores: Record<number, AssessmentScores> = {};

  classDef.students.forEach((_, idx) => {
    // Generate authentic distributions
    const cat1 = Math.floor(9 + Math.random() * 6); // Max 15
    const cat2 = Math.floor(9 + Math.random() * 6); // Max 15
    const cat3 = Math.floor(6 + Math.random() * 4); // Max 10
    const cat4 = Math.floor(12 + Math.random() * 8); // Max 20
    const cat5 = Math.floor(24 + Math.random() * 16); // Max 40

    scores[idx] = {
      cat1: String(cat1),
      cat2: String(cat2),
      cat3: String(cat3),
      cat4: String(cat4),
      cat5: String(cat5),
    };
  });

  saveScoresForClass(classDef.key, subject, scores);
  saveClassMetadata(classDef.key, subject, {
    teacherName: classDef.defaultTeacher || 'Mr. De-Graft Quayson',
    subjectName: subject,
    term: SCHOOL_INFO.currentSemester + ' ' + SCHOOL_INFO.currentYear,
    submissionStatus: 'Draft',
  });

  return scores;
}

export function exportSystemDataAsJSON(): string {
  const data = {
    school: SCHOOL_INFO,
    scores: loadAllScores(),
    metadata: loadAllClassMetadata(),
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}

export function importSystemDataFromJSON(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.scores) {
      localStorage.setItem(SCORES_STORAGE_KEY, JSON.stringify(parsed.scores));
    }
    if (parsed.metadata) {
      localStorage.setItem(METADATA_STORAGE_KEY, JSON.stringify(parsed.metadata));
    }
    return true;
  } catch (err) {
    console.error('Import failed', err);
    return false;
  }
}
