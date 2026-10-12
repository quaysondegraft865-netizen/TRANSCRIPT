-- =============================================================================
-- NKROFUL AGRIC SENIOR HIGH SCHOOL - TRANSCRIPT & RESULT MANAGEMENT SYSTEM
-- AUTHENTICATION & ACCESS CONTROL SCHEMA MIGRATION
-- GES Code: GES-WR-NASS-042 | Ellembelle District, Western Region, Ghana
-- =============================================================================

-- 1. SCHOOLS TABLE (Supports multi-school tenancy if required)
CREATE TABLE IF NOT EXISTS schools (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(100) NOT NULL,
    ges_code VARCHAR(50) NOT NULL UNIQUE,
    location VARCHAR(255) NOT NULL,
    motto VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    school_id VARCHAR(36) NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    password_salt VARCHAR(100) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN (
        'super_admin',
        'headmaster',
        'teacher',
        'accountant',
        'student',
        'parent'
    )),
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE NULL,
    student_index_no VARCHAR(50) NULL,      -- Used when role is 'student'
    linked_student_id VARCHAR(36) NULL,     -- Used when role is 'parent'
    assigned_classes TEXT[] NULL,           -- Used when role is 'teacher'
    assigned_subjects TEXT[] NULL,          -- Used when role is 'teacher'
    last_login TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_student_index ON users(student_index_no);

-- 3. SESSIONS TABLE (Server-side Session & Token Store)
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    csrf_token VARCHAR(128) NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- 4. PASSWORD RESETS TABLE (Cryptographic Token Hashes)
CREATE TABLE IF NOT EXISTS password_resets (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(128) NOT NULL UNIQUE,
    recovery_code VARCHAR(20) NOT NULL, -- For admin-assisted recovery
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);

-- 5. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    school_id VARCHAR(36) NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    user_id VARCHAR(36) NULL REFERENCES users(id) ON DELETE SET NULL,
    user_identifier VARCHAR(255) NOT NULL, -- email, username, or IP
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'LOGIN_SUCCESS',
        'LOGIN_FAILED',
        'LOGOUT',
        'PASSWORD_RESET_REQUESTED',
        'PASSWORD_RESET_COMPLETED',
        'ACCOUNT_LOCKED',
        'ACCOUNT_ACTIVATED',
        'ACCOUNT_DEACTIVATED',
        'USER_CREATED',
        'PASSWORD_CHANGED'
    )),
    ip_address VARCHAR(50),
    user_agent TEXT,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_event ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- 6. INITIAL SEED DATA FOR NKROFUL AGRIC SHS
INSERT INTO schools (id, name, short_name, ges_code, location, motto)
VALUES (
    'sch-nass-001',
    'Nkroful Agricultural Senior High School',
    'Nkroful Agric SHS',
    'GES-WR-NASS-042',
    'P.O. Box 14, Nkroful, Ellembelle District, Western Region, Ghana',
    'Knowledge, Integrity, Service'
) ON CONFLICT (ges_code) DO NOTHING;

-- 7. ACADEMIC YEARS TABLE & CURRENT CONTEXT (2026/2027)
CREATE TABLE IF NOT EXISTS academic_years (
    id VARCHAR(36) PRIMARY KEY,
    school_id VARCHAR(36) NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    year_label VARCHAR(50) NOT NULL UNIQUE, -- '2026/2027'
    is_current BOOLEAN DEFAULT FALSE,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO academic_years (id, school_id, year_label, is_current, start_date, end_date)
VALUES (
    'ay-2026-2027',
    'sch-nass-001',
    '2026/2027',
    TRUE,
    '2026-09-01',
    '2027-07-31'
) ON CONFLICT (year_label) DO NOTHING;
