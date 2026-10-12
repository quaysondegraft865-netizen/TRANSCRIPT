export type FormLevel = 'form1' | 'form2' | 'form3';

export type ProgramTrack =
  | 'Applied Tech'
  | 'General Arts'
  | 'Agricultural Science'
  | 'Home Economics'
  | 'Business'
  | 'General Science'
  | 'Visual Arts';

export type HouseName =
  | 'Kwame Nkrumah House (Green)'
  | 'Aggrey House (Yellow)'
  | 'Yaa Asantewaa House (Red)'
  | 'Armah-Blay House (Blue)';

export type BoardingStatus = 'Day Student' | 'Boarder';

export type UserRole =
  | 'super_admin'
  | 'headmaster'
  | 'assistant_headmaster'
  | 'form_master'
  | 'teacher'
  | 'accountant'
  | 'student'
  | 'parent';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  studentIndexNo?: string;
  linkedStudentName?: string;
  assignedClasses?: string[];
  assignedSubjects?: string[];
  lastLogin?: string;
  mfaEnabled?: boolean;
}

export interface Student {
  id: string;
  indexNumber: string;
  name: string;
  gender?: 'M' | 'F';
  form: FormLevel;
  classKey: string;
  className: string;
  program: ProgramTrack;
  admissionYear: number;
  ghanaCard?: string;
  house?: HouseName;
  boardingStatus?: BoardingStatus;
  guardianName?: string;
  guardianPhone?: string;
  feeStatus?: 'CLEARED' | 'OWING ARREARS';
  arrearsAmount?: number;
}

export interface ClassDefinition {
  key: string;
  name: string;
  form: FormLevel;
  program: ProgramTrack;
  colorClass: string;
  icon: string;
  defaultTeacher?: string;
  students: string[];
}

export interface AssessmentScores {
  cat1?: string; // Individual Class Assessment (Max 15)
  cat2?: string; // Mid-Sem Exams (Project, Assess.) (Max 15)
  cat3?: string; // Portfolio / Practical Performance (Max 10)
  cat4?: string; // Group Project / Case Studies (Max 20)
  cat5?: string; // Supervised Individual Exams (Max 40)
  remarks?: string;
}

export interface StudentSubjectResult {
  subjectCode: string;
  subjectName: string;
  isCore: boolean;
  creditHours: number;
  classScore: number; // 0-60 (Continuous Assessment / SBA)
  examScore: number;  // 0-40 (End of Semester Exam)
  totalScore: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  waecGrade: 'A1' | 'B2' | 'B3' | 'C4' | 'C5' | 'C6' | 'D7' | 'E8' | 'F9';
  gradePoint: number;
  remarks: string;
}

export interface TermRecord {
  termId: string;
  academicYear: string;
  semester: string;
  formLevel: FormLevel;
  results: StudentSubjectResult[];
  gpa: number;
  totalCredits: number;
  position?: number;
  classSize?: number;
  attendanceDays?: number;
  totalDays?: number;
  conductRemarks?: string;
  teacherRemarks?: string;
  headmasterRemarks?: string;
  approvalStatus?: 'DRAFT' | 'APPROVED' | 'LOCKED';
}

export interface TranscriptProfile {
  student: Student;
  terms: TermRecord[];
  cumulativeGpa: number;
  totalCreditsEarned: number;
  graduationStatus: 'In Progress' | 'Completed' | 'Honor Roll';
}

export interface AcademicSystemSettings {
  academicYear: string; // e.g. "2026/2027"
  activeSemester: string; // e.g. "Term 1"
  semesterStartDate: string;
  vacationDate: string;
  reopeningDate: string;
  nextTermFees: number; // in GHS
  sbaWeightPercentage: number; // e.g. 30 or 50
  examWeightPercentage: number; // e.g. 70 or 50
  resultsApproved: boolean;
  approvedBy?: string;
  approvalDate?: string;
}

export interface FeeTransaction {
  id: string;
  studentId: string;
  studentName: string;
  indexNumber: string;
  classKey: string;
  amount: number;
  type: 'Tuition' | 'PTA Levy' | 'Boarding Fee' | 'Uniform & Books' | 'Examination Fee';
  paymentMethod: 'Cash' | 'MTN Mobile Money' | 'Telecel Cash' | 'GCB Bank Deposit' | 'Bank Transfer';
  referenceNo: string;
  receivedBy: string;
  date: string;
}
