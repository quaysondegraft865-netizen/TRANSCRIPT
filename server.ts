import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================================================
// TYPES & DATA STRUCTURES
// =============================================================================

export type UserRole =
  | 'super_admin'
  | 'headmaster'
  | 'assistant_headmaster'
  | 'form_master'
  | 'teacher'
  | 'accountant'
  | 'student'
  | 'parent';

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  isActive: boolean;
  failedAttempts: number;
  lockedUntil?: number;
  studentIndexNo?: string;
  linkedStudentName?: string;
  assignedClasses?: string[];
  assignedSubjects?: string[];
  lastLogin?: string;
  passwordSalt: string;
  passwordHash: string;
  mfaEnabled?: boolean;
}

export interface SessionRecord {
  id: string;
  userId: string;
  csrfToken: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: number;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  eventType:
    | 'LOGIN_SUCCESS'
    | 'LOGIN_FAILED'
    | 'LOGOUT'
    | 'PASSWORD_RESET_REQUESTED'
    | 'PASSWORD_RESET_COMPLETED'
    | 'PASSWORD_CHANGED'
    | 'FORCE_PASSWORD_RESET'
    | 'ACCOUNT_ACTIVATED'
    | 'ACCOUNT_DEACTIVATED'
    | 'USER_CREATED'
    | 'SYSTEM_SETTINGS_UPDATED'
    | 'RESULTS_APPROVED'
    | 'FEE_PAYMENT_RECORDED'
    | 'MFA_TOGGLED';
  userId?: string;
  userIdentifier: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
}

export interface PasswordResetRecord {
  id: string;
  userId: string;
  tokenHash: string;
  recoveryCode: string;
  expiresAt: number;
  isUsed: boolean;
}

export interface SystemSettings {
  academicYear: string;
  activeSemester: string;
  semesterStartDate: string;
  vacationDate: string;
  reopeningDate: string;
  nextTermFees: number;
  sbaWeightPercentage: number;
  examWeightPercentage: number;
  resultsApproved: boolean;
  approvedBy?: string;
  approvalDate?: string;
}

export interface FeeRecord {
  id: string;
  studentId: string;
  studentName: string;
  indexNumber: string;
  classKey: string;
  amount: number;
  type: string;
  paymentMethod: string;
  referenceNo: string;
  receivedBy: string;
  date: string;
}

// =============================================================================
// CRYPTOGRAPHY & SECURITY UTILITIES
// =============================================================================

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
}

function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

function generateRecoveryCode(): string {
  return `NASS-${Math.floor(100000 + Math.random() * 900000)}`;
}

// =============================================================================
// IN-MEMORY SECURE STORE (INITIALIZED WITH SEED ROLES)
// =============================================================================

const usersStore: Map<string, UserAccount> = new Map();
const sessionsStore: Map<string, SessionRecord> = new Map();
const auditLogsStore: AuditLogEntry[] = [];
const passwordResetsStore: Map<string, PasswordResetRecord> = new Map();
const feeRecordsStore: FeeRecord[] = [
  {
    id: 'fee-001',
    studentId: 'usr-student-1',
    studentName: 'ACKAH CLINTON',
    indexNumber: '042260001',
    classKey: 'f1-agric-1',
    amount: 850.0,
    type: 'Term 1 School Bill & PTA Levy',
    paymentMethod: 'GCB Bank Deposit',
    referenceNo: 'GCB-ELM-98312',
    receivedBy: 'Mrs. Rebecca Nyame (Bursar)',
    date: '2026-09-12',
  },
];

const systemSettings: SystemSettings = {
  academicYear: '2026/2027',
  activeSemester: 'Term 1',
  semesterStartDate: '2026-09-08',
  vacationDate: '2026-12-18',
  reopeningDate: '2027-01-12',
  nextTermFees: 850.0,
  sbaWeightPercentage: 30,
  examWeightPercentage: 70,
  resultsApproved: true,
  approvedBy: 'Mr. Emmanuel Armah-Blay (Headmaster)',
  approvalDate: '2026-10-05',
};

// Helper to seed users
function seedUser(user: {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  rawPassword: string;
  isActive?: boolean;
  studentIndexNo?: string;
  linkedStudentName?: string;
  assignedClasses?: string[];
  assignedSubjects?: string[];
}) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(user.rawPassword, salt);
  const account: UserAccount = {
    id: user.id,
    username: user.username,
    email: user.email.toLowerCase(),
    fullName: user.fullName,
    role: user.role,
    phone: user.phone || '+233 24 100 2000',
    isActive: user.isActive !== undefined ? user.isActive : true,
    failedAttempts: 0,
    studentIndexNo: user.studentIndexNo,
    linkedStudentName: user.linkedStudentName,
    assignedClasses: user.assignedClasses,
    assignedSubjects: user.assignedSubjects,
    passwordSalt: salt,
    passwordHash: hash,
    mfaEnabled: false,
  };
  usersStore.set(user.id, account);
}

// 1. Super Admin
seedUser({
  id: 'usr-superadmin',
  username: 'superadmin',
  email: 'superadmin@nkrofulagric.edu.gh',
  fullName: 'De-Graft Quayson (ICT Lead & Architect)',
  role: 'super_admin',
  rawPassword: 'Admin@2026!',
});

// 2. Headmaster / School Administrator
seedUser({
  id: 'usr-headmaster',
  username: 'headmaster',
  email: 'headmaster@nkrofulagric.edu.gh',
  fullName: 'Mr. Emmanuel Armah-Blay (Headmaster)',
  role: 'headmaster',
  rawPassword: 'Head@2026!',
});

// 3. Assistant Headmaster (Academics)
seedUser({
  id: 'usr-asst-headmaster',
  username: 'asst.headmaster',
  email: 'asst.head@nkrofulagric.edu.gh',
  fullName: 'Mrs. Faustina Mensah (Asst. Head Academics)',
  role: 'assistant_headmaster',
  rawPassword: 'AsstHead@2026!',
});

// 4. Form Master / Class Teacher
seedUser({
  id: 'usr-form-master-1',
  username: 'form.master',
  email: 'formmaster.agric@nkrofulagric.edu.gh',
  fullName: 'Mr. Patrick Gyasi (Form 1 Agric 1 Master)',
  role: 'form_master',
  rawPassword: 'FormMaster@2026!',
  assignedClasses: ['f1-agric-1'],
  assignedSubjects: ['General Agriculture', 'Crop Husbandry & Horticulture'],
});

// 5. Subject Teacher
seedUser({
  id: 'usr-teacher-1',
  username: 'teacher.gyasi',
  email: 'teacher.gyasi@nkrofulagric.edu.gh',
  fullName: 'Mr. Augustine Baidoo (Integrated Science Lead)',
  role: 'teacher',
  rawPassword: 'Teacher@2026!',
  assignedClasses: ['f1-agric-1', 'f1-applied-tech-1'],
  assignedSubjects: ['Integrated Science', 'Biology'],
});

// 6. Accountant / Bursar
seedUser({
  id: 'usr-accountant',
  username: 'accountant',
  email: 'accountant@nkrofulagric.edu.gh',
  fullName: 'Mrs. Rebecca Nyame (Bursar)',
  role: 'accountant',
  rawPassword: 'Bursar@2026!',
});

// 7. Student (Form 1 2026/2027 entry)
seedUser({
  id: 'usr-student-1',
  username: '042260001',
  email: 'std.ackah@nkrofulagric.edu.gh',
  fullName: 'ACKAH CLINTON',
  role: 'student',
  rawPassword: 'Student@2026!',
  studentIndexNo: '042260001',
});

// 8. Parent / Guardian
seedUser({
  id: 'usr-parent-1',
  username: 'parent.ackah',
  email: 'parent.ackah@nkrofulagric.edu.gh',
  fullName: 'Elder Joseph Ackah (Parent)',
  role: 'parent',
  rawPassword: 'Parent@2026!',
  linkedStudentName: 'ACKAH CLINTON',
  studentIndexNo: '042260001',
});

// Audit log helper
function addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
  const item: AuditLogEntry = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };
  auditLogsStore.unshift(item);
  // Keep last 1,000 logs
  if (auditLogsStore.length > 1000) {
    auditLogsStore.pop();
  }
}

// Initial system seed audit log
addAuditLog({
  eventType: 'USER_CREATED',
  userIdentifier: 'system-init',
  details: 'Authentication system initialized with 8 GES institutional role profiles (2026/2027 Academic Year).',
});

// =============================================================================
// MAIN SERVER SETUP
// =============================================================================

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Middlewares
  app.use(express.json());
  app.use(cookieParser());

  // Security Headers
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Helper to extract client session
  const getSessionFromReq = (req: Request): SessionRecord | null => {
    const sessionId = req.cookies?.nass_session || (req.headers['x-session-token'] as string);
    if (!sessionId) return null;
    const session = sessionsStore.get(sessionId);
    if (!session) return null;
    if (session.expiresAt < Date.now()) {
      sessionsStore.delete(sessionId);
      return null;
    }
    return session;
  };

  // =============================================================================
  // AUTH & SYSTEM API ENDPOINTS
  // =============================================================================

  // 0. GET /api/system/config (System & Academic Year Context)
  app.get('/api/system/config', (req: Request, res: Response) => {
    return res.json({
      school: 'Nkroful Agricultural Senior High School',
      shortName: 'Nkroful Agric SHS',
      gesCode: 'GES-WR-NASS-042',
      academicYear: '2026/2027',
      activeSemester: 'First Semester',
      status: 'ACTIVE',
    });
  });

  // 1. GET /api/auth/me (Check current session)
  app.get('/api/auth/me', (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const session = getSessionFromReq(req);
    if (!session) {
      return res.status(401).json({ authenticated: false });
    }

    const user = usersStore.get(session.userId);
    if (!user || !user.isActive) {
      sessionsStore.delete(session.id);
      res.clearCookie('nass_session');
      return res.status(401).json({ authenticated: false, message: 'Account is inactive or disabled' });
    }

    return res.json({
      authenticated: true,
      csrfToken: session.csrfToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        studentIndexNo: user.studentIndexNo,
        linkedStudentName: user.linkedStudentName,
        assignedClasses: user.assignedClasses,
        assignedSubjects: user.assignedSubjects,
        lastLogin: user.lastLogin,
        mfaEnabled: !!user.mfaEnabled,
      },
    });
  });

  // 2. POST /api/auth/login (Authenticate user)
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { identifier, password, rememberMe } = req.body || {};
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Please enter both username/email and password.' });
    }

    const cleanIdentifier = String(identifier).trim().toLowerCase();

    // Find account by email or username or index number
    let matchedUser: UserAccount | undefined;
    for (const u of usersStore.values()) {
      if (
        u.email.toLowerCase() === cleanIdentifier ||
        u.username.toLowerCase() === cleanIdentifier ||
        (u.studentIndexNo && u.studentIndexNo.toLowerCase() === cleanIdentifier)
      ) {
        matchedUser = u;
        break;
      }
    }

    // Rate Limiting / Lockout check
    if (matchedUser && matchedUser.lockedUntil && matchedUser.lockedUntil > Date.now()) {
      const remainingMin = Math.ceil((matchedUser.lockedUntil - Date.now()) / 60000);
      addAuditLog({
        eventType: 'LOGIN_FAILED',
        userIdentifier: cleanIdentifier,
        ipAddress: ip,
        userAgent,
        details: `Account temporarily locked. ${remainingMin} minute(s) remaining.`,
      });
      return res.status(429).json({
        error: `Account is temporarily locked due to multiple failed attempts. Please try again in ${remainingMin} minute(s) or contact the ICT Administrator.`,
      });
    }

    // Authenticate credentials
    const isPasswordValid =
      matchedUser && verifyPassword(password, matchedUser.passwordSalt, matchedUser.passwordHash);

    if (!matchedUser || !isPasswordValid) {
      if (matchedUser) {
        matchedUser.failedAttempts += 1;
        // Lock after 5 consecutive failures
        if (matchedUser.failedAttempts >= 5) {
          matchedUser.lockedUntil = Date.now() + 15 * 60 * 1000; // 15 mins
        }
      }

      addAuditLog({
        eventType: 'LOGIN_FAILED',
        userIdentifier: cleanIdentifier,
        ipAddress: ip,
        userAgent,
        details: 'Invalid credentials entered.',
      });

      // Generic error message to prevent account enumeration
      return res.status(401).json({
        error: 'Invalid username, email, or password. Please verify your credentials and try again.',
      });
    }

    // Check account status
    if (!matchedUser.isActive) {
      addAuditLog({
        eventType: 'LOGIN_FAILED',
        userId: matchedUser.id,
        userIdentifier: cleanIdentifier,
        ipAddress: ip,
        userAgent,
        details: 'Attempt to log in to deactivated account.',
      });
      return res.status(403).json({
        error: 'Your account is currently disabled or suspended. Please contact the Headmaster or System Administrator.',
      });
    }

    // Reset failed attempts upon success
    matchedUser.failedAttempts = 0;
    matchedUser.lockedUntil = undefined;
    matchedUser.lastLogin = new Date().toISOString();

    // Create session & CSRF token
    const sessionId = generateSecureToken(32);
    const csrfToken = generateSecureToken(24);
    const durationMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000; // 30 days vs 8 hours
    const expiresAt = Date.now() + durationMs;

    const session: SessionRecord = {
      id: sessionId,
      userId: matchedUser.id,
      csrfToken,
      ipAddress: ip,
      userAgent,
      expiresAt,
      createdAt: new Date().toISOString(),
    };
    sessionsStore.set(sessionId, session);

    // Set secure HTTP-only cookie
    res.cookie('nass_session', sessionId, {
      httpOnly: true,
      secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
      sameSite: 'lax',
      maxAge: durationMs,
      path: '/',
    });

    // Record Audit Log
    addAuditLog({
      eventType: 'LOGIN_SUCCESS',
      userId: matchedUser.id,
      userIdentifier: matchedUser.email,
      ipAddress: ip,
      userAgent,
      details: `Successful sign-in as ${matchedUser.role}.`,
    });

    return res.json({
      success: true,
      csrfToken,
      user: {
        id: matchedUser.id,
        username: matchedUser.username,
        email: matchedUser.email,
        fullName: matchedUser.fullName,
        role: matchedUser.role,
        phone: matchedUser.phone,
        studentIndexNo: matchedUser.studentIndexNo,
        linkedStudentName: matchedUser.linkedStudentName,
        assignedClasses: matchedUser.assignedClasses,
        assignedSubjects: matchedUser.assignedSubjects,
        lastLogin: matchedUser.lastLogin,
        mfaEnabled: !!matchedUser.mfaEnabled,
      },
    });
  });

  // 3. POST /api/auth/logout (Secure Logout with CSRF check)
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const session = getSessionFromReq(req);
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Verify CSRF token from header or body
    const providedCsrf = req.headers['x-csrf-token'] || req.body?.csrfToken;
    if (session && session.csrfToken && providedCsrf !== session.csrfToken) {
      return res.status(403).json({ error: 'CSRF token mismatch on logout.' });
    }

    if (session) {
      const user = usersStore.get(session.userId);
      sessionsStore.delete(session.id);

      addAuditLog({
        eventType: 'LOGOUT',
        userId: user?.id,
        userIdentifier: user?.email || 'unknown',
        ipAddress: ip,
        userAgent,
        details: 'User logged out and session destroyed.',
      });
    }

    res.clearCookie('nass_session', { path: '/' });
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');

    return res.json({
      success: true,
      message: 'You have been logged out successfully.',
    });
  });

  // 4. POST /api/auth/forgot-password (Admin-assisted / cryptographic token workflow)
  app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
    const { identifier } = req.body || {};
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const cleanId = String(identifier || '').trim().toLowerCase();

    // Find account
    let targetUser: UserAccount | undefined;
    for (const u of usersStore.values()) {
      if (
        u.email.toLowerCase() === cleanId ||
        u.username.toLowerCase() === cleanId ||
        (u.studentIndexNo && u.studentIndexNo.toLowerCase() === cleanId)
      ) {
        targetUser = u;
        break;
      }
    }

    if (targetUser) {
      const recoveryCode = generateRecoveryCode();
      const rawToken = generateSecureToken(24);
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      const resetRecord: PasswordResetRecord = {
        id: `rst-${Date.now()}`,
        userId: targetUser.id,
        tokenHash,
        recoveryCode,
        expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
        isUsed: false,
      };
      passwordResetsStore.set(recoveryCode, resetRecord);

      addAuditLog({
        eventType: 'PASSWORD_RESET_REQUESTED',
        userId: targetUser.id,
        userIdentifier: targetUser.email,
        ipAddress: ip,
        details: `Password reset request created. Recovery Code: ${recoveryCode}`,
      });

      return res.json({
        success: true,
        message:
          'Password reset requested. As institutional email dispatch is regulated by the GES district ICT desk, an administrative recovery code has been generated.',
        recoveryCode,
        accountName: targetUser.fullName,
        instructions:
          'Provide this recovery code to the Headmaster or ICT Administrator to instantly authorize your password reset.',
      });
    }

    // Response when user is not found (anti-enumeration message)
    return res.json({
      success: true,
      message:
        'If an account exists with those credentials, recovery instructions and an authorization code have been generated.',
    });
  });

  // 5. POST /api/auth/reset-password (Complete password reset using recovery code)
  app.post('/api/auth/reset-password', (req: Request, res: Response) => {
    const { recoveryCode, newPassword } = req.body || {};
    if (!recoveryCode || !newPassword) {
      return res.status(400).json({ error: 'Recovery code and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const record = passwordResetsStore.get(String(recoveryCode).trim().toUpperCase());
    if (!record || record.isUsed || record.expiresAt < Date.now()) {
      return res.status(400).json({
        error: 'Invalid or expired recovery code. Please generate a new request.',
      });
    }

    const user = usersStore.get(record.userId);
    if (!user) {
      return res.status(404).json({ error: 'Associated user account not found.' });
    }

    // Update password
    const newSalt = crypto.randomBytes(16).toString('hex');
    user.passwordSalt = newSalt;
    user.passwordHash = hashPassword(newPassword, newSalt);
    user.failedAttempts = 0;
    user.lockedUntil = undefined;
    record.isUsed = true;

    // Invalidate any active sessions for this user
    for (const [sId, sess] of sessionsStore.entries()) {
      if (sess.userId === user.id) {
        sessionsStore.delete(sId);
      }
    }

    addAuditLog({
      eventType: 'PASSWORD_RESET_COMPLETED',
      userId: user.id,
      userIdentifier: user.email,
      details: 'Password was updated successfully via recovery code.',
    });

    return res.json({
      success: true,
      message: 'Your password has been reset successfully. You may now sign in with your new password.',
    });
  });

  // 6. GET /api/auth/audit-logs (Super Admin Only)
  app.get('/api/auth/audit-logs', (req: Request, res: Response) => {
    const session = getSessionFromReq(req);
    if (!session) return res.status(401).json({ error: 'Unauthorized.' });
    const user = usersStore.get(session.userId);
    if (!user || user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Super Administrator privileges required.' });
    }

    const query = String(req.query.q || '').toLowerCase();
    const eventType = String(req.query.event || '');

    const filtered = auditLogsStore.filter((log) => {
      const matchEvent = !eventType || log.eventType === eventType;
      const matchQuery =
        !query ||
        log.userIdentifier.toLowerCase().includes(query) ||
        (log.details && log.details.toLowerCase().includes(query));
      return matchEvent && matchQuery;
    });

    return res.json({ logs: filtered.slice(0, 100) });
  });

  // 7. GET /api/auth/users (Super Admin & Headmaster Only)
  app.get('/api/auth/users', (req: Request, res: Response) => {
    const session = getSessionFromReq(req);
    if (!session) return res.status(401).json({ error: 'Unauthorized.' });
    const user = usersStore.get(session.userId);
    if (!user || (user.role !== 'super_admin' && user.role !== 'headmaster')) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const safeList = Array.from(usersStore.values()).map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      fullName: u.fullName,
      role: u.role,
      phone: u.phone,
      isActive: u.isActive,
      studentIndexNo: u.studentIndexNo,
      linkedStudentName: u.linkedStudentName,
      assignedClasses: u.assignedClasses,
      lastLogin: u.lastLogin,
    }));

    return res.json({ users: safeList });
  });

  // 8. PATCH /api/auth/users/:id/status (Toggle user active/inactive)
  app.patch('/api/auth/users/:id/status', (req: Request, res: Response) => {
    const session = getSessionFromReq(req);
    if (!session) return res.status(401).json({ error: 'Unauthorized.' });
    const admin = usersStore.get(session.userId);
    if (!admin || admin.role !== 'super_admin') {
      return res.status(403).json({ error: 'Super Admin access required to modify user status.' });
    }

    const targetUser = usersStore.get(req.params.id);
    if (!targetUser) return res.status(404).json({ error: 'User not found.' });

    if (targetUser.id === admin.id) {
      return res.status(400).json({ error: 'Cannot deactivate your own Super Admin account.' });
    }

    targetUser.isActive = !targetUser.isActive;

    // If deactivated, kill user's active sessions immediately
    if (!targetUser.isActive) {
      for (const [sId, sess] of sessionsStore.entries()) {
        if (sess.userId === targetUser.id) {
          sessionsStore.delete(sId);
        }
      }
    }

    addAuditLog({
      eventType: targetUser.isActive ? 'ACCOUNT_ACTIVATED' : 'ACCOUNT_DEACTIVATED',
      userId: targetUser.id,
      userIdentifier: targetUser.email,
      details: `Account status updated to ${targetUser.isActive ? 'Active' : 'Inactive'} by ${admin.fullName}.`,
    });

    return res.json({
      success: true,
      isActive: targetUser.isActive,
      message: `User account is now ${targetUser.isActive ? 'active' : 'deactivated'}.`,
    });
  });

  // 9. GET /api/system/settings (Academic calendar, term, and grading policies)
  app.get('/api/system/settings', (req: Request, res: Response) => {
    return res.json({ settings: systemSettings });
  });

  // 10. PUT /api/system/settings (Update academic settings - Admin / Headmaster / Asst Headmaster)
  app.put('/api/system/settings', (req: Request, res: Response) => {
    const session = getSessionFromReq(req);
    if (!session) return res.status(401).json({ error: 'Unauthorized.' });
    const user = usersStore.get(session.userId);
    if (
      !user ||
      (user.role !== 'super_admin' &&
        user.role !== 'headmaster' &&
        user.role !== 'assistant_headmaster')
    ) {
      return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    }

    const {
      academicYear,
      activeSemester,
      semesterStartDate,
      vacationDate,
      reopeningDate,
      nextTermFees,
      sbaWeightPercentage,
    } = req.body || {};

    if (academicYear) systemSettings.academicYear = String(academicYear);
    if (activeSemester) systemSettings.activeSemester = String(activeSemester);
    if (semesterStartDate) systemSettings.semesterStartDate = String(semesterStartDate);
    if (vacationDate) systemSettings.vacationDate = String(vacationDate);
    if (reopeningDate) systemSettings.reopeningDate = String(reopeningDate);
    if (typeof nextTermFees === 'number') systemSettings.nextTermFees = nextTermFees;
    if (typeof sbaWeightPercentage === 'number') {
      systemSettings.sbaWeightPercentage = sbaWeightPercentage;
      systemSettings.examWeightPercentage = 100 - sbaWeightPercentage;
    }

    addAuditLog({
      eventType: 'SYSTEM_SETTINGS_UPDATED',
      userId: user.id,
      userIdentifier: user.email,
      details: `Academic calendar updated: Year ${systemSettings.academicYear}, ${systemSettings.activeSemester}, Reopening ${systemSettings.reopeningDate}.`,
    });

    return res.json({
      success: true,
      settings: systemSettings,
      message: 'Academic calendar updated successfully.',
    });
  });

  // 11. POST /api/system/approve-results (Headmaster/Asst Headmaster endorses terminal results)
  app.post('/api/system/approve-results', (req: Request, res: Response) => {
    const session = getSessionFromReq(req);
    if (!session) return res.status(401).json({ error: 'Unauthorized.' });
    const user = usersStore.get(session.userId);
    if (
      !user ||
      (user.role !== 'super_admin' &&
        user.role !== 'headmaster' &&
        user.role !== 'assistant_headmaster')
    ) {
      return res.status(403).json({
        error: 'Only the Headmaster or Assistant Headmaster can approve official results.',
      });
    }

    const { approve } = req.body || {};
    systemSettings.resultsApproved = approve !== false;
    systemSettings.approvedBy = `${user.fullName} (${user.role.replace('_', ' ').toUpperCase()})`;
    systemSettings.approvalDate = new Date().toISOString().split('T')[0];

    addAuditLog({
      eventType: 'RESULTS_APPROVED',
      userId: user.id,
      userIdentifier: user.email,
      details: `Terminal results for ${systemSettings.academicYear} ${systemSettings.activeSemester} endorsed and approved by ${user.fullName}.`,
    });

    return res.json({
      success: true,
      resultsApproved: systemSettings.resultsApproved,
      approvedBy: systemSettings.approvedBy,
      approvalDate: systemSettings.approvalDate,
      message: 'Terminal examination results officially endorsed & locked for transcript generation.',
    });
  });

  // 12. POST /api/auth/change-password (Authenticated user changes their own password)
  app.post('/api/auth/change-password', (req: Request, res: Response) => {
    const session = getSessionFromReq(req);
    if (!session) return res.status(401).json({ error: 'Unauthorized. Please sign in.' });
    const user = usersStore.get(session.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current password and new password are required.' });
    }

    if (!verifyPassword(currentPassword, user.passwordSalt, user.passwordHash)) {
      return res.status(400).json({ error: 'Current password entered is incorrect.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const newSalt = crypto.randomBytes(16).toString('hex');
    user.passwordSalt = newSalt;
    user.passwordHash = hashPassword(newPassword, newSalt);

    addAuditLog({
      eventType: 'PASSWORD_CHANGED',
      userId: user.id,
      userIdentifier: user.email,
      details: 'User successfully updated their account password.',
    });

    return res.json({ success: true, message: 'Your password has been changed successfully.' });
  });

  // 13. POST /api/auth/mfa/toggle (Toggle Two-Factor Authentication simulation)
  app.post('/api/auth/mfa/toggle', (req: Request, res: Response) => {
    const session = getSessionFromReq(req);
    if (!session) return res.status(401).json({ error: 'Unauthorized.' });
    const user = usersStore.get(session.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.mfaEnabled = !user.mfaEnabled;

    addAuditLog({
      eventType: 'MFA_TOGGLED',
      userId: user.id,
      userIdentifier: user.email,
      details: `Two-factor authentication ${user.mfaEnabled ? 'enabled' : 'disabled'}.`,
    });

    return res.json({
      success: true,
      mfaEnabled: user.mfaEnabled,
      message: `Two-factor authentication is now ${user.mfaEnabled ? 'activated' : 'deactivated'}.`,
    });
  });

  // 14. POST /api/auth/users/:id/force-reset (Admin forces password reset for any user)
  app.post('/api/auth/users/:id/force-reset', (req: Request, res: Response) => {
    const session = getSessionFromReq(req);
    if (!session) return res.status(401).json({ error: 'Unauthorized.' });
    const admin = usersStore.get(session.userId);
    if (!admin || (admin.role !== 'super_admin' && admin.role !== 'headmaster')) {
      return res.status(403).json({ error: 'Super Admin or Headmaster privileges required.' });
    }

    const targetUser = usersStore.get(req.params.id);
    if (!targetUser) return res.status(404).json({ error: 'Target user not found.' });

    const tempPassword = `Nass@${Math.floor(1000 + Math.random() * 9000)}!`;
    const newSalt = crypto.randomBytes(16).toString('hex');
    targetUser.passwordSalt = newSalt;
    targetUser.passwordHash = hashPassword(tempPassword, newSalt);
    targetUser.failedAttempts = 0;
    targetUser.lockedUntil = undefined;

    // Terminate existing sessions
    for (const [sId, sess] of sessionsStore.entries()) {
      if (sess.userId === targetUser.id) {
        sessionsStore.delete(sId);
      }
    }

    addAuditLog({
      eventType: 'FORCE_PASSWORD_RESET',
      userId: targetUser.id,
      userIdentifier: targetUser.email,
      details: `Temporary password generated by ${admin.fullName}.`,
    });

    return res.json({
      success: true,
      temporaryPassword: tempPassword,
      message: `Password reset successfully. The temporary password for ${targetUser.fullName} is: ${tempPassword}`,
    });
  });

  // 15. POST /api/auth/users (Create a new institutional user)
  app.post('/api/auth/users', (req: Request, res: Response) => {
    const session = getSessionFromReq(req);
    if (!session) return res.status(401).json({ error: 'Unauthorized.' });
    const admin = usersStore.get(session.userId);
    if (!admin || (admin.role !== 'super_admin' && admin.role !== 'headmaster')) {
      return res.status(403).json({ error: 'Super Admin or Headmaster privileges required.' });
    }

    const {
      username,
      email,
      fullName,
      role,
      rawPassword,
      phone,
      studentIndexNo,
      assignedClasses,
      assignedSubjects,
    } = req.body || {};
    if (!username || !email || !fullName || !role || !rawPassword) {
      return res.status(400).json({
        error: 'Username, email, full name, role, and initial password are required.',
      });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const cleanEmail = String(email).trim().toLowerCase();

    // Check duplicate
    for (const u of usersStore.values()) {
      if (u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanEmail) {
        return res
          .status(400)
          .json({ error: 'A user with that username or email address already exists.' });
      }
    }

    const newId = `usr-${Date.now()}`;
    seedUser({
      id: newId,
      username: cleanUsername,
      email: cleanEmail,
      fullName: String(fullName).trim(),
      role: role as UserRole,
      phone,
      rawPassword: String(rawPassword),
      studentIndexNo,
      assignedClasses,
      assignedSubjects,
    });

    addAuditLog({
      eventType: 'USER_CREATED',
      userId: newId,
      userIdentifier: cleanEmail,
      details: `New account created with role ${role} by ${admin.fullName}.`,
    });

    return res.json({ success: true, message: `Account for ${fullName} created successfully.` });
  });

  // 16. GET /api/bursary/summary (Accountant fee ledger summary)
  app.get('/api/bursary/summary', (req: Request, res: Response) => {
    const session = getSessionFromReq(req);
    if (!session) return res.status(401).json({ error: 'Unauthorized.' });
    const user = usersStore.get(session.userId);
    if (!user) return res.status(401).json({ error: 'User not found.' });

    const totalCollected = feeRecordsStore.reduce((acc, curr) => acc + curr.amount, 0);

    return res.json({
      totalCollected,
      targetFeePerStudent: systemSettings.nextTermFees,
      transactions: feeRecordsStore,
    });
  });

  // 17. POST /api/bursary/payments (Record a new fee transaction)
  app.post('/api/bursary/payments', (req: Request, res: Response) => {
    const session = getSessionFromReq(req);
    if (!session) return res.status(401).json({ error: 'Unauthorized.' });
    const user = usersStore.get(session.userId);
    if (
      !user ||
      (user.role !== 'accountant' &&
        user.role !== 'super_admin' &&
        user.role !== 'headmaster')
    ) {
      return res.status(403).json({
        error: 'Only the Accountant or Administrator can record fee payments.',
      });
    }

    const { studentName, indexNumber, classKey, amount, type, paymentMethod, referenceNo } =
      req.body || {};
    if (!studentName || !amount || !paymentMethod) {
      return res.status(400).json({ error: 'Student name, amount, and payment method are required.' });
    }

    const newRecord: FeeRecord = {
      id: `fee-${Date.now()}`,
      studentId: `std-${indexNumber || 'unknown'}`,
      studentName: String(studentName),
      indexNumber: String(indexNumber || 'N/A'),
      classKey: String(classKey || 'N/A'),
      amount: Number(amount),
      type: String(type || 'Term Fees'),
      paymentMethod: String(paymentMethod),
      referenceNo: String(referenceNo || `REC-${Math.floor(100000 + Math.random() * 900000)}`),
      receivedBy: user.fullName,
      date: new Date().toISOString().split('T')[0],
    };

    feeRecordsStore.unshift(newRecord);

    addAuditLog({
      eventType: 'FEE_PAYMENT_RECORDED',
      userId: user.id,
      userIdentifier: user.email,
      details: `Payment of GH¢ ${newRecord.amount} recorded for ${newRecord.studentName} (${newRecord.referenceNo}).`,
    });

    return res.json({
      success: true,
      transaction: newRecord,
      message: 'Fee payment receipt logged successfully.',
    });
  });

  // =============================================================================
  // VITE DEVELOPMENT MIDDLEWARES / PRODUCTION STATIC SERVING
  // =============================================================================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nkroful Agric SHS Portal running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
