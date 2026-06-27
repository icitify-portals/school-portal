import { mysqlTable, int, varchar, text, timestamp, boolean, mysqlEnum, char, decimal, date, mediumtext, unique, datetime, foreignKey, time, uniqueIndex } from 'drizzle-orm/mysql-core';
import { relations, sql } from 'drizzle-orm';

// --- CORE / USER MODULE ---
export const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  schoolPortalId: varchar('school_portal_id', { length: 255 }).unique(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  requiresPasswordChange: boolean('requires_password_change').default(false),
  role: mysqlEnum('role', ['admin', 'staff', 'student', 'dvc', 'healthadmin', 'applicant', 'fresher', 'superadmin', 'parent', 'icitify_dev', 'bursar', 'registrar', 'librarian', 'hod', 'dean', 'admission_officer']).default('student'),
  status: mysqlEnum('status', ['active', 'suspended', 'withdrawn', 'graduated', 'rusticated']).default('active'),
  phone: varchar('phone', { length: 20 }),
  imageUrl: varchar('image_url', { length: 255 }),
  failedLoginAttempts: int('failed_login_attempts').default(0),
  lockoutUntil: datetime('lockout_until'),
  createdAt: timestamp('created_at').defaultNow(),
  deletedAt: datetime('deleted_at'),
  officeDescription: text('office_description'), // Description of the user's professional role/office
  dateOfBirth: date('date_of_birth'), // Added for HR Birthday/Occasion tracking
  twoFactorEnabled: boolean('two_factor_enabled').default(false),
  twoFactorSecret: text('two_factor_secret'),
  twoFactorBackupCodes: text('two_factor_backup_codes'),
});

export const userPermissions = mysqlTable('user_permissions', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').references(() => users.id).notNull(),
  permissionKey: varchar('permission_key', { length: 100 }).notNull(), // e.g., "RegisterUser", "DeleteUser"
  isGranted: boolean('is_granted').default(true),
  grantedBy: int('granted_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const otpLogs = mysqlTable('otp_logs', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').references(() => users.id).notNull(),
  otpId: varchar('otp_id', { length: 50 }).unique().notNull(), // Unique ID for the OTP session
  otpCode: varchar('otp_code', { length: 10 }).notNull(),
  isUsed: boolean('is_used').default(false),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const systemAuditLogs = mysqlTable('system_audit_logs', {
  id: int('id').autoincrement().primaryKey(),
  actorId: int('actor_id').references(() => users.id).notNull(),
  action: varchar('action', { length: 100 }).notNull(), // e.g., "NEXUS_SYNC", "IMPERSONATION", "ROLE_PROMOTION"
  targetId: varchar('target_id', { length: 100 }), // The Node ID or User ID being acted upon
  details: text('details'), // JSON metadata of the operation
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  status: mysqlEnum('status', ['success', 'failure', 'warning']).default('success'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const passwordResetTokens = mysqlTable('password_reset_tokens', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').references(() => users.id).notNull(),
  token: varchar('token', { length: 255 }).unique().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const parents = mysqlTable('parents', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').references(() => users.id).unique().notNull(),
  address: text('address'),
  occupation: varchar('occupation', { length: 255 }),
  nin: varchar('nin', { length: 11 }),
  ninVerified: boolean('nin_verified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const parentStudentMappings = mysqlTable('parent_student_mappings', {
  id: int('id').autoincrement().primaryKey(),
  parentId: int('parent_id').references(() => users.id).notNull(), // userId of the parent
  studentId: int('student_id').references(() => students.id).notNull(),
  relationship: mysqlEnum('relationship', ['father', 'mother', 'guardian', 'other']).notNull(),
  isPrimary: boolean('is_primary').default(true),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  unq: unique().on(table.parentId, table.studentId),
}));

// --- CRM & MARKETING MODULE ---
export const crmLeads = mysqlTable('crm_leads', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  source: varchar('source', { length: 100 }).default('website'), // website, social, walk-in, referral
  programmeId: int('programme_id').references(() => programmes.id),
  unitId: int('unit_id').references(() => institutionalUnits.id),
  status: mysqlEnum('status', ['new', 'contacted', 'interested', 'qualified', 'converted', 'closed', 'junk']).default('new'),
  priority: mysqlEnum('priority', ['low', 'medium', 'high']).default('medium'),
  assignedStaffId: int('assigned_staff_id').references(() => users.id),
  lastContactedAt: datetime('last_contacted_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const crmLeadInteractions = mysqlTable('crm_lead_interactions', {
  id: int('id').autoincrement().primaryKey(),
  leadId: int('lead_id').references(() => crmLeads.id).notNull(),
  staffId: int('staff_id').references(() => users.id).notNull(),
  type: mysqlEnum('type', ['call', 'email', 'meeting', 'whatsapp', 'note']).notNull(),
  summary: text('summary').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// --- ACADEMIC STRUCTURE ---
export const faculties = mysqlTable('faculties', {
  id: int('id').autoincrement().primaryKey(),
  unitId: int('unit_id').references(() => institutionalUnits.id),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 15 }).notNull(),
});

export const departments = mysqlTable('departments', {
  id: int('id').autoincrement().primaryKey(),
  facultyId: int('faculty_id').references(() => faculties.id),
  unitId: int('unit_id').references(() => institutionalUnits.id),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 10 }).unique().notNull(),
  minUnitsAnnual: int('min_units_annual').default(24),
  maxUnitsAnnual: int('max_units_annual').default(48),
  minUnitsSemester: int('min_units_semester').default(12),
  maxUnitsSemester: int('max_units_semester').default(24),
  timetableStart: varchar('timetable_start', { length: 5 }).default('08:00'),
  timetableEnd: varchar('timetable_end', { length: 5 }).default('16:00'),
  breakStart: varchar('break_start', { length: 5 }).default('13:00'),
  breakEnd: varchar('break_end', { length: 5 }).default('14:00'),
});

export const programmes = mysqlTable('programmes', {
  id: int('id').autoincrement().primaryKey(),
  deptId: int('dept_id').references(() => departments.id),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 20 }), // Required for seeding/lookup
  durationMonths: int('duration_months').notNull(),
  durationYears: int('duration_years').default(4), // max level = durationYears * 100
  cutOffMark: int('cut_off_mark').default(180),
  catchmentAreas: text('catchment_areas'), // JSON array: ["Lagos", "Ogun"]
  meritQuota: int('merit_quota').default(45), // Percentage for merit
  scoringStrategy: mysqlEnum('scoring_strategy', ['JAMB_ONLY', 'WEIGHTED_AGGREGATE', 'OLEVEL_POINTS', 'CUSTOM', 'IBADAN_50_50', 'UTME_OVER_8_PLUS_POST_UTME_OVER_2', 'UTME_PERCENTAGE_PLUS_POST_UTME_PERCENTAGE']).default('JAMB_ONLY'),
  scoringConfig: text('scoring_config'), // JSON for specific strategy parameters
});

export const studentGroups = mysqlTable('student_groups', {
  id: int('id').autoincrement().primaryKey(),
  unitId: int('unit_id').references(() => institutionalUnits.id),
  name: varchar('name', { length: 100 }).notNull(), // e.g., 'A', 'Blue', 'Gold'
  level: int('level').notNull(), // e.g., 100, 200, or 1, 2 for Primary
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const courses = mysqlTable('courses', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 15 }).notNull(),
  creditUnits: int('credit_units').notNull(),
  description: text('description'),
  isPractical: boolean('is_practical').default(false),
  isUniversityRequired: boolean('is_university_required').default(false),
  countsForCgpa: boolean('counts_for_cgpa').default(true),
  xpMultiplier: decimal('xp_multiplier', { precision: 3, scale: 2 }).default('1.00'),
  isGroupSubject: boolean('is_group_subject').default(false),
  parentCourseId: int('parent_course_id'), // Self-reference for Grouped Subjects
});

export const courseComponents = mysqlTable('course_components', {
  id: int('id').autoincrement().primaryKey(),
  courseId: int('course_id').references(() => courses.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(), // e.g., Comprehension, Oral English
  maxMarks: decimal('max_marks', { precision: 5, scale: 2 }).default('100.00'),
  weight: decimal('weight', { precision: 5, scale: 2 }).default('1.00'),
});

// A course can belong to multiple departments with different settings
export const courseDepartmentSettings = mysqlTable('course_department_settings', {
  courseId: int('course_id').references(() => courses.id).notNull(),
  deptId: int('dept_id').references(() => departments.id).notNull(),
  semester: mysqlEnum('semester', ['1', '2']).notNull(),
  status: mysqlEnum('status', ['compulsory', 'required', 'elective']).default('compulsory').notNull(),
  level: int('level').default(100), // e.g., 100, 200...
}, (table) => ({
  pk: { columns: [table.courseId, table.deptId] },
}));

export const admissionSessions = mysqlTable('admission_sessions', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  startDate: datetime('start_date').notNull(),
  endDate: datetime('end_date').notNull(),
  applicationFee: decimal('application_fee', { precision: 12, scale: 2 }).default('0.00'),
  screeningMode: mysqlEnum('screening_mode', ['CBT', 'Interview', 'Document Only']).default('CBT'),
  logoUrl: text('logo_url'),
  instructions: text('instructions'),
  dynamicFields: text('dynamic_fields'), // JSON config for extra form fields
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// --- STUDENT SPECIFIC ---
export const students = mysqlTable('students', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').references(() => users.id),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }), // Surname
  otherNames: varchar('other_names', { length: 100 }),
  admissionNumber: varchar('admission_number', { length: 50 }).unique(),
  programmeId: int('programme_id').references(() => programmes.id),
  deptId: int('dept_id').references(() => departments.id),
  unitId: int('unit_id').references(() => institutionalUnits.id),
  groupId: int('group_id').references(() => studentGroups.id), // For Class Arms (A, B, etc.)
  matricNumber: varchar('matric_number', { length: 50 }).unique(),
  previousMatricNumbers: text('previous_matric_numbers'), // JSON: ["OLD/001", "OLD/002"]
  legacyAccessUnits: text('legacy_access_units'), // JSON: [1, 5, 12] (Unit IDs that can still view)
  admissionYear: int('admission_year'),
  admissionSessionId: int('admission_session_id').references(() => academicSessions.id),
  currentLevel: int('current_level').default(100),
  jambNumber: varchar('jamb_number', { length: 50 }).unique(),
  walletBalance: decimal('wallet_balance', { precision: 12, scale: 2 }).default('0.00'),
  barcode: varchar('barcode', { length: 255 }).unique(),
  gender: mysqlEnum('gender', ['male', 'female', 'other']),
  dob: varchar('dob', { length: 50 }),
  imageUrl: varchar('image_url', { length: 255 }),
  isProfileLocked: boolean('is_profile_locked').default(false),
  isFinanciallyLocked: boolean('is_financially_locked').default(false),
  nin: varchar('nin', { length: 11 }),
  ninVerified: boolean('nin_verified').default(false),
  status: mysqlEnum('status', ['active', 'graduated', 'withdrawn', 'suspended', 'rusticated']).default('active'),

  // Guardian Details
  guardianName: varchar('guardian_name', { length: 255 }),
  guardianAddress: text('guardian_address'),
  guardianOccupation: varchar('guardian_occupation', { length: 255 }),
  guardianPhone: varchar('guardian_phone', { length: 20 }),
  guardianWhatsapp: varchar('guardian_whatsapp', { length: 20 }),
  guardianEmail: varchar('guardian_email', { length: 150 }),

  // Next of Kin
  kinName: varchar('kin_name', { length: 255 }),
  kinAddress: text('kin_address'),
  kinOccupation: varchar('kin_occupation', { length: 255 }),
  kinPhone: varchar('kin_phone', { length: 20 }),
  kinWhatsapp: varchar('kin_whatsapp', { length: 20 }),
  kinEmail: varchar('kin_email', { length: 150 }),

  // Health Records
  doctorName: varchar('doctor_name', { length: 255 }),
  doctorAddress: text('doctor_address'),
  doctorPhone: varchar('doctor_phone', { length: 20 }),
  doctorWhatsapp: varchar('doctor_whatsapp', { length: 20 }),
  doctorEmail: varchar('doctor_email', { length: 150 }),
  ailments: text('ailments'), // List of chronic conditions
  operations: text('operations'), // History of surgeries
  foodAllergies: text('food_allergies'),
  bloodGroup: varchar('blood_group', { length: 10 }),
  healthStatus: mysqlEnum('health_status', ['pending', 'cleared', 'flagged']).default('pending'),
  healthNotes: text('health_notes'),
  genotype: varchar('genotype', { length: 10 }),
  nationality: varchar('nationality', { length: 100 }).default('Nigerian'),
  modeOfEntry: varchar('mode_of_entry', { length: 50 }).default('UTME'),
  graduatedAt: datetime('graduated_at'),
  classOfDegree: varchar('class_of_degree', { length: 100 }),
  deletedAt: datetime('deleted_at'),
});

export const walletTransactions = mysqlTable('wallet_transactions', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  type: mysqlEnum('type', ['credit', 'debit']).notNull(),
  purpose: varchar('purpose', { length: 255 }).notNull(), // e.g., "Online Top-up", "Tuition Payment"
  reference: varchar('reference', { length: 100 }).unique(), // External Gateway Ref
  status: mysqlEnum('status', ['pending', 'success', 'failed']).default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
});

// --- HEALTH MANAGEMENT MODULE ---
export const healthRecords = mysqlTable('health_records', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(), // e.g. "Chest X-Ray", "Full Blood Count"
  type: mysqlEnum('type', ['xray', 'blood_test', 'eye_test', 'other']).default('other'),
  fileUrl: varchar('file_url', { length: 500 }).notNull(),
  description: text('description'),
  status: mysqlEnum('status', ['pending', 'verified', 'rejected']).default('pending'),
  verifiedBy: int('verified_by').references(() => users.id),
  verifiedAt: datetime('verified_at'),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const studentVitals = mysqlTable('student_vitals', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  recordedBy: int('recorded_by').references(() => users.id).notNull(),
  weight: decimal('weight', { precision: 5, scale: 2 }), // in kg
  height: decimal('height', { precision: 5, scale: 2 }), // in cm
  bloodPressure: varchar('blood_pressure', { length: 20 }), // e.g. "120/80"
  pulse: int('pulse'),
  temperature: decimal('temperature', { precision: 4, scale: 1 }),
  respiratoryRate: int('respiratory_rate'),
  oxygenSaturation: int('oxygen_saturation'), // in %
  notes: text('notes'),
  recordedAt: timestamp('recorded_at').defaultNow(),
});

export const medicalAppointments = mysqlTable('medical_appointments', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  appointmentDate: datetime('appointment_date').notNull(),
  reason: text('reason').notNull(),
  status: mysqlEnum('status', ['pending', 'approved', 'completed', 'cancelled']).default('pending'),
  notes: text('notes'),
  prescriptions: text('prescriptions'),
  doctorNotes: text('doctor_notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const medicalInventory = mysqlTable('medical_inventory', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  category: mysqlEnum('category', ['drug', 'consumable', 'equipment']).default('drug'),
  quantity: int('quantity').default(0).notNull(),
  unit: varchar('unit', { length: 50 }).notNull(), // e.g., 'tablets', 'bottles', 'syringes'
  expiryDate: datetime('expiry_date'),
  minThreshold: int('min_threshold').default(10), // For low stock alerts
  createdAt: timestamp('created_at').defaultNow(),
});

export const medicalDispensations = mysqlTable('medical_dispensations', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  inventoryId: int('inventory_id').references(() => medicalInventory.id).notNull(),
  appointmentId: int('appointment_id').references(() => medicalAppointments.id),
  quantityDispensed: int('quantity_dispensed').notNull(),
  dispensedBy: int('dispensed_by').references(() => users.id).notNull(),
  dispensedAt: timestamp('dispensed_at').defaultNow(),
  notes: text('notes'),
});

export const medicalExcusats = mysqlTable('medical_excusats', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  issuedBy: int('issued_by').references(() => users.id).notNull(),
  startDate: datetime('start_date').notNull(),
  endDate: datetime('end_date').notNull(),
  reason: text('reason').notNull(),
  status: mysqlEnum('status', ['active', 'expired', 'revoked']).default('active'),
  createdAt: timestamp('created_at').defaultNow(),
});

// --- SIWES MODULE ---
export const siwesConfigs = mysqlTable('siwes_configs', {
  id: int('id').autoincrement().primaryKey(),
  facultyId: int('faculty_id').references(() => faculties.id),
  deptId: int('dept_id').references(() => departments.id),
  programmeId: int('programme_id').references(() => programmes.id),
  semester: mysqlEnum('semester', ['1', '2']).notNull(),
  durationMonths: int('duration_months').notNull(),
  isActive: boolean('is_active').default(true),
});

export const siwesCompanies = mysqlTable('siwes_companies', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address').notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  isApproved: boolean('is_approved').default(true),
  addedById: int('added_by_id').references(() => users.id), // If student suggested
});

export const siwesPlacements = mysqlTable('siwes_placements', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  companyId: int('company_id').references(() => siwesCompanies.id).notNull(),
  startDate: date('start_date'),
  endDate: date('end_date'),
  status: mysqlEnum('status', ['applied', 'accepted', 'rejected', 'completed', 'cancelled']).default('applied'),
  acceptanceLetterUrl: varchar('acceptance_letter_url', { length: 500 }),
  logbookUrl: varchar('logbook_url', { length: 500 }), // Monthly/Final logbook
  supervisorId: int('supervisor_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const siwesLogbooks = mysqlTable('siwes_logbooks', {
  id: int('id').autoincrement().primaryKey(),
  placementId: int('placement_id').references(() => siwesPlacements.id).notNull(),
  weekNumber: int('week_number').notNull(),
  activities: text('activities'),
  signedLogbookUrl: varchar('signed_logbook_url', { length: 500 }),
  status: mysqlEnum('status', ['submitted', 'approved', 'flagged']).default('submitted'),
  submittedAt: timestamp('submitted_at').defaultNow(),
});

export const siwesAssessments = mysqlTable('siwes_assessments', {
  id: int('id').autoincrement().primaryKey(),
  placementId: int('placement_id').references(() => siwesPlacements.id).notNull(),
  supervisorScore: int('supervisor_score'),
  supervisorComment: text('supervisor_comment'),
  finalReportUrl: varchar('final_report_url', { length: 500 }),
  centreApprovalStatus: mysqlEnum('centre_approval_status', ['pending', 'approved', 'rejected']).default('pending'),
  centreComment: text('centre_comment'),
  assessedAt: datetime('assessed_at'),
});

// --- FINANCE MODULE ---
export const transactions = mysqlTable('transactions', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  type: mysqlEnum('type', ['credit', 'debit']).notNull(),
  purpose: varchar('purpose', { length: 255 }).notNull(), // e.g., "Registration fee", "Hostel fee"
  status: mysqlEnum('status', ['pending', 'completed', 'failed', 'reversed']).default('pending'),
  gateway: mysqlEnum('gateway', ['paystack', 'flutterwave', 'remita', 'opay', 'manual']).default('remita'),
  gatewayReference: varchar('gateway_reference', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// --- ACADEMIC RECORDS ---
export const enrollments = mysqlTable('enrollments', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id),
  courseId: int('course_id').references(() => courses.id),
  sessionId: int('session_id').references(() => academicSessions.id),
  academicYear: varchar('academic_year', { length: 20 }).notNull(),
  semester: int('semester').notNull(),
  status: mysqlEnum('status', ['pending', 'approved', 'rejected']).default('pending').notNull(),
  enrollmentDate: timestamp('enrollment_date').defaultNow(),
});

export const results = mysqlTable('results', {
  id: int('id').autoincrement().primaryKey(),
  enrollmentId: int('enrollment_id').references(() => enrollments.id),
  caScore: decimal('ca_score', { precision: 5, scale: 2 }).default('0.00'),
  examScore: decimal('exam_score', { precision: 5, scale: 2 }).default('0.00'),
  totalScore: decimal('total_score', { precision: 5, scale: 2 }).default('0.00'),
  score: int('score'), // Legacy/Compatibility
  grade: varchar('grade', { length: 2 }),
  gradePoint: decimal('grade_point', { precision: 4, scale: 2 }),
  teacherRemark: text('teacher_remark'),
  status: mysqlEnum('status', ['pending', 'published', 'approved', 'rejected']).default('pending'),
  isGpaCourse: boolean('is_gpa_course').default(true),
  isApproved: boolean('is_approved').default(false),
  isProrated: boolean('is_prorated').default(false),
  rankClass: varchar('rank_class', { length: 20 }), // e.g. "1/30"
  rankLevel: varchar('rank_level', { length: 20 }), // e.g. "5/120"
  lastEditedBy: int('last_edited_by').references(() => users.id),
  lastEditedAt: datetime('last_edited_at'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const componentResults = mysqlTable('component_results', {
  id: int('id').autoincrement().primaryKey(),
  resultId: int('result_id').references(() => results.id).notNull(),
  componentId: int('component_id').references(() => courseComponents.id).notNull(),
  score: decimal('score', { precision: 5, scale: 2 }).default('0.00'),
  recordedBy: int('recorded_by').references(() => users.id),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const resultAuditLogs = mysqlTable('result_audit_logs', {
  id: int('id').autoincrement().primaryKey(),
  resultId: int('result_id').references(() => results.id).notNull(),
  editorId: int('editor_id').references(() => users.id).notNull(),
  oldCaScore: decimal('old_ca_score', { precision: 5, scale: 2 }),
  newCaScore: decimal('new_ca_score', { precision: 5, scale: 2 }),
  oldExamScore: decimal('old_exam_score', { precision: 5, scale: 2 }),
  newExamScore: decimal('new_exam_score', { precision: 5, scale: 2 }),
  oldTotalScore: decimal('old_total_score', { precision: 5, scale: 2 }),
  newTotalScore: decimal('new_total_score', { precision: 5, scale: 2 }),
  reason: text('reason'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const gradingSystemAssignments = mysqlTable('grading_system_assignments', {
  id: int('id').autoincrement().primaryKey(),
  gradingSystemId: int('grading_system_id').notNull(),
  sessionId: int('session_id').references(() => academicSessions.id).notNull(),
  facultyId: int('faculty_id').references(() => faculties.id),
  deptId: int('dept_id').references(() => departments.id),
  programmeId: int('programme_id').references(() => programmes.id),
  priority: int('priority').default(0), // Higher priority takes precedence (e.g., Programme over Faculty)
}, (table) => ({
  sysFk: foreignKey({
    name: 'grd_sys_asg_sys_id_fk',
    columns: [table.gradingSystemId],
    foreignColumns: [gradingSystems.id],
  }),
}));

export const gradingConfigurations = mysqlTable('grading_configurations', {
  id: int('id').autoincrement().primaryKey(),
  courseId: int('course_id').references(() => courses.id).notNull(),
  sessionId: int('session_id').references(() => academicSessions.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(), // e.g. "Continuous Assessment 1"
  type: mysqlEnum('type', ['assignment', 'quiz', 'attendance', 'manual', 'exam']).notNull(),
  linkedId: int('linked_id'), // ID of the assignment or quiz
  maxMarks: int('max_marks').notNull(),
  weight: int('weight').notNull(), // points out of the total CA/Exam
  order: int('order').notNull(),
});

export const studentCourseRegistrations = mysqlTable('student_course_registrations', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  courseId: int('course_id').references(() => courses.id).notNull(),
  sessionId: int('session_id').references(() => academicSessions.id).notNull(),
  semester: mysqlEnum('semester', ['1', '2']).notNull(),
  isWaiver: boolean('is_waiver').default(false),
  // Multi-Level Approval Status
  advisorStatus: mysqlEnum('advisor_status', ['pending', 'approved', 'rejected']).default('pending'),
  hodStatus: mysqlEnum('hod_status', ['pending', 'approved', 'rejected']).default('pending'),
  finalStatus: mysqlEnum('final_status', ['pending', 'approved', 'rejected']).default('pending'),
  registeredAt: timestamp('registered_at').defaultNow(),
  advisorApprovedBy: int('advisor_approved_by').references(() => users.id),
  advisorApprovedAt: datetime('advisor_approved_at'),
  hodApprovedBy: int('hod_approved_by').references(() => users.id),
  hodApprovedAt: datetime('hod_approved_at'),
});

export const courseRegistrationWaivers = mysqlTable('course_registration_waivers', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  courseId: int('course_id').references(() => courses.id).notNull(),
  grantedBy: int('granted_by').references(() => users.id).notNull(),
  reason: text('reason').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const coursePrerequisites = mysqlTable('course_prerequisites', {
  id: int('id').autoincrement().primaryKey(),
  courseId: int('course_id').references(() => courses.id).notNull(),
  prerequisiteId: int('prerequisite_id').references(() => courses.id).notNull(),
  minGrade: varchar('min_grade', { length: 2 }).default('D'), // Minimum grade required to pass
});

export const courseEvaluations = mysqlTable('course_evaluations', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  courseId: int('course_id').references(() => courses.id).notNull(),
  staffId: int('staff_id').references(() => staffProfiles.id),
  sessionId: int('session_id').references(() => academicSessions.id).notNull(),
  semester: mysqlEnum('semester', ['1', '2']).notNull(),
  ratings: text('ratings'), // JSON string: { punctuality: 5, clarity: 4, materials: 5 }
  comments: text('comments'),
  isAnonymous: boolean('is_anonymous').default(true),
  submittedAt: timestamp('submitted_at').defaultNow(),
});

export const matriculationRegister = mysqlTable('matriculation_register', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  sessionId: int('session_id').references(() => academicSessions.id).notNull(),
  oathSignature: mediumtext('oath_signature').notNull(), // Base64 Signature
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  signedAt: timestamp('signed_at').defaultNow(),
});

export const semesterSummaries = mysqlTable('semester_summaries', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  sessionId: int('session_id').references(() => academicSessions.id).notNull(),
  semester: mysqlEnum('semester', ['1', '2']).notNull(),
  tcr: int('tcr').default(0), // Total Credits Registered
  tce: int('tce').default(0), // Total Credits Earned
  twgp: decimal('twgp', { precision: 7, scale: 2 }).default('0.00'), // Total Weighted Grade Points
  gpa: decimal('gpa', { precision: 4, scale: 2 }).default('0.00'),
  cgpa: decimal('cgpa', { precision: 4, scale: 2 }).default('0.00'),
  approvalStatus: mysqlEnum('approval_status', ['pending', 'hod_approved', 'dean_approved', 'published']).default('pending'),
  hodApprovedBy: int('hod_approved_by').references(() => users.id),
  hodApprovedAt: datetime('hod_approved_at'),
  deanApprovedBy: int('dean_approved_by').references(() => users.id),
  deanApprovedAt: datetime('dean_approved_at'),
  teacherComment: text('teacher_comment'),
  principalComment: text('principal_comment'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const resultComplaints = mysqlTable('result_complaints', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  courseId: int('course_id').references(() => courses.id).notNull(),
  sessionId: int('session_id').references(() => academicSessions.id).notNull(),
  semester: mysqlEnum('semester', ['1', '2']).notNull(),
  subject: varchar('subject', { length: 255 }).notNull(),
  message: text('message').notNull(),
  response: text('response'),
  status: mysqlEnum('status', ['pending', 'investigating', 'resolved', 'dismissed']).default('pending'),
  handledBy: int('handled_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const annualSummaries = mysqlTable('annual_summaries', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  sessionId: int('session_id').references(() => academicSessions.id).notNull(),
  totalScore: decimal('total_score', { precision: 10, scale: 2 }).default('0.00'),
  averageScore: decimal('average_score', { precision: 5, scale: 2 }).default('0.00'),
  rankLevel: varchar('rank_level', { length: 20 }),
  status: mysqlEnum('status', ['calculated', 'pending_approval', 'published', 'archived']).default('calculated'),
  principalApprovedBy: int('principal_approved_by').references(() => users.id),
  principalApprovedAt: datetime('principal_approved_at'),
  teacherComment: text('teacher_comment'),
  principalComment: text('principal_comment'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const resultEditLogs = mysqlTable('result_edit_logs', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  courseId: int('course_id').references(() => courses.id).notNull(),
  sessionId: int('session_id').references(() => academicSessions.id).notNull(),
  term: mysqlEnum('term', ['1', '2', '3', 'semester_1', 'semester_2']),
  oldScore: decimal('old_score', { precision: 5, scale: 2 }),
  newScore: decimal('new_score', { precision: 5, scale: 2 }).notNull(),
  reason: text('reason').notNull(),
  editedBy: int('edited_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// --- GRADING & ACADEMIC STANDING ---
export const gradingSystems = mysqlTable('grading_systems', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(), // e.g., "NUC 4.0 Scale", "Legacy 5.0 Scale"
  scale: int('scale').notNull(), // 4, 5, 7
  description: text('description'),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const transcriptRequests = mysqlTable('transcript_requests', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  destinationName: varchar('destination_name', { length: 255 }).notNull(), // Institution/Company name
  destinationAddress: text('destination_address').notNull(),
  deliveryMethod: mysqlEnum('delivery_method', ['email', 'courier', 'pickup']).default('email'),
  paymentStatus: mysqlEnum('payment_status', ['unpaid', 'paid']).default('unpaid'),
  approvalStatus: mysqlEnum('approval_status', ['pending', 'processing', 'dispatched', 'cancelled']).default('pending'),
  feePaid: decimal('fee_paid', { precision: 12, scale: 2 }).default('0.00'),
  transactionId: int('transaction_id').references(() => transactions.id),
  requestedAt: timestamp('requested_at').defaultNow(),
  dispatchedAt: datetime('dispatched_at'),
  dispatchedBy: int('dispatched_by').references(() => users.id),
});

export const officialResultDownloads = mysqlTable('official_result_downloads', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  sessionId: int('session_id').references(() => academicSessions.id).notNull(),
  semester: mysqlEnum('semester', ['1', '2']),
  downloadedBy: int('downloaded_by').references(() => users.id).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  downloadedAt: timestamp('downloaded_at').defaultNow(),
});

export const termWeightingRubrics = mysqlTable('term_weighting_rubrics', {
  id: int('id').autoincrement().primaryKey(),
  unitId: int('unit_id').references(() => institutionalUnits.id),
  name: varchar('name', { length: 255 }).notNull(), // e.g., "Standard K-12 Progressive Scale"
  term1Weight: decimal('term1_weight', { precision: 5, scale: 2 }).default('33.33'),
  term2Weight: decimal('term2_weight', { precision: 5, scale: 2 }).default('33.33'),
  term3Weight: decimal('term3_weight', { precision: 5, scale: 2 }).default('33.34'),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const gradingSystemSessions = mysqlTable('grading_system_sessions', {
  id: int('id').autoincrement().primaryKey(),
  gradingSystemId: int('grading_system_id').references(() => gradingSystems.id).notNull(),
  sessionId: int('session_id').references(() => academicSessions.id).notNull(), // Attach to specific academic session
});

export const gradePoints = mysqlTable('grade_points', {
  id: int('id').autoincrement().primaryKey(),
  gradingSystemId: int('grading_system_id').references(() => gradingSystems.id).notNull(),
  letterGrade: varchar('letter_grade', { length: 2 }).notNull(), // A, B, C, etc.
  minMark: int('min_mark').notNull(), // e.g., 70
  maxMark: int('max_mark').notNull(), // e.g., 100
  points: decimal('points', { precision: 4, scale: 2 }).notNull(), // e.g., 4.00, 3.50
  description: varchar('description', { length: 255 }), // e.g., "Excellent"
});export const resultMarks = mysqlTable('result_marks', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  courseId: int('course_id').references(() => courses.id).notNull(),
  sessionId: int('session_id').references(() => academicSessions.id).notNull(),
  semester: mysqlEnum('semester', ['1', '2']).notNull(),
  caScore: decimal('ca_score', { precision: 5, scale: 2 }).default('0.00'),
  examScore: decimal('exam_score', { precision: 5, scale: 2 }).default('0.00'),
  totalScore: decimal('total_score', { precision: 5, scale: 2 }).default('0.00'),
  grade: varchar('grade', { length: 2 }), // A, B, C...
  gradePoint: decimal('grade_point', { precision: 4, scale: 2 }), // 5.0, 4.0...
  isVerified: boolean('is_verified').default(false),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const degreeClassifications = mysqlTable('degree_classifications', {
  id: int('id').autoincrement().primaryKey(),
  gradingSystemId: int('grading_system_id').references(() => gradingSystems.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(), // e.g., "First Class Honours"
  minCgpa: decimal('min_cgpa', { precision: 4, scale: 2 }).notNull(),
  maxCgpa: decimal('max_cgpa', { precision: 4, scale: 2 }).notNull(),
});

export const documentTemplates = mysqlTable('document_templates', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(), // e.g., "Standard Tertiary Transcript"
  type: mysqlEnum('type', ['result_slip', 'transcript', 'admission_letter', 'certificate', 'id_card']).notNull(),
  level: mysqlEnum('level', ['primary', 'secondary', 'tertiary', 'postgraduate']).notNull(),
  templateHtml: mediumtext('template_html').notNull(), // HTML with placeholders like {{student_name}}
  templateCss: text('template_css'),
  headerImage: varchar('header_image', { length: 255 }),
  footerText: text('footer_text'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// --- K-12 TEACHER & STUDENT EVALUATION ---
export const staffClassAssignments = mysqlTable('staff_class_assignments', {
  id: int('id').autoincrement().primaryKey(),
  staffProfileId: int('staff_profile_id').references(() => staffProfiles.id).notNull(),
  groupId: int('group_id').references(() => studentGroups.id).notNull(),
  sessionId: int('session_id').references(() => academicSessions.id).notNull(),
  assignedAt: timestamp('assigned_at').defaultNow(),
});

export const staffSubjectAssignments = mysqlTable('staff_subject_assignments', {
  id: int('id').autoincrement().primaryKey(),
  staffProfileId: int('staff_profile_id').references(() => staffProfiles.id).notNull(),
  courseId: int('course_id').references(() => courses.id).notNull(),
  courseComponentId: int('course_component_id'),
  groupId: int('group_id').references(() => studentGroups.id).notNull(),
  sessionId: int('session_id').references(() => academicSessions.id).notNull(),
  assignedAt: timestamp('assigned_at').defaultNow(),
}, (table) => ({
  compFk: foreignKey({
    name: 'stf_sub_asg_comp_id_fk',
    columns: [table.courseComponentId],
    foreignColumns: [courseComponents.id],
  }),
}));

export const affectiveTraits = mysqlTable('affective_traits', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  category: mysqlEnum('category', ['affective', 'psychomotor']).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true),
});

export const behavioralScores = mysqlTable('behavioral_scores', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  traitId: int('trait_id').references(() => affectiveTraits.id).notNull(),
  sessionId: int('session_id').references(() => academicSessions.id).notNull(),
  term: mysqlEnum('term', ['1', '2', '3']).notNull(),
  score: int('score').notNull(), // 1-5 scale
  recordedBy: int('recorded_by').references(() => users.id).notNull(),
  recordedAt: timestamp('recorded_at').defaultNow(),
});

export const reportRemarks = mysqlTable('report_remarks', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  sessionId: int('session_id').references(() => academicSessions.id).notNull(),
  term: mysqlEnum('term', ['1', '2', '3']).notNull(),
  classTeacherComment: text('class_teacher_comment'),
  headTeacherComment: text('head_teacher_comment'),
  daysOpen: int('days_open'),
  daysPresent: int('days_present'),
  daysAbsent: int('days_absent'),
  nextTermStarts: date('next_term_starts'),
  nextTermEnds: date('next_term_ends'),
  recordedBy: int('recorded_by').references(() => users.id).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const schoolScheduleSettings = mysqlTable('school_schedule_settings', {
  id: int('id').autoincrement().primaryKey(),
  unitId: int('unit_id').references(() => institutionalUnits.id),
  sessionId: int('session_id').references(() => academicSessions.id).notNull(),
  term: mysqlEnum('term', ['1', '2', '3']).notNull(),
  daysOpen: int('days_open').default(0),
  termStart: date('term_start'),
  termEnd: date('term_end'),
  nextTermStart: date('next_term_start'),
  nextTermEnd: date('next_term_end'),
  enableProration: boolean('enable_proration').default(false),
  termWeightingRubricId: int('term_weighting_rubric_id'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  rubricFk: foreignKey({
    name: 'sch_sch_set_rub_id_fk',
    columns: [table.termWeightingRubricId],
    foreignColumns: [termWeightingRubrics.id],
  }),
}));

// --- REQUESTS / WORKFLOWS ---
export const genericRequests = mysqlTable('generic_requests', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id),
  type: mysqlEnum('type', ['programme_change', 'transcript', 'suspension', 'resumption']).notNull(),
  details: text('details'),
  status: mysqlEnum('status', ['pending', 'approved', 'rejected']).default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
});

// --- BURSARY / FINANCE MODULE ---
export const settlementAccounts = mysqlTable('settlement_accounts', {
  id: int('id').autoincrement().primaryKey(),
  accountName: varchar('account_name', { length: 255 }).notNull(),
  bankName: varchar('bank_name', { length: 255 }).notNull(),
  bankCode: varchar('bank_code', { length: 10 }).notNull(),
  accountNumber: varchar('account_number', { length: 15 }).notNull(),
  isActive: boolean('is_active').default(true),
});

export const gatewaySubaccounts = mysqlTable('gateway_subaccounts', {
  id: int('id').autoincrement().primaryKey(),
  settlementAccountId: int('settlement_account_id').references(() => settlementAccounts.id),
  gatewayName: mysqlEnum('gateway_name', ['paystack', 'flutterwave', 'remita']).notNull(),
  gatewaySubaccountCode: varchar('gateway_subaccount_code', { length: 100 }).notNull(),
});

export const feeItems = mysqlTable('fee_items', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  defaultAmount: decimal('default_amount', { precision: 12, scale: 2 }).default('0.00'),
  currency: varchar('currency', { length: 10 }).default('NGN'),
  category: mysqlEnum('category', ['tuition', 'hostel', 'library', 'lab', 'other']).default('other'),
  recurrence: mysqlEnum('recurrence', ['once', 'per_semester', 'per_session']).default('per_session'),
  isRequired: boolean('is_required').default(true),
  settlementAccountId: int('settlement_account_id').references(() => settlementAccounts.id),
});

export const feeAllocationRules = mysqlTable('fee_allocation_rules', {
  id: int('id').autoincrement().primaryKey(),
  feeItemId: int('fee_item_id').references(() => feeItems.id).notNull(),
  targetAccountId: int('target_account_id').references(() => chartOfAccounts.id).notNull(),
  percentage: decimal('percentage', { precision: 5, scale: 2 }), // Split by percentage
  fixedAmount: decimal('fixed_amount', { precision: 12, scale: 2 }), // Or split by fixed amount
  priority: int('priority').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const payrollReconciliationLogs = mysqlTable('payroll_reconciliation_logs', {
  id: int('id').autoincrement().primaryKey(),
  month: varchar('month', { length: 20 }).notNull(), // e.g. "2024-05"
  totalExpected: decimal('total_expected', { precision: 15, scale: 2 }).notNull(),
  totalActual: decimal('total_actual', { precision: 15, scale: 2 }).notNull(),
  discrepancyCount: int('discrepancy_count').default(0),
  status: mysqlEnum('status', ['matched', 'mismatch', 'pending']).default('pending'),
  discrepancyDetails: text('discrepancy_details'), // JSON blob
  reconciledBy: int('reconciled_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const feeStructures = mysqlTable('fee_structures', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  academicYear: varchar('academic_year', { length: 20 }).notNull(),
  level: int('level').notNull(), // Level this fee structure applies to
  programmeId: int('programme_id').references(() => programmes.id),
  status: mysqlEnum('status', ['draft', 'pending_approval', 'approved', 'archived']).default('draft'),
  approvedBy: int('approved_by').references(() => users.id),
  approvedAt: datetime('approved_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const feeStructureItems = mysqlTable('fee_structure_items', {
  id: int('id').autoincrement().primaryKey(),
  feeStructureId: int('fee_structure_id').references(() => feeStructures.id).notNull(),
  feeItemId: int('fee_item_id').references(() => feeItems.id).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  semester: mysqlEnum('semester', ['1', '2', 'both']).default('both'), // Specify if fee is per semester or annual
});

export const feeAllocations = mysqlTable('fee_allocations', {
  id: int('id').autoincrement().primaryKey(),
  feeStructureId: int('fee_structure_id').references(() => feeStructures.id).notNull(),
  facultyId: int('faculty_id').references(() => faculties.id),
  deptId: int('dept_id').references(() => departments.id),
  programmeId: int('programme_id').references(() => programmes.id),
  studentId: int('student_id').references(() => students.id), // Specific student allocation (optional)
  sessionId: int('session_id').references(() => academicSessions.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const discounts = mysqlTable('discounts', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  feeItemId: int('fee_item_id').references(() => feeItems.id), // Optional: Discount for specific fee item
  amount: decimal('amount', { precision: 12, scale: 2 }),
  percentage: decimal('percentage', { precision: 5, scale: 2 }),
  reason: text('reason'),
  status: mysqlEnum('status', ['pending', 'approved', 'rejected']).default('pending'),
  approvedBy: int('approved_by').references(() => users.id),
  approvedAt: datetime('approved_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const bursarySettings = mysqlTable('bursary_settings', {
  id: int('id').autoincrement().primaryKey(),
  key: varchar('key', { length: 100 }).unique().notNull(), // e.g., 'payment_mode', 'late_fee_amount'
  value: text('value').notNull(),
  description: text('description'),
});

export const studentLedger = mysqlTable('student_ledger', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  transactionId: int('transaction_id').references(() => transactions.id),
  description: varchar('description', { length: 255 }).notNull(),
  debit: decimal('debit', { precision: 12, scale: 2 }).default('0.00'), // Money owed/charged
  credit: decimal('credit', { precision: 12, scale: 2 }).default('0.00'), // Money paid/refunded
  balance: decimal('balance', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const expenditureRequests = mysqlTable('expenditure_requests', {
  id: int('id').autoincrement().primaryKey(),
  requestedBy: int('requested_by').references(() => users.id).notNull(),
  departmentId: int('department_id').references(() => departments.id),
  facultyId: int('faculty_id').references(() => faculties.id),
  title: varchar('title', { length: 255 }).notNull(),
  purpose: text('purpose').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  dueDate: datetime('due_date'),
  attachmentPath: varchar('attachment_path', { length: 255 }),
  vendorId: int('vendor_id').references(() => vendors.id),
  purchaseOrderNumber: varchar('po_number', { length: 50 }),
  status: mysqlEnum('status', ['pending', 'approved', 'disbursed', 'rejected', 'cancelled']).default('pending'),
  approvedBy: int('approved_by').references(() => users.id),
  approvedAt: datetime('approved_at'),
  disbursedAt: datetime('disbursed_at'),
  glAccountId: int('gl_account_id').references(() => chartOfAccounts.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const refundRequests = mysqlTable('refund_requests', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  transactionId: int('transaction_id').references(() => transactions.id),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  reason: text('reason').notNull(),
  bankName: varchar('bank_name', { length: 255 }).notNull(),
  accountNumber: varchar('account_number', { length: 20 }).notNull(),
  accountName: varchar('account_name', { length: 255 }).notNull(),
  status: mysqlEnum('status', ['pending', 'approved', 'rejected', 'disbursed']).default('pending'),
  bursarApprovedBy: int('bursar_approved_by').references(() => users.id),
  bursarApprovedAt: datetime('bursar_approved_at'),
  disbursedAt: datetime('disbursed_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const studentBills = mysqlTable('student_bills', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  sessionId: int('session_id').references(() => academicSessions.id).notNull(),
  billNumber: varchar('bill_number', { length: 50 }).unique().notNull(),
  currency: varchar('currency', { length: 10 }).default('NGN'),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  amountPaid: decimal('amount_paid', { precision: 12, scale: 2 }).default('0.00'),
  status: mysqlEnum('status', ['pending', 'partially_paid', 'paid']).default('pending'),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const studentBillItems = mysqlTable('student_bill_items', {
  id: int('id').autoincrement().primaryKey(),
  billId: int('bill_id').references(() => studentBills.id).notNull(),
  feeItemId: int('fee_item_id').references(() => feeItems.id).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
});

export const externalInflows = mysqlTable('external_inflows', {
  id: int('id').autoincrement().primaryKey(),
  source: varchar('source', { length: 255 }).notNull(), // e.g., "Government Grant", "Alumni Donation"
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  purpose: text('purpose'),
  recordedBy: int('recorded_by').references(() => users.id).notNull(),
  status: mysqlEnum('status', ['active', 'reversed']).default('active'),
  receivedAt: datetime('received_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const studentClearances = mysqlTable('student_clearances', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  academicYear: varchar('academic_year', { length: 20 }).notNull(),
  semester: mysqlEnum('semester', ['1', '2', 'both']).default('both'),
  status: mysqlEnum('status', ['pending', 'cleared', 'blocked']).default('pending'),
  clearedByType: mysqlEnum('cleared_by_type', ['auto', 'manual']).default('auto'),
  approvedBy: int('approved_by').references(() => users.id),
  clearanceCode: varchar('clearance_code', { length: 100 }).unique(), // For QR
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// --- SCHOLARSHIP & TRUST MODULE ---
export const sponsors = mysqlTable('sponsors', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: mysqlEnum('type', ['government', 'corporate', 'ngo', 'individual', 'internal']).default('corporate'),
  contactEmail: varchar('contact_email', { length: 255 }),
  balance: decimal('balance', { precision: 12, scale: 2 }).default('0.00'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const sponsorLedger = mysqlTable('sponsor_ledger', {
  id: int('id').autoincrement().primaryKey(),
  sponsorId: int('sponsor_id').references(() => sponsors.id).notNull(),
  type: mysqlEnum('type', ['deposit', 'deployment', 'refund']).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  description: text('description'),
  reference: varchar('reference', { length: 100 }), // e.g. "CHQ-102", "TRF-991"
  recordedBy: int('recorded_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// --- BANK RECONCILIATION ---
export const bankStatements = mysqlTable('bank_statements', {
  id: int('id').autoincrement().primaryKey(),
  filename: varchar('filename', { length: 255 }).notNull(),
  uploadedBy: int('uploaded_by').references(() => users.id).notNull(),
  bankName: varchar('bank_name', { length: 100 }),
  statementDate: datetime('statement_date'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const bankStatementEntries = mysqlTable('bank_statement_entries', {
  id: int('id').autoincrement().primaryKey(),
  statementId: int('statement_id').references(() => bankStatements.id).notNull(),
  transactionDate: datetime('transaction_date').notNull(),
  description: text('description').notNull(),
  reference: varchar('reference', { length: 100 }),
  debit: decimal('debit', { precision: 12, scale: 2 }).default('0.00'),
  credit: decimal('credit', { precision: 12, scale: 2 }).default('0.00'),
  status: mysqlEnum('status', ['unmatched', 'matched', 'ignored']).default('unmatched'),
  matchedLedgerId: int('matched_ledger_id').references(() => generalLedger.id),
  notes: text('notes'),
});

export const vendors = mysqlTable('vendors', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  contactPerson: varchar('contact_person', { length: 255 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  taxId: varchar('tax_id', { length: 50 }),
  bankName: varchar('bank_name', { length: 255 }),
  accountNumber: varchar('account_number', { length: 20 }),
  category: varchar('category', { length: 100 }), // e.g. Stationery, Construction, IT
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const financialPeriods = mysqlTable('financial_periods', {
  id: int('id').autoincrement().primaryKey(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  status: mysqlEnum('status', ['open', 'soft_closed', 'hard_closed']).default('open'),
  closedBy: int('closed_by').references(() => users.id),
  closedAt: timestamp('closed_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const chartOfAccounts = mysqlTable('chart_of_accounts', {
  id: int('id').autoincrement().primaryKey(),
  code: varchar('code', { length: 20 }).unique().notNull(), // e.g., "1000", "4000"
  name: varchar('name', { length: 255 }).notNull(),
  category: mysqlEnum('category', ['asset', 'liability', 'equity', 'revenue', 'expense']).notNull(),
  description: text('description'),
  parentAccountId: int('parent_account_id'), // For hierarchical accounts
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const monthlyAccountBalances = mysqlTable('monthly_account_balances', {
  id: int('id').autoincrement().primaryKey(),
  accountId: int('account_id').references(() => chartOfAccounts.id).notNull(),
  periodId: int('period_id').references(() => financialPeriods.id).notNull(),
  openingBalance: decimal('opening_balance', { precision: 12, scale: 2 }).default('0.00'),
  totalDebit: decimal('total_debit', { precision: 12, scale: 2 }).default('0.00'),
  totalCredit: decimal('total_credit', { precision: 12, scale: 2 }).default('0.00'),
  closingBalance: decimal('closing_balance', { precision: 12, scale: 2 }).default('0.00'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const budgets = mysqlTable('budgets', {
  id: int('id').autoincrement().primaryKey(),
  departmentId: int('department_id').references(() => departments.id).notNull(),
  academicYear: varchar('academic_year', { length: 20 }).notNull(), // e.g. 2024/2025
  category: mysqlEnum('category', ['operating', 'capital', 'personnel', 'research']).default('operating'),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum('status', ['draft', 'active', 'closed']).default('active'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const generalLedger = mysqlTable('general_ledger', {
  id: int('id').autoincrement().primaryKey(),
  transactionDate: timestamp('transaction_date').defaultNow().notNull(),
  accountId: int('account_id').references(() => chartOfAccounts.id).notNull(),
  description: text('description').notNull(),
  debit: decimal('debit', { precision: 12, scale: 2 }).default('0.00'),
  credit: decimal('credit', { precision: 12, scale: 2 }).default('0.00'),
  reference: varchar('reference', { length: 100 }), // e.g. "INV-001", "PAY-402"
  batchId: varchar('batch_id', { length: 100 }).notNull(), // To link DR and CR lines of the same transaction
  recordedBy: int('recorded_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const fixedAssets = mysqlTable('fixed_assets', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  purchaseDate: datetime('purchase_date').notNull(),
  purchasePrice: decimal('purchase_price', { precision: 12, scale: 2 }).notNull(),
  salvageValue: decimal('salvage_value', { precision: 12, scale: 2 }).default('0.00'),
  usefulLifeYears: int('useful_life_years').notNull(),
  depreciationMethod: mysqlEnum('depreciation_method', ['straight_line', 'double_declining']).default('straight_line'),
  glAccountId: int('gl_account_id').references(() => chartOfAccounts.id), // The Asset Account (e.g. Vehicles)
  depAccountId: int('dep_account_id').references(() => chartOfAccounts.id), // The Expense Account (Depreciation Expense)
  accumDepAccountId: int('accum_dep_account_id').references(() => chartOfAccounts.id), // Contra Asset Account (Accumulated Depreciation)
  status: mysqlEnum('status', ['active', 'disposed', 'fully_depreciated', 'under_maintenance']).default('active'),
  currentValuation: decimal('current_valuation', { precision: 12, scale: 2 }),
  lastRevaluedAt: datetime('last_revalued_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const assetMaintenanceLogs = mysqlTable('asset_maintenance_logs', {
  id: int('id').autoincrement().primaryKey(),
  assetId: int('asset_id').references(() => fixedAssets.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  maintenanceDate: timestamp('maintenance_date').defaultNow(),
  cost: decimal('cost', { precision: 12, scale: 2 }).default('0.00'),
  performedBy: varchar('performed_by', { length: 255 }), // Vendor or Staff name
  nextServiceDate: datetime('next_service_date'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const depreciationLogs = mysqlTable('depreciation_logs', {
  id: int('id').autoincrement().primaryKey(),
  assetId: int('asset_id').references(() => fixedAssets.id).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  period: varchar('period', { length: 20 }).notNull(), // e.g. "2026-02"
  recordedAt: timestamp('recorded_at').defaultNow(),
});

// --- SCHOLARSHIPS & SPONSORSHIPS ---

export const scholarships = mysqlTable('scholarships', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  provider: varchar('provider', { length: 255 }), // e.g. "Federal Govt", "Alumni Association"
  type: mysqlEnum('type', ['full', 'partial_fixed', 'partial_percentage']).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }), // for fixed
  percentage: decimal('percentage', { precision: 5, scale: 2 }), // for percentage
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const studentScholarships = mysqlTable('student_scholarships', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  scholarshipId: int('scholarship_id').references(() => scholarships.id).notNull(),
  sessionId: int('session_id').references(() => academicSessions.id).notNull(),
  status: mysqlEnum('status', ['active', 'expired', 'revoked']).default('active'),
  appliedAt: timestamp('applied_at').defaultNow(),
});

// --- GOVT LOANS (NELFUND) ---

export const nelfundDisbursements = mysqlTable('nelfund_disbursements', {
  id: int('id').autoincrement().primaryKey(),
  batchReference: varchar('batch_reference', { length: 100 }).unique().notNull(),
  totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull(),
  disbursementDate: datetime('disbursement_date').notNull(),
  status: mysqlEnum('status', ['pending', 'processed', 'failed']).default('pending'),
  recordedBy: int('recorded_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const nelfundBeneficiaries = mysqlTable('nelfund_beneficiaries', {
  id: int('id').autoincrement().primaryKey(),
  disbursementId: int('disbursement_id').notNull(),
  studentId: int('student_id').references(() => students.id).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  institutionFeeAmount: decimal('institution_fee_amount', { precision: 12, scale: 2 }),
  upkeepAmount: decimal('upkeep_amount', { precision: 12, scale: 2 }),
  verificationStatus: mysqlEnum('verification_status', ['pending', 'verified', 'rejected']).default('pending'),
  verifiedAt: datetime('verified_at'),
  rejectionReason: text('rejection_reason'),
}, (table) => ({
  disbFk: foreignKey({
    name: 'nelf_ben_disb_id_fk',
    columns: [table.disbursementId],
    foreignColumns: [nelfundDisbursements.id],
  }),
}));

// --- HR MODULE ---
export const staffProfiles = mysqlTable('staff_profiles', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').references(() => users.id).notNull(),
  staffId: varchar('staff_id', { length: 50 }).unique(),
  departmentId: int('department_id').references(() => departments.id),
  unitId: int('unit_id').references(() => institutionalUnits.id),
  jobTitle: varchar('job_title', { length: 255 }).notNull(),
  employmentDate: timestamp('employment_date').defaultNow(),
  gradeLevel: varchar('grade_level', { length: 20 }), // e.g., "L1", "L2"
  rank: varchar('rank', { length: 100 }),
  designation: varchar('designation', { length: 100 }),
  imageUrl: text('image_url'),
  department: varchar('department', { length: 255 }), // Legacy or helper field
  bankName: varchar('bank_name', { length: 100 }),
  accountNumber: varchar('account_number', { length: 20 }),
  barcode: varchar('barcode', { length: 255 }),
  expertise: text('expertise'), // Comma-separated list for AI reviewer matching
  signatureUrl: text('signature_url'), // Base64 or File URL
  isSignatureDigital: boolean('is_signature_digital').default(false),
  maritalStatus: varchar('marital_status', { length: 20 }),
  qualification: varchar('qualification', { length: 255 }),
  gender: mysqlEnum('gender', ['male', 'female', 'other']),
  staffCategory: mysqlEnum('staff_category', ['academic', 'non-academic', 'management', 'security', 'maintenance']).default('academic'),
  isActive: boolean('is_active').default(true),
  salaryStructureId: int('salary_structure_id').references(() => salaryStructures.id),
  deletedAt: datetime('deleted_at'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const leaveRequests = mysqlTable('leave_requests', {
  id: int('id').autoincrement().primaryKey(),
  staffId: int('staff_id').references(() => staffProfiles.id).notNull(),
  type: mysqlEnum('type', ['annual', 'sick', 'maternity', 'study', 'casual']).default('annual'),
  startDate: datetime('start_date').notNull(),
  endDate: datetime('end_date').notNull(),
  reason: text('reason'),
  status: mysqlEnum('status', ['pending', 'approved', 'rejected']).default('pending'),
  approvedBy: int('approved_by').references(() => users.id),
  approvedAt: datetime('approved_at'),
  comments: text('comments'), // Rejection reasons or approval notes
  attachmentUrl: varchar('attachment_url', { length: 255 }), // For medical certs etc
});

export const leaveBalances = mysqlTable('leave_balances', {
  id: int('id').autoincrement().primaryKey(),
  staffId: int('staff_id').references(() => staffProfiles.id).notNull(),
  year: int('year').notNull(),
  annual: int('annual').default(20),
  sick: int('sick').default(10),
  maternity: int('maternity').default(90),
  study: int('study').default(15),
  casual: int('casual').default(5),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const salaryStructures = mysqlTable('salary_structures', {
  id: int('id').autoincrement().primaryKey(),
  gradeLevel: varchar('grade_level', { length: 20 }).unique().notNull(),
  basePay: decimal('base_pay', { precision: 12, scale: 2 }).notNull(),
  allowances: decimal('allowances', { precision: 12, scale: 2 }).default('0.00'),
  deductions: decimal('deductions', { precision: 12, scale: 2 }).default('0.00'),
});

// --- RECRUITMENT MODULE ---
export const jobVacancies = mysqlTable('job_vacancies', {
  id: int('id').autoincrement().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  departmentId: int('department_id').references(() => departments.id),
  description: text('description').notNull(),
  requirements: text('requirements'),
  status: mysqlEnum('status', ['open', 'closed']).default('open'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const jobApplicants = mysqlTable('job_applicants', {
  id: int('id').autoincrement().primaryKey(),
  vacancyId: int('vacancy_id').references(() => jobVacancies.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  resumeUrl: varchar('resume_url', { length: 255 }),
  status: mysqlEnum('status', ['applied', 'screening', 'interview', 'hired', 'rejected']).default('applied'),
  aiScore: int('ai_score'), // 0-100 match percentage
  aiAnalysis: text('ai_analysis'), // JSON analysis summary
  appliedAt: timestamp('applied_at').defaultNow(),
});

// --- PERFORMANCE MODULE ---
export const performanceKpis = mysqlTable('performance_kpis', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  weight: int('weight').default(1), // Importance weight
  category: mysqlEnum('category', ['teaching', 'research', 'administration', 'general']).default('general'),
});

export const performanceReviews = mysqlTable('performance_reviews', {
  id: int('id').autoincrement().primaryKey(),
  staffId: int('staff_id').references(() => staffProfiles.id).notNull(),
  reviewerId: int('reviewer_id').references(() => users.id).notNull(),
  year: int('year').notNull(),
  period: mysqlEnum('period', ['annual', 'semi_annual']).default('annual'),
  ratings: text('ratings'), // Stored as JSON string for key-value ratings
  overallScore: decimal('overall_score', { precision: 5, scale: 2 }),
  comments: text('comments'),
  status: mysqlEnum('status', ['draft', 'submitted', 'finalized']).default('draft'),
  createdAt: timestamp('created_at').defaultNow(),
  finalizedAt: datetime('finalized_at'),
});

export const hrSettings = mysqlTable('hr_settings', {
  id: int('id').autoincrement().primaryKey(),
  settingKey: varchar('setting_key', { length: 255 }).unique().notNull(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const disciplinaryRecords = mysqlTable('disciplinary_records', {
  id: int('id').autoincrement().primaryKey(),
  staffId: int('staff_id').references(() => staffProfiles.id).notNull(),
  incidentDate: datetime('incident_date').notNull(),
  type: mysqlEnum('type', ['verbal_warning', 'written_warning', 'query', 'suspension', 'incident']).default('incident'),
  description: text('description').notNull(),
  actionTaken: text('action_taken'),
  status: mysqlEnum('status', ['open', 'resolved', 'appealed']).default('open'),
  recordedBy: int('recorded_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const staffTraining = mysqlTable('staff_training', {
  id: int('id').autoincrement().primaryKey(),
  staffId: int('staff_id').references(() => staffProfiles.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 255 }),
  completionDate: datetime('completion_date'),
  expiryDate: datetime('expiry_date'),
  certificateUrl: varchar('certificate_url', { length: 255 }),
  status: mysqlEnum('status', ['planned', 'in_progress', 'completed', 'verified', 'rejected', 'expired']).default('completed'),
  verifiedBy: int('verified_by').references(() => users.id),
  verifiedAt: datetime('verified_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const studentCertifications = mysqlTable('student_certifications', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 255 }),
  completionDate: datetime('completion_date'),
  expiryDate: datetime('expiry_date'),
  certificateUrl: varchar('certificate_url', { length: 255 }),
  status: mysqlEnum('status', ['pending', 'verified', 'rejected']).default('pending'),
  verifiedBy: int('verified_by').references(() => users.id),
  verifiedAt: datetime('verified_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const exitRecords = mysqlTable('exit_records', {
  id: int('id').autoincrement().primaryKey(),
  staffId: int('staff_id').references(() => staffProfiles.id).notNull(),
  exitType: mysqlEnum('exit_type', ['resignation', 'retirement', 'termination', 'contract_ended']).notNull(),
  lastWorkingDay: datetime('last_working_day').notNull(),
  reason: text('reason'),
  clearanceStatus: mysqlEnum('clearance_status', ['pending', 'in_progress', 'cleared']).default('pending'),
  interviewNotes: text('interview_notes'),
  status: mysqlEnum('status', ['initiated', 'processed', 'completed']).default('initiated'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const payrollLogs = mysqlTable('payroll_logs', {
  id: int('id').autoincrement().primaryKey(),
  staffId: int('staff_id').references(() => staffProfiles.id).notNull(),
  month: int('month').notNull(),
  year: int('year').notNull(),
  basePay: decimal('base_pay', { precision: 12, scale: 2 }).notNull(),
  allowances: decimal('allowances', { precision: 12, scale: 2 }).notNull(),
  deductions: decimal('deductions', { precision: 12, scale: 2 }).notNull(),
  netPay: decimal('net_pay', { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum('status', ['draft', 'pending_approval', 'approved', 'paid', 'failed']).default('draft'),
  ledgerBatchId: varchar('ledger_batch_id', { length: 50 }),
  paidAt: datetime('paid_at'),
});

export const attendance = mysqlTable('attendance', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').references(() => users.id).notNull(),
  type: mysqlEnum('type', ['in', 'out']).notNull(),
  category: mysqlEnum('category', ['student', 'staff', 'visitor']).default('student').notNull(),
  location: mysqlEnum('location', ['gate', 'kiosk', 'office']).default('gate').notNull(),
  isLate: boolean('is_late').default(false),
  context: varchar('context', { length: 50 }).default('General'), // e.g., ClassAttendance, ExamAttendance
  loggedBy: int('logged_by').references(() => users.id),
  timestamp: timestamp('timestamp').defaultNow(),
});

export const attendanceKioskTokens = mysqlTable('attendance_kiosk_tokens', {
  id: int('id').autoincrement().primaryKey(),
  token: varchar('token', { length: 255 }).unique().notNull(),
  expiresAt: datetime('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const privileges = mysqlTable('privileges', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 100 }).unique().notNull(), // e.g., 'Library Access', 'Prefect Status'
  description: text('description'),
  isActive: boolean('is_active').default(true),
});

export const studentPrivileges = mysqlTable('student_privileges', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  privilegeId: int('privilege_id').references(() => privileges.id).notNull(),
  grantedBy: int('granted_by').references(() => users.id),
  grantedAt: timestamp('granted_at').defaultNow(),
  expiresAt: datetime('expires_at'),
});

// --- ENHANCED CLASS ATTENDANCE ---
export const lectureSessions = mysqlTable('lecture_sessions', {
  id: int('id').autoincrement().primaryKey(),
  slotId: int('slot_id').references(() => timetableSlots.id).notNull(),
  date: date('date').notNull(),
  qrToken: varchar('qr_token', { length: 255 }).unique().notNull(),
  previousQrToken: varchar('previous_qr_token', { length: 255 }),
  qrRotatedAt: datetime('qr_rotated_at'),
  type: mysqlEnum('type', ['physical', 'online']).default('physical').notNull(),
  startTime: timestamp('start_time').defaultNow(),
  endTime: datetime('end_time'),
  status: mysqlEnum('status', ['scheduled', 'ongoing', 'completed', 'cancelled']).default('scheduled').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const lectureAttendance = mysqlTable('lecture_attendance', {
  id: int('id').autoincrement().primaryKey(),
  sessionId: int('session_id').references(() => lectureSessions.id).notNull(),
  studentId: int('student_id').references(() => students.id).notNull(),
  timeIn: timestamp('time_in').defaultNow(),
  timeOut: datetime('time_out'),
  method: mysqlEnum('method', ['qr', 'auto_online', 'manual_online', 'manual']).default('qr').notNull(),
  status: mysqlEnum('status', ['present', 'late', 'partial']).default('present').notNull(),
});

// --- ATTENDANCE EXCUSES ---
export const attendanceExcuses = mysqlTable('attendance_excuses', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  sessionId: int('session_id').references(() => lectureSessions.id), // nullable — can be general
  courseId: int('course_id').references(() => courses.id).notNull(),
  reason: text('reason').notNull(),
  excuseType: mysqlEnum('excuse_type', ['medical', 'official_duty', 'family_emergency', 'other']).default('other').notNull(),
  documentUrl: varchar('document_url', { length: 500 }),
  status: mysqlEnum('status', ['pending', 'approved', 'rejected']).default('pending').notNull(),
  reviewedBy: int('reviewed_by').references(() => users.id),
  reviewNotes: text('review_notes'),
  createdAt: timestamp('created_at').defaultNow(),
  reviewedAt: datetime('reviewed_at'),
});

// --- PROMOTION MODULE ---
export const promotionCriteria = mysqlTable('promotion_criteria', {
  id: int('id').autoincrement().primaryKey(),
  deptId: int('dept_id').references(() => departments.id).notNull(),
  sessionId: int('session_id').references(() => academicSessions.id),
  minCgpa: decimal('min_cgpa', { precision: 4, scale: 2 }).default('1.00'),
  minCreditsPerSession: int('min_credits_per_session').default(25),
  additionalRules: text('additional_rules'), // JSON: [{field, operator, value, message}]
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const promotionLogs = mysqlTable('promotion_logs', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  fromLevel: int('from_level').notNull(),
  toLevel: int('to_level').notNull(),
  fromSessionId: int('from_session_id').references(() => academicSessions.id).notNull(),
  toSessionId: int('to_session_id').references(() => academicSessions.id),
  decision: mysqlEnum('decision', ['promoted', 'withdrawn', 'graduated', 'repeat', 'rusticated', 'concession']).notNull(),
  cgpa: decimal('cgpa', { precision: 4, scale: 2 }),
  creditsEarned: int('credits_earned'),
  reason: text('reason'),
  promotedBy: int('promoted_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// --- PUSH NOTIFICATIONS ---
export const pushSubscriptions = mysqlTable('push_subscriptions', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').references(() => users.id).notNull(),
  endpoint: text('endpoint').notNull(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// --- ACTIVITY LOGS (AUDIT TRAIL) ---
export const activityLogs = mysqlTable('activity_logs', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(), // e.g., 'login', 'update_grade', 'delete_user'
  resource: varchar('resource', { length: 100 }), // e.g., 'user', 'course', 'result'
  resourceId: int('resource_id'),
  details: text('details'), // JSON with additional context
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow(),
});

// --- EXAM SECURITY ---
export const examSecuritySettings = mysqlTable('exam_security_settings', {
  id: int('id').autoincrement().primaryKey(),
  disableCopyPaste: boolean('disable_copy_paste').default(true),
  fullScreenRequired: boolean('full_screen_required').default(true),
  autoSubmitOnTabSwitch: boolean('auto_submit_on_tab_switch').default(false),
  randomizeQuestions: boolean('randomize_questions').default(true),
  randomizeOptions: boolean('randomize_options').default(true),
  maxAttempts: int('max_attempts').default(1),
  showResultsImmediately: boolean('show_results_immediately').default(false),
  ipWhitelist: text('ip_whitelist'), // Comma-separated IPs
  browserLockdown: boolean('browser_lockdown').default(false),
  webcamProctoring: boolean('webcam_proctoring').default(false),
  screenshotInterval: int('screenshot_interval'), // seconds, null = disabled
  maxIdleTime: int('max_idle_time').default(300), // seconds before auto-submit
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  updatedBy: int('updated_by').references(() => users.id),
});

// --- RBAC MODULE ---
export const roles = mysqlTable('roles', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 50 }).unique().notNull(),
  description: text('description'),
});

export const permissions = mysqlTable('permissions', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 100 }).unique().notNull(), // e.g., "courses.create", "finance.view"
  description: text('description'),
  category: varchar('category', { length: 50 }).notNull(), // e.g., "Academic", "Hostel", "System"
});

export const rolePermissions = mysqlTable('role_permissions', {
  roleId: int('role_id').references(() => roles.id).notNull(),
  permissionId: int('permission_id').references(() => permissions.id).notNull(),
}, (table) => ({
  pk: { columns: [table.roleId, table.permissionId] },
}));

export const userRoles = mysqlTable('user_roles', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').references(() => users.id).notNull(),
  roleId: int('role_id').references(() => roles.id).notNull(),
  unitId: int('unit_id').references(() => institutionalUnits.id), // Nullable for global roles
}, (table) => ({
  unq: unique().on(table.userId, table.roleId, table.unitId),
}));

// --- INSTITUTIONAL STRUCTURE (MULTI-TENANT) ---
export const organizations = mysqlTable('organizations', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  logoUrl: text('logo_url'),
  settings: text('settings'), // JSON for global org overrides
  createdAt: timestamp('created_at').defaultNow(),
});

export const institutionalUnits = mysqlTable('institutional_units', {
  id: int('id').autoincrement().primaryKey(),
  organizationId: int('organization_id').references(() => organizations.id),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).unique().notNull(),
  slug: varchar('slug', { length: 100 }).unique(), // For subdomain routing
  type: varchar('type', { length: 100 }).default('campus'),
  academicTier: mysqlEnum('academic_tier', ['k12', 'tertiary']).default('tertiary'),
  headTitle: varchar('head_title', { length: 100 }), // e.g., Provost, Director
  headUserId: int('head_user_id').references(() => users.id),
  settings: text('settings'), // JSON for terminology aliases, termCount, gradingLogic
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const movementLogs = mysqlTable('movement_logs', {
  id: int('id').autoincrement().primaryKey(),
  entityId: int('entity_id').notNull(), // userId for student/staff
  entityType: mysqlEnum('entity_type', ['student', 'staff']).notNull(),
  fromUnitId: int('from_unit_id').references(() => institutionalUnits.id),
  toUnitId: int('to_unit_id').references(() => institutionalUnits.id),
  movedBy: int('moved_by').references(() => users.id).notNull(), // SuperAdmin ID
  reason: text('reason'),
  createdAt: timestamp('created_at').defaultNow(),
});

// --- SECURITY MODULE ---
export const securityAudit = mysqlTable('security_audit', {
  id: int('id').autoincrement().primaryKey(),
  scanType: mysqlEnum('scan_type', ['library_book', 'visitor_pass', 'student_gate', 'staff_gate']).notNull(),
  entityId: int('entity_id'), // userId for student/staff, resourceId for library
  entityType: mysqlEnum('entity_type', ['user', 'library_resource', 'visitor']).notNull(),
  scanResult: mysqlEnum('scan_result', ['allowed', 'blocked', 'error']).notNull(),
  qrData: text('qr_data'), // Signed QR data
  scannedBy: int('scanned_by').references(() => users.id).notNull(), // Security officer ID
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  location: varchar('location', { length: 255 }), // GPS coordinates
  photoUrl: varchar('photo_url', { length: 500 }), // User photo for verification
  finesOwed: decimal('fines_owed', { precision: 12, scale: 2 }).default('0.00'),
  blockReason: varchar('block_reason', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// --- ADMISSION / JAMB MODULE ---
export const jambCandidates = mysqlTable('jamb_candidates', {
  id: int('id').autoincrement().primaryKey(),
  jambRegNo: varchar('jamb_reg_no', { length: 20 }).unique().notNull(),
  surname: varchar('surname', { length: 255 }).notNull(),
  middlename: varchar('middlename', { length: 255 }),
  firstname: varchar('firstname', { length: 255 }).notNull(),
  dob: varchar('dob', { length: 20 }).notNull(), // Format: YYYY-MM-DD
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  courseId: int('course_id').references(() => courses.id),
  facultyId: int('faculty_id').references(() => faculties.id),
  deptId: int('dept_id').references(() => departments.id),
  utmeSubjects: text('utme_subjects'), // JSON: ["English", "Math", "Phys", "Chem"]
  score: int('score'),
  imageUrl: varchar('image_url', { length: 255 }),
  isClaimed: boolean('is_claimed').default(false),
  claimedUserId: int('claimed_user_id').references(() => users.id),
  unitId: int('unit_id').references(() => institutionalUnits.id),
  apiReferenceId: varchar('api_reference_id', { length: 100 }), // Track external ID
  createdAt: timestamp('created_at').defaultNow(),
});

export const integrationSettings = mysqlTable('integration_settings', {
  id: int('id').autoincrement().primaryKey(),
  provider: varchar('provider', { length: 50 }).unique().notNull(), // e.g. "jamb", "remita"
  apiKey: text('api_key'),
  apiSecret: text('api_secret'),
  isEnabled: boolean('is_enabled').default(false),
  config: text('config'), // JSON for extra settings like "exam_year"
  lastSyncAt: datetime('last_sync_at'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const notifications = mysqlTable('notifications', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  type: mysqlEnum('type', ['info', 'success', 'warning', 'error']).default('info'),
  channel: mysqlEnum('channel', ['toast', 'email', 'both']).default('both'),
  isRead: boolean('is_read').default(false),
  isToasted: boolean('is_toasted').default(false), // Tracks if shown in UI
  link: varchar('link', { length: 255 }), // Optional link to related page
  createdAt: timestamp('created_at').defaultNow(),
});

export const directMessages = mysqlTable('direct_messages', {
  id: int('id').autoincrement().primaryKey(),
  senderId: int('sender_id').references(() => users.id).notNull(),
  recipientId: int('recipient_id').references(() => users.id).notNull(),
  subject: varchar('subject', { length: 255 }).notNull(),
  content: text('content').notNull(),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});


export const admissionApplications = mysqlTable('admission_applications', {
  id: int('id').autoincrement().primaryKey(),
  jambRegNo: varchar('jamb_reg_no', { length: 20 }).notNull(),
  programmeId: int('programme_id').references(() => programmes.id).notNull(),
  sessionId: int('session_id').references(() => admissionSessions.id),
  paymentStatus: mysqlEnum('payment_status', ['pending', 'paid', 'failed']).default('pending'),
  paymentReference: varchar('payment_reference', { length: 100 }),
  screeningScore: decimal('screening_score', { precision: 5, scale: 2 }), // Post-UTME Score
  aggregateScore: decimal('aggregate_score', { precision: 5, scale: 2 }), // Final Calculated Score
  status: mysqlEnum('status', ['applied', 'screened', 'admitted', 'rejected']).default('applied'),
  extraData: text('extra_data'), // JSON for dynamic fields
  appliedAt: timestamp('applied_at').defaultNow(),
}, (table) => ({
  jambFk: foreignKey({
    columns: [table.jambRegNo],
    foreignColumns: [jambCandidates.jambRegNo],
    name: 'adm_app_jamb_fk'
  })
}));

export const oLevelResults = mysqlTable('o_level_results', {
  id: int('id').autoincrement().primaryKey(),
  jambRegNo: varchar('jamb_reg_no', { length: 20 }).notNull(),
  examType: varchar('exam_type', { length: 20 }).notNull(), // WAEC, NECO, NABTEB
  examYear: int('exam_year').notNull(),
  examNumber: varchar('exam_number', { length: 20 }),
  subjects: text('subjects'), // JSON: {"Mathematics": "A1", "English": "B2"}
  scratchCardPin: varchar('scratch_card_pin', { length: 50 }), // For verification
  verified: boolean('verified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  jambFk: foreignKey({
    columns: [table.jambRegNo],
    foreignColumns: [jambCandidates.jambRegNo],
    name: 'o_level_jamb_fk'
  })
}));

export const programmeUtmeRequirements = mysqlTable('programme_utme_requirements', {
  id: int('id').autoincrement().primaryKey(),
  programmeId: int('programme_id').notNull().references(() => programmes.id, { onDelete: 'cascade' }),
  subjectName: varchar('subject_name', { length: 100 }).notNull(),
  isCompulsory: boolean('is_compulsory').default(true),
  isAlternative: boolean('is_alternative').default(false),
  alternativeSubjects: text('alternative_subjects'), // JSON array
  createdAt: timestamp('created_at').defaultNow(),
});

export const programmeOLevelRequirements = mysqlTable('programme_o_level_requirements', {
  id: int('id').autoincrement().primaryKey(),
  programmeId: int('programme_id').notNull().references(() => programmes.id, { onDelete: 'cascade' }),
  subjectName: varchar('subject_name', { length: 100 }).notNull(),
  isCompulsory: boolean('is_compulsory').default(true),
  minGrade: varchar('min_grade', { length: 2 }).default('C6'),
  acceptTwoSittings: boolean('accept_two_sittings').default(false),
  sixthSubjectRequired: boolean('sixth_subject_required').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const admissionValidations = mysqlTable('admission_validations', {
  id: int('id').autoincrement().primaryKey(),
  jambRegNo: varchar('jamb_reg_no', { length: 20 }).notNull(),
  programmeId: int('programme_id').notNull().references(() => programmes.id),
  utmeSubjectsValid: boolean('utme_subjects_valid').default(false),
  utmeValidationDetails: text('utme_validation_details'),
  oLevelValid: boolean('o_level_valid').default(false),
  oLevelValidationDetails: text('o_level_validation_details'),
  overallStatus: mysqlEnum('overall_status', ['VALID', 'INVALID', 'PENDING']).default('PENDING'),
  validatedAt: timestamp('validated_at').defaultNow(),
  validatedBy: int('validated_by').references(() => users.id),
}, (table) => ({
  jambFk: foreignKey({
    columns: [table.jambRegNo],
    foreignColumns: [jambCandidates.jambRegNo],
    name: 'adm_val_jamb_fk'
  })
}));

export const postUtmeScores = mysqlTable('post_utme_scores', {
  id: int('id').autoincrement().primaryKey(),
  jambRegNo: varchar('jamb_reg_no', { length: 20 }).notNull(),
  programmeId: int('programme_id').notNull().references(() => programmes.id),
  score: int('score').notNull(),
  examType: varchar('exam_type', { length: 50 }).notNull(),
  examDate: datetime('exam_date').notNull(),
  isApproved: boolean('is_approved').default(false),
  approvedBy: int('approved_by').references(() => users.id),
  approvedAt: datetime('approved_at'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  jambFk: foreignKey({
    columns: [table.jambRegNo],
    foreignColumns: [jambCandidates.jambRegNo],
    name: 'putme_jamb_fk'
  })
}));

export const applicantDocuments = mysqlTable('applicant_documents', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').notNull().references(() => users.id),
  documentType: mysqlEnum('document_type', ['passport_photo', 'signature']).notNull(),
  fileUrl: varchar('file_url', { length: 500 }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileSize: int('file_size').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  status: mysqlEnum('status', ['pending', 'approved', 'rejected']).default('pending'),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
  approvedBy: int('approved_by').references(() => users.id),
  approvedAt: datetime('approved_at'),
  rejectionReason: text('rejection_reason'),
});

// --- OBSERVABLE TRAITS (AFFECTIVE & PSYCHOMOTOR) ---

export const observableTraitGroups = mysqlTable('observable_trait_groups', {
  id: int('id').autoincrement().primaryKey(),
  unitId: int('unit_id').references(() => institutionalUnits.id), // e.g., Primary vs Secondary
  name: varchar('name', { length: 255 }).notNull(), // e.g., "Affective Domain", "Psychomotor Domain"
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const observableTraits = mysqlTable('observable_traits', {
  id: int('id').autoincrement().primaryKey(),
  groupId: int('group_id').references(() => observableTraitGroups.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(), // e.g., "Honesty", "Handwriting"
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const observableTraitAliases = mysqlTable('observable_trait_aliases', {
  id: int('id').autoincrement().primaryKey(),
  traitId: int('trait_id').references(() => observableTraits.id).notNull(),
  classId: int('class_id'), // Level/Class specific alias
  branchId: int('branch_id'), // Branch specific alias
  alias: varchar('alias', { length: 255 }).notNull(), // Overriding name
  createdAt: timestamp('created_at').defaultNow(),
});

export const observableTraitRatings = mysqlTable('observable_trait_ratings', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  traitId: int('trait_id').references(() => observableTraits.id).notNull(),
  sessionId: int('session_id').references(() => academicSessions.id).notNull(),
  term: int('term').notNull(),
  rating: int('rating').notNull(), // e.g., 1-5
  ratedBy: int('rated_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const roleTransitions = mysqlTable('role_transitions', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').notNull().references(() => users.id),
  fromRole: mysqlEnum('from_role', ['applicant', 'fresher', 'student']).notNull(),
  toRole: mysqlEnum('to_role', ['applicant', 'fresher', 'student']).notNull(),
  transitionType: mysqlEnum('transition_type', ['admission_utme', 'admission_de', 'manual']).notNull(),
  reason: text('reason'),
  academicSession: varchar('academic_session', { length: 20 }).notNull(),
  level: int('level').notNull(),
  matricNumber: varchar('matric_number', { length: 50 }),
  programmeId: int('programme_id').references(() => programmes.id),
  processedBy: int('processed_by').references(() => users.id),
  processedAt: timestamp('processed_at').defaultNow(),
});


export const gradingSystemsRelations = relations(gradingSystems, ({ many }) => ({
  points: many(gradePoints),
  classifications: many(degreeClassifications),
  sessions: many(gradingSystemSessions),
}));

export const gradePointsRelations = relations(gradePoints, ({ one }) => ({
  system: one(gradingSystems, {
    fields: [gradePoints.gradingSystemId],
    references: [gradingSystems.id],
  }),
}));

export const degreeClassificationsRelations = relations(degreeClassifications, ({ one }) => ({
  system: one(gradingSystems, {
    fields: [degreeClassifications.gradingSystemId],
    references: [gradingSystems.id],
  }),
}));


// --- RELATIONS ---

export const institutionalUnitsRelations = relations(institutionalUnits, ({ one, many }) => ({
  head: one(users, {
    fields: [institutionalUnits.headUserId],
    references: [users.id],
  }),
  faculties: many(faculties),
  departments: many(departments),
  students: many(students),
  staff: many(staffProfiles),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  permissions: many(rolePermissions),
  users: many(userRoles),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  roles: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  user: one(users, {
    fields: [attendance.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  roles: many(userRoles),
  approvedFeeStructures: many(feeStructures),
  approvedDiscounts: many(discounts),
  expenditureRequests: many(expenditureRequests, { relationName: "requested_by" }),
  approvedExpenditures: many(expenditureRequests, { relationName: "approved_by" }),
  attendanceLogs: many(attendance),
  studentClearances: many(studentClearances),
  recordedInflows: many(externalInflows),
  recordedSponsorEntries: many(sponsorLedger),
  uploadedStatements: many(bankStatements),
  scholarships: many(scholarships),
  cohorts: many(userCohorts),
  submittedTimetables: many(timetableSubmissions, { relationName: 'submitted_by' }),
  approvedTimetables: many(timetableSubmissions, { relationName: 'approved_by' }),
  timetableComments: many(timetableComments),
  sentDirectMessages: many(directMessages, { relationName: 'sentDirectMessages' }),
  receivedDirectMessages: many(directMessages, { relationName: 'receivedDirectMessages' }),
  parentProfile: one(parents, {
    fields: [users.id],
    references: [parents.userId],
  }),
  childMappings: many(parentStudentMappings),
  assignedLeads: many(crmLeads),
}));

export const facultiesRelations = relations(faculties, ({ one, many }) => ({
  unit: one(institutionalUnits, {
    fields: [faculties.unitId],
    references: [institutionalUnits.id],
  }),
  departments: many(departments),
  feeAllocations: many(feeAllocations),
  expenditureRequests: many(expenditureRequests),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  faculty: one(faculties, {
    fields: [departments.facultyId],
    references: [faculties.id],
  }),
  students: many(students),
  unit: one(institutionalUnits, {
    fields: [departments.unitId],
    references: [institutionalUnits.id],
  }),
  programmes: many(programmes),
  courseSettings: many(courseDepartmentSettings),
  feeAllocations: many(feeAllocations),
  expenditureRequests: many(expenditureRequests),
  staff: many(staffProfiles),
  timetableSubmissions: many(timetableSubmissions),
}));

export const programmesRelations = relations(programmes, ({ one, many }) => ({
  department: one(departments, {
    fields: [programmes.deptId],
    references: [departments.id],
  }),
  students: many(students),
  feeAllocations: many(feeAllocations),
}));

// --- LMS / E-LEARNING MODULE ---
export const courseModules = mysqlTable('course_modules', {
  id: int('id').autoincrement().primaryKey(),
  courseId: int('course_id').references(() => courses.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  order: int('order').notNull(),
  prerequisiteModuleId: int('prerequisite_module_id'), // Self-reference for locking
  isLocked: boolean('is_locked').default(false), // Manual lock override
  createdAt: timestamp('created_at').defaultNow(),
});

export const courseLessons = mysqlTable('course_lessons', {
  id: int('id').autoincrement().primaryKey(),
  moduleId: int('module_id').references(() => courseModules.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  order: int('order').notNull(),
  contentType: mysqlEnum('content_type', ['text', 'video', 'pdf', 'scorm', 'quiz', 'assignment', 'h5p']).notNull(),
  contentUrl: varchar('content_url', { length: 255 }), // URL for video/pdf/scorm
  contentBody: text('content_body'), // For rich text lessons
  prerequisiteLessonId: int('prerequisite_lesson_id'), // Self-reference
  durationMinutes: int('duration_minutes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const assignments = mysqlTable('assignments', {
  id: int('id').autoincrement().primaryKey(),
  courseId: int('course_id').references(() => courses.id).notNull(),
  moduleId: int('module_id').references(() => courseModules.id),
  lessonId: int('lesson_id').references(() => courseLessons.id), // Link to lesson flow
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  dueDate: datetime('due_date'),
  cutOffDate: datetime('cut_off_date'), // Strict deadline
  maxScore: int('max_score').default(100),
  attachmentUrl: varchar('attachment_url', { length: 255 }),
  submissionTypes: text('submission_types').default('["file"]'), // JSON: ["file", "text", "audio", "link", "cloud"]
  rubricId: int('rubric_id').references(() => gradingRubrics.id),
  includeInCa: boolean('include_in_ca').default(false),
  caAveragingMethod: mysqlEnum('ca_averaging_method', ['simple', 'weighted']).default('simple'),
  allowResubmission: boolean('allow_resubmission').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const assignmentSubmissions = mysqlTable('assignment_submissions', {
  id: int('id').autoincrement().primaryKey(),
  assignmentId: int('assignment_id').references(() => assignments.id).notNull(),
  studentId: int('student_id').references(() => students.id).notNull(),
  fileUrl: varchar('file_url', { length: 255 }), // Nullable if text submission
  onlineText: mediumtext('online_text'), // For text submissions
  submittedAt: timestamp('submitted_at').defaultNow(),
  status: mysqlEnum('status', ['draft', 'submitted', 'late']).default('submitted'),
  plagiarismScore: int('plagiarism_score'), // 0-100
  audioUrl: varchar('audio_url', { length: 500 }),
  externalLinks: text('external_links'), // JSON: [{title: string, url: string}]
  cloudFileUrl: varchar('cloud_file_url', { length: 500 }),
  cloudFileType: varchar('cloud_file_type', { length: 50 }), // 'google', 'onedrive'
  annotations: text('annotations'), // JSON for inline feedback / tldraw data
  score: int('score'),
  feedback: text('feedback'),
  gradedBy: int('graded_by').references(() => users.id),
  gradedAt: datetime('graded_at'),
});

export const gradingRubrics = mysqlTable('grading_rubrics', {
  id: int('id').autoincrement().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  courseId: int('course_id').references(() => courses.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const rubricCriteria = mysqlTable('rubric_criteria', {
  id: int('id').autoincrement().primaryKey(),
  rubricId: int('rubric_id').references(() => gradingRubrics.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  weight: int('weight').notNull(), // points or percentage
  levels: text('levels'), // JSON: [{label: "Excellent", points: 10, description: "..."}]
  order: int('order').notNull(),
});

export const submissionRubricGrades = mysqlTable('submission_rubric_grades', {
  id: int('id').autoincrement().primaryKey(),
  submissionId: int('submission_id').notNull(),
  criterionId: int('criterion_id').references(() => rubricCriteria.id).notNull(),
  points: int('points').notNull(),
  feedback: text('feedback'),
}, (table) => ({
  subFk: foreignKey({
    name: 'sub_rub_grd_sub_id_fk',
    columns: [table.submissionId],
    foreignColumns: [assignmentSubmissions.id],
  }),
}));

export const quizzes = mysqlTable('quizzes', {
  id: int('id').autoincrement().primaryKey(),
  courseId: int('course_id').references(() => courses.id).notNull(),
  moduleId: int('module_id').references(() => courseModules.id),
  lessonId: int('lesson_id').references(() => courseLessons.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  timeLimitMinutes: int('time_limit_minutes'),
  passingScore: int('passing_score').default(50),
  allowBacktrack: boolean('allow_backtrack').default(true),
  randomizeQuestions: boolean('randomize_questions').default(false),
  totalWeight: int('total_weight').default(100), // percentage of CA/Exam
  maxPoints: int('max_points'), // e.g., "Answer 50 questions but total score is out of 30"
  gradingStrategy: mysqlEnum('grading_strategy', ['absolute', 'weighted']).default('absolute'),
  proctoringEnabled: boolean('proctoring_enabled').default(false),
  isPooled: boolean('is_pooled').default(false),
  drawCount: int('draw_count'), // Number of questions to draw randomly
  availableFrom: datetime('available_from'),
  availableUntil: datetime('available_until'),
  quizType: mysqlEnum('quiz_type', ['standard', 'examination']).default('standard'),
  visibilityRule: mysqlEnum('visibility_rule', ['always', 'scheduled']).default('always'),
  gracePeriodMinutes: int('grace_period_minutes').default(0),
  slotId: int('slot_id').references(() => examSlots.id),
  includeInCa: boolean('include_in_ca').default(false),
  caAveragingMethod: mysqlEnum('ca_averaging_method', ['simple', 'weighted']).default('simple'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const examSlots = mysqlTable('exam_slots', {
  id: int('id').autoincrement().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  sessionId: int('session_id').references(() => academicSessions.id).notNull(),
  semester: mysqlEnum('semester', ['1', '2']).notNull(),
  startTime: datetime('start_time').notNull(),
  endTime: datetime('end_time').notNull(),
  type: mysqlEnum('type', ['quiz', 'exam']).default('exam'),
  maxCandidates: int('max_candidates'), // For room capacity checking if needed
  createdAt: timestamp('created_at').defaultNow(),
});

export const questionBanks = mysqlTable('question_banks', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  courseId: int('course_id').references(() => courses.id),
  description: text('description'),
  createdById: int('created_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const quizQuestions = mysqlTable('quiz_questions', {
  id: int('id').autoincrement().primaryKey(),
  quizId: int('quiz_id').references(() => quizzes.id), // Nullable if in bank
  bankId: int('bank_id').references(() => questionBanks.id), // Nullable if specific to quiz
  questionText: mediumtext('question_text').notNull(),
  type: mysqlEnum('type', [
    'multiple_choice',
    'true_false',
    'short_answer',
    'essay',
    'matching',
    'numerical',
    'ordering',
    'hotspot'
  ]).default('multiple_choice'),
  options: mediumtext('options'), // JSON string: ["Option A", "Option B"] or Matching pairs
  correctAnswer: text('correct_answer'), // For auto-grading types
  points: int('points').default(1),
  explanation: text('explanation'),
  rubric: text('rubric'), // JSON configuration for AI grading
  aiGradingEnabled: boolean('ai_grading_enabled').default(false),
});

export const quizAttempts = mysqlTable('quiz_attempts', {
  id: int('id').autoincrement().primaryKey(),
  quizId: int('quiz_id').references(() => quizzes.id).notNull(),
  studentId: int('student_id').references(() => students.id).notNull(),
  score: int('score').default(0),
  maxScore: int('max_score').default(0),
  passed: boolean('passed').default(false),
  status: mysqlEnum('status', ['in_progress', 'submitted', 'graded', 'timed_out']).default('submitted'),
  submissionType: mysqlEnum('submission_type', ['manual', 'auto_timer', 'auto_global']).default('manual'),
  startedAt: datetime('started_at').notNull(),
  completedAt: timestamp('completed_at').defaultNow(),
  weightedScore: decimal('weighted_score', { precision: 5, scale: 2 }), // Final score after ratio
  aiGradingStatus: mysqlEnum('ai_grading_status', ['none', 'pending', 'completed', 'failed']).default('none'),
  extraTimeMinutes: int('extra_time_minutes').default(0),
  manualFeedback: text('manual_feedback'),
  mode: mysqlEnum('mode', ['exam', 'practice']).default('exam'),
});

export const lessonNotes = mysqlTable('lesson_notes', {
  id: int('id').autoincrement().primaryKey(),
  teacherId: int('teacher_id').references(() => users.id).notNull(),
  courseId: int('course_id').references(() => courses.id).notNull(),
  sessionId: int('session_id').references(() => academicSessions.id).notNull(),
  termId: int('term_id').notNull(), // 1, 2, 3
  weekNumber: int('week_number').notNull(), // 1-13
  title: varchar('title', { length: 255 }).notNull(),
  objectives: text('objectives'),
  contentBody: mediumtext('content_body'),
  status: mysqlEnum('status', ['draft', 'pending', 'approved', 'rejected']).default('draft'),
  supervisorId: int('supervisor_id').references(() => users.id),
  supervisorFeedback: text('supervisor_feedback'),
  scheduledAt: datetime('scheduled_at'),
  isPublished: boolean('is_published').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const lessonNoteApprovers = mysqlTable('lesson_note_approvers', {
  id: int('id').autoincrement().primaryKey(),
  supervisorId: int('supervisor_id').references(() => users.id).notNull(),
  targetUserId: int('target_user_id').references(() => users.id), // If assigned to specific teacher
  targetDeptId: int('target_dept_id').references(() => departments.id), // If assigned to a whole dept
  targetFacultyId: int('target_faculty_id').references(() => faculties.id), // If assigned to a faculty
  unitId: int('unit_id').references(() => institutionalUnits.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const quizResponses = mysqlTable('quiz_responses', {
  id: int('id').autoincrement().primaryKey(),
  attemptId: int('attempt_id').references(() => quizAttempts.id).notNull(),
  questionId: int('question_id').references(() => quizQuestions.id).notNull(),
  studentAnswer: mediumtext('student_answer'),
  score: int('score'), // For individual auto/manual grading
  feedback: text('feedback'),
});

export const quizIncidents = mysqlTable('quiz_incidents', {
  id: int('id').autoincrement().primaryKey(),
  attemptId: int('attempt_id').references(() => quizAttempts.id).notNull(),
  type: mysqlEnum('type', ['tab_blur', 'window_resize', 'fullscreen_exit', 'hardware_change']).notNull(),
  timestamp: timestamp('timestamp').defaultNow(),
  metadata: text('metadata'), // Additional info like window size or device info
});

export const quizAttemptQuestions = mysqlTable('quiz_attempt_questions', {
  id: int('id').autoincrement().primaryKey(),
  attemptId: int('attempt_id').references(() => quizAttempts.id).notNull(),
  questionId: int('question_id').references(() => quizQuestions.id).notNull(),
  order: int('order').notNull(),
});

export const cohorts = mysqlTable('cohorts', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const userCohorts = mysqlTable('user_cohorts', {
  userId: int('user_id').references(() => users.id).notNull(),
  cohortId: int('cohort_id').references(() => cohorts.id).notNull(),
}, (table) => ({
  pk: { columns: [table.userId, table.cohortId] },
}));

export const cohortEnrollments = mysqlTable('cohort_enrollments', {
  id: int('id').autoincrement().primaryKey(),
  cohortId: int('cohort_id').references(() => cohorts.id).notNull(),
  courseId: int('course_id').references(() => courses.id).notNull(),
  enrolledAt: timestamp('enrolled_at').defaultNow(),
});

export const studentProgress = mysqlTable('student_progress', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  courseId: int('course_id').references(() => courses.id).notNull(),
  moduleId: int('module_id').references(() => courseModules.id),
  lessonId: int('lesson_id').references(() => courseLessons.id),
  isCompleted: boolean('is_completed').default(false),
  lastAccessed: timestamp('last_accessed').defaultNow(),
  quizScore: int('quiz_score'), // If applicable
});

export const systemSettings = mysqlTable('system_settings', {
  id: int('id').autoincrement().primaryKey(),
  settingKey: varchar('setting_key', { length: 255 }).unique().notNull(),
  settingValue: text('setting_value'),
  description: text('description'),
  isSensitive: boolean('is_sensitive').default(false),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const academicSessions = mysqlTable('academic_sessions', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(), // e.g., "2024/2025"
  startDate: date('start_date'),
  endDate: date('end_date'),
  isCurrent: boolean('is_current').default(false),
  currentSemester: mysqlEnum('current_semester', ['1', '2']).default('1'),
  isRegistrationOpen: boolean('is_registration_open').default(false),
  isAddDropOpen: boolean('is_add_drop_open').default(false),
  registrationType: mysqlEnum('registration_type', ['annual', 'semester']).default('semester'),
  status: mysqlEnum('status', ['planned', 'active', 'archived']).default('planned'),
  isActive: boolean('is_active').default(true),
  matriculationDeadline: datetime('matriculation_deadline'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const registrationLevelControls = mysqlTable('registration_level_controls', {
  id: int('id').autoincrement().primaryKey(),
  sessionId: int('session_id').references(() => academicSessions.id).notNull(),
  level: int('level').notNull(),
  isOpen: boolean('is_open').default(false),
});

export const registrationConcessions = mysqlTable('registration_concessions', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  sessionId: int('session_id').references(() => academicSessions.id).notNull(),
  reason: text('reason').notNull(),
  status: mysqlEnum('status', ['pending', 'approved', 'rejected']).default('pending'),
  approvedBy: int('approved_by').references(() => users.id),
  expiresAt: datetime('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const addDropRequests = mysqlTable('add_drop_requests', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  sessionId: int('session_id').references(() => academicSessions.id).notNull(),
  semester: int('semester').notNull(),
  courseId: int('course_id').references(() => courses.id).notNull(),
  type: mysqlEnum('type', ['add', 'remove']).notNull(),
  status: mysqlEnum('status', ['pending', 'approved', 'rejected']).default('pending'),
  reason: text('reason'),
  requestedAt: timestamp('requested_at').defaultNow(),
  processedBy: int('processed_by').references(() => users.id),
  processedAt: datetime('processed_at'),
});

export const courseLecturers = mysqlTable('course_lecturers', {
  id: int('id').autoincrement().primaryKey(),
  sessionId: int('session_id').references(() => academicSessions.id).notNull(),
  courseId: int('course_id').references(() => courses.id).notNull(),
  staffId: int('staff_id').references(() => staffProfiles.id).notNull(),
  deptId: int('dept_id').references(() => departments.id).notNull(),
  semester: mysqlEnum('semester', ['1', '2']).notNull(),
  role: mysqlEnum('role', ['main', 'co_lecturer']).default('main').notNull(),
  canGrade: boolean('can_grade').default(true),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
  unq: unique().on(t.sessionId, t.courseId, t.staffId, t.semester),
}));

export const venues = mysqlTable('venues', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  capacity: int('capacity'),
  facultyId: int('faculty_id').references(() => faculties.id),
});

export const timetableSlots = mysqlTable('timetable_slots', {
  id: int('id').autoincrement().primaryKey(),
  courseLecturerId: int('course_lecturer_id').references(() => courseLecturers.id).notNull(),
  day: mysqlEnum('day', ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).notNull(),
  startTime: varchar('start_time', { length: 5 }).notNull(), // HH:mm format
  endTime: varchar('end_time', { length: 5 }).notNull(), // HH:mm format
  venueId: int('venue_id').references(() => venues.id),
  type: mysqlEnum('type', ['lecture', 'practical']).default('lecture').notNull(),
  level: int('level').notNull(),
});

export const timetableSubmissions = mysqlTable('timetable_submissions', {
  id: int('id').autoincrement().primaryKey(),
  deptId: int('dept_id').references(() => departments.id).notNull(),
  sessionId: int('session_id').references(() => academicSessions.id).notNull(),
  semester: mysqlEnum('semester', ['1', '2']).notNull(),
  status: mysqlEnum('status', ['draft', 'pending_approval', 'approved']).default('draft').notNull(),
  submittedById: int('submitted_by_id').references(() => users.id),
  approvedById: int('approved_by_id').references(() => users.id),
  approvalNotes: text('approval_notes'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const timetableComments = mysqlTable('timetable_comments', {
  id: int('id').autoincrement().primaryKey(),
  submissionId: int('submission_id').references(() => timetableSubmissions.id).notNull(),
  userId: int('user_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const examTimetableSubmissions = mysqlTable('exam_timetable_submissions', {
  id: int('id').autoincrement().primaryKey(),
  deptId: int('dept_id').references(() => departments.id).notNull(),
  sessionId: int('session_id').references(() => academicSessions.id).notNull(),
  semester: mysqlEnum('semester', ['1', '2']).notNull(),
  status: mysqlEnum('status', ['draft', 'pending_approval', 'approved']).default('draft').notNull(),
  submittedById: int('submitted_by_id').references(() => users.id),
  approvedById: int('approved_by_id').references(() => users.id),
  approvalNotes: text('approval_notes'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const examTimetableSlots = mysqlTable('exam_timetable_slots', {
  id: int('id').autoincrement().primaryKey(),
  courseId: int('course_id').references(() => courses.id).notNull(),
  examDate: date('exam_date').notNull(),
  startTime: varchar('start_time', { length: 5 }).notNull(), // HH:mm
  endTime: varchar('end_time', { length: 5 }).notNull(), // HH:mm
  venueId: int('venue_id').references(() => venues.id).notNull(),
});

export const examInvigilators = mysqlTable('exam_invigilators', {
  id: int('id').autoincrement().primaryKey(),
  examSlotId: int('exam_slot_id').references(() => examTimetableSlots.id).notNull(),
  staffId: int('staff_id').references(() => staffProfiles.id).notNull(),
  role: mysqlEnum('role', ['chief', 'assistant']).default('assistant').notNull(),
});

export const registrationLevelControlsRelations = relations(registrationLevelControls, ({ one }) => ({
  session: one(academicSessions, {
    fields: [registrationLevelControls.sessionId],
    references: [academicSessions.id],
  }),
}));

export const registrationConcessionsRelations = relations(registrationConcessions, ({ one }) => ({
  student: one(students, {
    fields: [registrationConcessions.studentId],
    references: [students.id],
  }),
  session: one(academicSessions, {
    fields: [registrationConcessions.sessionId],
    references: [academicSessions.id],
  }),
  approver: one(users, {
    fields: [registrationConcessions.approvedBy],
    references: [users.id],
  }),
}));

export const academicCalendar = mysqlTable('academic_calendar', {
  id: int('id').autoincrement().primaryKey(),
  sessionId: int('session_id').references(() => academicSessions.id).notNull(),
  semester: mysqlEnum('semester', ['1', '2']).notNull(),
  weekNumber: int('week_number'),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  startDate: datetime('start_date'),
  endDate: datetime('end_date'),
  type: mysqlEnum('type', ['academic', 'holiday', 'exam', 'ceremony', 'other']).default('academic'),
  status: mysqlEnum('status', ['draft', 'published', 'cancelled']).default('draft'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const academicCalendarRelations = relations(academicCalendar, ({ one }) => ({
  session: one(academicSessions, {
    fields: [academicCalendar.sessionId],
    references: [academicSessions.id],
  }),
}));

export const academicSessionsRelations = relations(academicSessions, ({ many }) => ({
  calendarEvents: many(academicCalendar),
  addDropRequests: many(addDropRequests),
  timetableSubmissions: many(timetableSubmissions),
  semesterSummaries: many(semesterSummaries),
}));

export const enrollmentsRelations = relations(enrollments, ({ one, many }) => ({
  student: one(students, {
    fields: [enrollments.studentId],
    references: [students.id],
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
  result: one(results, {
    fields: [enrollments.id],
    references: [results.enrollmentId],
  }),
}));

export const resultsRelations = relations(results, ({ one }) => ({
  enrollment: one(enrollments, {
    fields: [results.enrollmentId],
    references: [enrollments.id],
  }),
}));

export const semesterSummariesRelations = relations(semesterSummaries, ({ one }) => ({
  student: one(students, {
    fields: [semesterSummaries.studentId],
    references: [students.id],
  }),
  session: one(academicSessions, {
    fields: [semesterSummaries.sessionId],
    references: [academicSessions.id],
  }),
}));

export const addDropRequestsRelations = relations(addDropRequests, ({ one }) => ({
  student: one(students, {
    fields: [addDropRequests.studentId],
    references: [students.id],
  }),
  session: one(academicSessions, {
    fields: [addDropRequests.sessionId],
    references: [academicSessions.id],
  }),
  course: one(courses, {
    fields: [addDropRequests.courseId],
    references: [courses.id],
  }),
  processor: one(users, {
    fields: [addDropRequests.processedBy],
    references: [users.id],
  }),
}));

export const courseLecturersRelations = relations(courseLecturers, ({ one, many }) => ({
  course: one(courses, {
    fields: [courseLecturers.courseId],
    references: [courses.id],
  }),
  staff: one(staffProfiles, {
    fields: [courseLecturers.staffId],
    references: [staffProfiles.id],
  }),
  session: one(academicSessions, {
    fields: [courseLecturers.sessionId],
    references: [academicSessions.id],
  }),
  department: one(departments, {
    fields: [courseLecturers.deptId],
    references: [departments.id],
  }),
  slots: many(timetableSlots),
}));

export const timetableSlotsRelations = relations(timetableSlots, ({ one }) => ({
  assignment: one(courseLecturers, {
    fields: [timetableSlots.courseLecturerId],
    references: [courseLecturers.id],
  }),
}));

export const lectureSessionsRelations = relations(lectureSessions, ({ one, many }) => ({
  slot: one(timetableSlots, {
    fields: [lectureSessions.slotId],
    references: [timetableSlots.id],
  }),
  attendanceLogs: many(lectureAttendance),
}));

export const lectureAttendanceRelations = relations(lectureAttendance, ({ one }) => ({
  session: one(lectureSessions, {
    fields: [lectureAttendance.sessionId],
    references: [lectureSessions.id],
  }),
  student: one(students, {
    fields: [lectureAttendance.studentId],
    references: [students.id],
  }),
}));

export const timetableSubmissionsRelations = relations(timetableSubmissions, ({ one, many }) => ({
  department: one(departments, {
    fields: [timetableSubmissions.deptId],
    references: [departments.id],
  }),
  session: one(academicSessions, {
    fields: [timetableSubmissions.sessionId],
    references: [academicSessions.id],
  }),
  submittedBy: one(users, {
    fields: [timetableSubmissions.submittedById],
    references: [users.id],
    relationName: 'submitted_by',
  }),
  approvedBy: one(users, {
    fields: [timetableSubmissions.approvedById],
    references: [users.id],
    relationName: 'approved_by',
  }),
  comments: many(timetableComments),
}));

export const timetableCommentsRelations = relations(timetableComments, ({ one }) => ({
  submission: one(timetableSubmissions, {
    fields: [timetableComments.submissionId],
    references: [timetableSubmissions.id],
  }),
  user: one(users, {
    fields: [timetableComments.userId],
    references: [users.id],
  }),
}));

export const courseModulesRelations = relations(courseModules, ({ one, many }) => ({
  course: one(courses, {
    fields: [courseModules.courseId],
    references: [courses.id],
  }),
  prerequisite: one(courseModules, {
    fields: [courseModules.prerequisiteModuleId],
    references: [courseModules.id],
    relationName: "module_prereq"
  }),
  lessons: many(courseLessons),
}));

export const courseLessonsRelations = relations(courseLessons, ({ one, many }) => ({
  module: one(courseModules, {
    fields: [courseLessons.moduleId],
    references: [courseModules.id],
  }),
  prerequisite: one(courseLessons, {
    fields: [courseLessons.prerequisiteLessonId],
    references: [courseLessons.id],
    relationName: "lesson_prereq"
  }),
}));

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  course: one(courses, {
    fields: [assignments.courseId],
    references: [courses.id],
  }),
  module: one(courseModules, {
    fields: [assignments.moduleId],
    references: [courseModules.id],
  }),
  rubric: one(gradingRubrics, {
    fields: [assignments.rubricId],
    references: [gradingRubrics.id],
  }),
  submissions: many(assignmentSubmissions),
}));

export const assignmentSubmissionsRelations = relations(assignmentSubmissions, ({ one, many }) => ({
  assignment: one(assignments, {
    fields: [assignmentSubmissions.assignmentId],
    references: [assignments.id],
  }),
  student: one(students, {
    fields: [assignmentSubmissions.studentId],
    references: [students.id],
  }),
  grader: one(users, {
    fields: [assignmentSubmissions.gradedBy],
    references: [users.id],
  }),
  rubricGrades: many(submissionRubricGrades),
}));

export const gradingRubricsRelations = relations(gradingRubrics, ({ many }) => ({
  criteria: many(rubricCriteria),
  assignments: many(assignments),
}));

export const rubricCriteriaRelations = relations(rubricCriteria, ({ one, many }) => ({
  rubric: one(gradingRubrics, {
    fields: [rubricCriteria.rubricId],
    references: [gradingRubrics.id],
  }),
  grades: many(submissionRubricGrades),
}));

export const submissionRubricGradesRelations = relations(submissionRubricGrades, ({ one }) => ({
  submission: one(assignmentSubmissions, {
    fields: [submissionRubricGrades.submissionId],
    references: [assignmentSubmissions.id],
  }),
  criterion: one(rubricCriteria, {
    fields: [submissionRubricGrades.criterionId],
    references: [rubricCriteria.id],
  }),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  course: one(courses, {
    fields: [quizzes.courseId],
    references: [courses.id],
  }),
  module: one(courseModules, {
    fields: [quizzes.moduleId],
    references: [courseModules.id],
  }),
  questions: many(quizQuestions),
  attempts: many(quizAttempts),
}));

export const directMessagesRelations = relations(directMessages, ({ one }) => ({
  sender: one(users, {
    fields: [directMessages.senderId],
    references: [users.id],
    relationName: 'sentDirectMessages',
  }),
  recipient: one(users, {
    fields: [directMessages.recipientId],
    references: [users.id],
    relationName: 'receivedDirectMessages',
  }),
}));




export const quizQuestionsRelations = relations(quizQuestions, ({ one, many }) => ({
  quiz: one(quizzes, {
    fields: [quizQuestions.quizId],
    references: [quizzes.id],
  }),
  bank: one(questionBanks, {
    fields: [quizQuestions.bankId],
    references: [questionBanks.id],
  }),
  responses: many(quizResponses),
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ one, many }) => ({
  quiz: one(quizzes, {
    fields: [quizAttempts.quizId],
    references: [quizzes.id],
  }),
  student: one(students, {
    fields: [quizAttempts.studentId],
    references: [students.id],
  }),
  responses: many(quizResponses),
}));

export const quizResponsesRelations = relations(quizResponses, ({ one }) => ({
  attempt: one(quizAttempts, {
    fields: [quizResponses.attemptId],
    references: [quizAttempts.id],
  }),
  question: one(quizQuestions, {
    fields: [quizResponses.questionId],
    references: [quizQuestions.id],
  }),
}));

export const studentProgressRelations = relations(studentProgress, ({ one }) => ({
  student: one(students, {
    fields: [studentProgress.studentId],
    references: [students.id],
  }),
  course: one(courses, {
    fields: [studentProgress.courseId],
    references: [courses.id],
  }),
  module: one(courseModules, {
    fields: [studentProgress.moduleId],
    references: [courseModules.id],
  }),
  lesson: one(courseLessons, {
    fields: [studentProgress.lessonId],
    references: [courseLessons.id],
  }),
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  departmentSettings: many(courseDepartmentSettings),
  prerequisites: many(coursePrerequisites, { relationName: "course_prerequisites_courseId" }),
  requiredBy: many(coursePrerequisites, { relationName: "course_prerequisites_prerequisiteId" }),
  enrollments: many(enrollments),
  cohortEnrollments: many(cohortEnrollments),
  modules: many(courseModules),
  assignments: many(assignments),
  quizzes: many(quizzes),
  certificates: many(courseCertificates),
  issuedCertificates: many(issuedCertificates),
}));

export const courseDepartmentSettingsRelations = relations(courseDepartmentSettings, ({ one }) => ({
  course: one(courses, {
    fields: [courseDepartmentSettings.courseId],
    references: [courses.id],
  }),
  department: one(departments, {
    fields: [courseDepartmentSettings.deptId],
    references: [departments.id],
  }),
}));

export const coursePrerequisitesRelations = relations(coursePrerequisites, ({ one }) => ({
  course: one(courses, {
    fields: [coursePrerequisites.courseId],
    references: [courses.id],
    relationName: "course_prerequisites_courseId",
  }),
  prerequisite: one(courses, {
    fields: [coursePrerequisites.prerequisiteId],
    references: [courses.id],
    relationName: "course_prerequisites_prerequisiteId",
  }),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  user: one(users, {
    fields: [students.userId],
    references: [users.id],
  }),
  programme: one(programmes, {
    fields: [students.programmeId],
    references: [programmes.id],
  }),
  department: one(departments, {
    fields: [students.deptId],
    references: [departments.id],
  }),
  unit: one(institutionalUnits, {
    fields: [students.unitId],
    references: [institutionalUnits.id],
  }),
  transactions: many(transactions),
  hostelApplications: many(hostelApplications),
  enrollments: many(enrollments),
  genericRequests: many(genericRequests),
  feeAllocations: many(feeAllocations),
  discounts: many(discounts),
  ledgerEntries: many(studentLedger),
  clearances: many(studentClearances),
  scholarships: many(scholarships),
  addDropRequests: many(addDropRequests),
  semesterSummaries: many(semesterSummaries),
  issuedBadges: many(issuedBadges),
  gamificationBadges: many(gamificationIssuedBadges),
  issuedCertificates: many(issuedCertificates),
  healthRecords: many(healthRecords),
  vitals: many(studentVitals),
  appointments: many(medicalAppointments),
  siwesPlacements: many(siwesPlacements),
  parentMappings: many(parentStudentMappings),
}));

export const siwesPlacementsRelations = relations(siwesPlacements, ({ one, many }) => ({
  student: one(students, {
    fields: [siwesPlacements.studentId],
    references: [students.id],
  }),
  company: one(siwesCompanies, {
    fields: [siwesPlacements.companyId],
    references: [siwesCompanies.id],
  }),
  logbooks: many(siwesLogbooks),
  assessment: one(siwesAssessments, {
    fields: [siwesPlacements.id],
    references: [siwesAssessments.placementId],
  }),
}));

export const siwesLogbooksRelations = relations(siwesLogbooks, ({ one }) => ({
  placement: one(siwesPlacements, {
    fields: [siwesLogbooks.placementId],
    references: [siwesPlacements.id],
  }),
}));

export const siwesAssessmentsRelations = relations(siwesAssessments, ({ one }) => ({
  placement: one(siwesPlacements, {
    fields: [siwesAssessments.placementId],
    references: [siwesPlacements.id],
  }),
}));

export const siwesCompaniesRelations = relations(siwesCompanies, ({ one, many }) => ({
  addedBy: one(users, {
    fields: [siwesCompanies.addedById],
    references: [users.id],
  }),
  placements: many(siwesPlacements),
}));

export const healthRecordsRelations = relations(healthRecords, ({ one }) => ({
  student: one(students, {
    fields: [healthRecords.studentId],
    references: [students.id],
  }),
  verifier: one(users, {
    fields: [healthRecords.verifiedBy],
    references: [users.id],
  }),
}));


export const medicalAppointmentsRelations = relations(medicalAppointments, ({ one }) => ({
  student: one(students, {
    fields: [medicalAppointments.studentId],
    references: [students.id],
  }),
}));

export const studentVitalsRelations = relations(studentVitals, ({ one }) => ({
  student: one(students, {
    fields: [studentVitals.studentId],
    references: [students.id],
  }),
  recorder: one(users, {
    fields: [studentVitals.recordedBy],
    references: [users.id],
  }),
}));

export const genericRequestsRelations = relations(genericRequests, ({ one }) => ({
  student: one(students, {
    fields: [genericRequests.studentId],
    references: [students.id],
  }),
}));

// --- BURSARY RELATIONS ---
export const settlementAccountsRelations = relations(settlementAccounts, ({ many }) => ({
  feeItems: many(feeItems),
  gatewaySubaccounts: many(gatewaySubaccounts),
}));

export const gatewaySubaccountsRelations = relations(gatewaySubaccounts, ({ one }) => ({
  settlementAccount: one(settlementAccounts, {
    fields: [gatewaySubaccounts.settlementAccountId],
    references: [settlementAccounts.id],
  }),
}));

export const feeItemsRelations = relations(feeItems, ({ one, many }) => ({
  structureItems: many(feeStructureItems),
  discounts: many(discounts),
  settlementAccount: one(settlementAccounts, {
    fields: [feeItems.settlementAccountId],
    references: [settlementAccounts.id],
  }),
}));

export const feeStructuresRelations = relations(feeStructures, ({ one, many }) => ({
  approvedBy: one(users, {
    fields: [feeStructures.approvedBy],
    references: [users.id],
  }),
  items: many(feeStructureItems),
  allocations: many(feeAllocations),
}));

export const feeStructureItemsRelations = relations(feeStructureItems, ({ one }) => ({
  structure: one(feeStructures, {
    fields: [feeStructureItems.feeStructureId],
    references: [feeStructures.id],
  }),
  item: one(feeItems, {
    fields: [feeStructureItems.feeItemId],
    references: [feeItems.id],
  }),
}));

export const feeAllocationsRelations = relations(feeAllocations, ({ one }) => ({
  structure: one(feeStructures, {
    fields: [feeAllocations.feeStructureId],
    references: [feeStructures.id],
  }),
  faculty: one(faculties, {
    fields: [feeAllocations.facultyId],
    references: [faculties.id],
  }),
  department: one(departments, {
    fields: [feeAllocations.deptId],
    references: [departments.id],
  }),
  programme: one(programmes, {
    fields: [feeAllocations.programmeId],
    references: [programmes.id],
  }),
  student: one(students, {
    fields: [feeAllocations.studentId],
    references: [students.id],
  }),
}));

export const studentBillsRelations = relations(studentBills, ({ one, many }) => ({
  student: one(students, {
    fields: [studentBills.studentId],
    references: [students.id],
  }),
  session: one(academicSessions, {
    fields: [studentBills.sessionId],
    references: [academicSessions.id],
  }),
  items: many(studentBillItems),
}));

export const studentBillItemsRelations = relations(studentBillItems, ({ one }) => ({
  bill: one(studentBills, {
    fields: [studentBillItems.billId],
    references: [studentBills.id],
  }),
  item: one(feeItems, {
    fields: [studentBillItems.feeItemId],
    references: [feeItems.id],
  }),
}));

export const discountsRelations = relations(discounts, ({ one }) => ({
  student: one(students, {
    fields: [discounts.studentId],
    references: [students.id],
  }),
  feeItem: one(feeItems, {
    fields: [discounts.feeItemId],
    references: [feeItems.id],
  }),
  approvedBy: one(users, {
    fields: [discounts.approvedBy],
    references: [users.id],
  }),
}));

export const studentLedgerRelations = relations(studentLedger, ({ one }) => ({
  student: one(students, {
    fields: [studentLedger.studentId],
    references: [students.id],
  }),
  transaction: one(transactions, {
    fields: [studentLedger.transactionId],
    references: [transactions.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  student: one(students, {
    fields: [transactions.studentId],
    references: [students.id],
  }),
  ledgerEntries: many(studentLedger),
}));

export const expenditureRequestsRelations = relations(expenditureRequests, ({ one }) => ({
  requestedBy: one(users, {
    fields: [expenditureRequests.requestedBy],
    references: [users.id],
    relationName: "requested_by",
  }),
  glAccount: one(chartOfAccounts, {
    fields: [expenditureRequests.glAccountId],
    references: [chartOfAccounts.id],
  }),
  approvedBy: one(users, {
    fields: [expenditureRequests.approvedBy],
    references: [users.id],
    relationName: "approved_by",
  }),
  vendor: one(vendors, {
    fields: [expenditureRequests.vendorId],
    references: [vendors.id],
  }),
  department: one(departments, {
    fields: [expenditureRequests.departmentId],
    references: [departments.id],
  }),
  faculty: one(faculties, {
    fields: [expenditureRequests.facultyId],
    references: [faculties.id],
  }),
}));

export const vendorsRelations = relations(vendors, ({ many }) => ({
  expenditureRequests: many(expenditureRequests),
}));

export const externalInflowsRelations = relations(externalInflows, ({ one }) => ({
  recordedBy: one(users, {
    fields: [externalInflows.recordedBy],
    references: [users.id],
  }),
}));

export const sponsorsRelations = relations(sponsors, ({ many }) => ({
  ledgerEntries: many(sponsorLedger),
}));

export const sponsorLedgerRelations = relations(sponsorLedger, ({ one }) => ({
  sponsor: one(sponsors, {
    fields: [sponsorLedger.sponsorId],
    references: [sponsors.id],
  }),
  recordedBy: one(users, {
    fields: [sponsorLedger.recordedBy],
    references: [users.id],
  }),
}));

export const bankStatementsRelations = relations(bankStatements, ({ one, many }) => ({
  uploadedBy: one(users, {
    fields: [bankStatements.uploadedBy],
    references: [users.id],
  }),
  entries: many(bankStatementEntries),
}));

export const bankStatementEntriesRelations = relations(bankStatementEntries, ({ one }) => ({
  statement: one(bankStatements, {
    fields: [bankStatementEntries.statementId],
    references: [bankStatements.id],
  }),
  matchedLedger: one(generalLedger, {
    fields: [bankStatementEntries.matchedLedgerId],
    references: [generalLedger.id],
  }),
}));

export const studentClearancesRelations = relations(studentClearances, ({ one }) => ({
  student: one(students, {
    fields: [studentClearances.studentId],
    references: [students.id],
  }),
  approver: one(users, {
    fields: [studentClearances.approvedBy],
    references: [users.id],
  }),
}));

export const chartOfAccountsRelations = relations(chartOfAccounts, ({ one, many }) => ({
  parentAccount: one(chartOfAccounts, {
    fields: [chartOfAccounts.parentAccountId],
    references: [chartOfAccounts.id],
    relationName: "parent_account",
  }),
  childAccounts: many(chartOfAccounts, { relationName: "parent_account" }),
  ledgerEntries: many(generalLedger),
}));

export const generalLedgerRelations = relations(generalLedger, ({ one }) => ({
  account: one(chartOfAccounts, {
    fields: [generalLedger.accountId],
    references: [chartOfAccounts.id],
  }),
  recordedBy: one(users, {
    fields: [generalLedger.recordedBy],
    references: [users.id],
  }),
}));

export const fixedAssetsRelations = relations(fixedAssets, ({ one, many }) => ({
  glAccount: one(chartOfAccounts, {
    fields: [fixedAssets.glAccountId],
    references: [chartOfAccounts.id],
    relationName: "asset_account",
  }),
  depAccount: one(chartOfAccounts, {
    fields: [fixedAssets.depAccountId],
    references: [chartOfAccounts.id],
    relationName: "dep_expense_account",
  }),
  accumDepAccount: one(chartOfAccounts, {
    fields: [fixedAssets.accumDepAccountId],
    references: [chartOfAccounts.id],
    relationName: "accum_dep_account",
  }),
  depreciationLogs: many(depreciationLogs),
}));

export const depreciationLogsRelations = relations(depreciationLogs, ({ one }) => ({
  asset: one(fixedAssets, {
    fields: [depreciationLogs.assetId],
    references: [fixedAssets.id],
  }),
}));

export const admissionSessionsRelations = relations(admissionSessions, ({ many }) => ({
  applications: many(admissionApplications),
}));

export const admissionApplicationsRelations = relations(admissionApplications, ({ one }) => ({
  candidate: one(jambCandidates, {
    fields: [admissionApplications.jambRegNo],
    references: [jambCandidates.jambRegNo],
  }),
  programme: one(programmes, {
    fields: [admissionApplications.programmeId],
    references: [programmes.id],
  }),
  session: one(admissionSessions, {
    fields: [admissionApplications.sessionId],
    references: [admissionSessions.id],
  }),
}));

export const jambCandidatesRelations = relations(jambCandidates, ({ one, many }) => ({
  unit: one(institutionalUnits, {
    fields: [jambCandidates.unitId],
    references: [institutionalUnits.id],
  }),
  course: one(courses, {
    fields: [jambCandidates.courseId],
    references: [courses.id],
  }),
  faculty: one(faculties, {
    fields: [jambCandidates.facultyId],
    references: [faculties.id],
  }),
  department: one(departments, {
    fields: [jambCandidates.deptId],
    references: [departments.id],
  }),
  claimedByUser: one(users, {
    fields: [jambCandidates.claimedUserId],
    references: [users.id],
  }),
  applications: many(admissionApplications),
  oLevelResults: many(oLevelResults),
}));

export const oLevelResultsRelations = relations(oLevelResults, ({ one }) => ({
  candidate: one(jambCandidates, {
    fields: [oLevelResults.jambRegNo],
    references: [jambCandidates.jambRegNo],
  }),
}));

// --- HR RELATIONS ---
export const staffProfilesRelations = relations(staffProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [staffProfiles.userId],
    references: [users.id],
  }),
  department: one(departments, {
    fields: [staffProfiles.departmentId],
    references: [departments.id],
  }),
  unit: one(institutionalUnits, {
    fields: [staffProfiles.unitId],
    references: [institutionalUnits.id],
  }),
  leaveRequests: many(leaveRequests),
  payrollLogs: many(payrollLogs),
}));

export const leaveRequestsRelations = relations(leaveRequests, ({ one }) => ({
  staff: one(staffProfiles, {
    fields: [leaveRequests.staffId],
    references: [staffProfiles.id],
  }),
  approver: one(users, {
    fields: [leaveRequests.approvedBy],
    references: [users.id],
  }),
}));

export const payrollLogsRelations = relations(payrollLogs, ({ one }) => ({
  staff: one(staffProfiles, {
    fields: [payrollLogs.staffId],
    references: [staffProfiles.id],
  }),
}));

export const jobVacanciesRelations = relations(jobVacancies, ({ one, many }) => ({
  department: one(departments, {
    fields: [jobVacancies.departmentId],
    references: [departments.id],
  }),
  applicants: many(jobApplicants),
}));

export const jobApplicantsRelations = relations(jobApplicants, ({ one }) => ({
  job: one(jobVacancies, {
    fields: [jobApplicants.vacancyId],
    references: [jobVacancies.id],
  }),
}));

export const cohortsRelations = relations(cohorts, ({ many }) => ({
  users: many(userCohorts),
  enrollments: many(cohortEnrollments),
}));

export const userCohortsRelations = relations(userCohorts, ({ one }) => ({
  user: one(users, {
    fields: [userCohorts.userId],
    references: [users.id],
  }),
  cohort: one(cohorts, {
    fields: [userCohorts.cohortId],
    references: [cohorts.id],
  }),
}));

export const cohortEnrollmentsRelations = relations(cohortEnrollments, ({ one }) => ({
  cohort: one(cohorts, {
    fields: [cohortEnrollments.cohortId],
    references: [cohorts.id],
  }),
  course: one(courses, {
    fields: [cohortEnrollments.courseId],
    references: [courses.id],
  }),
}));

export const questionBanksRelations = relations(questionBanks, ({ one, many }) => ({
  course: one(courses, {
    fields: [questionBanks.courseId],
    references: [courses.id],
  }),
  creator: one(users, {
    fields: [questionBanks.createdById],
    references: [users.id],
  }),
  questions: many(quizQuestions),
}));

export const quizAttemptQuestionsRelations = relations(quizAttemptQuestions, ({ one }) => ({
  attempt: one(quizAttempts, {
    fields: [quizAttemptQuestions.attemptId],
    references: [quizAttempts.id],
  }),
  question: one(quizQuestions, {
    fields: [quizAttemptQuestions.questionId],
    references: [quizQuestions.id],
  }),
}));

export const quizIncidentsRelations = relations(quizIncidents, ({ one }) => ({
  attempt: one(quizAttempts, {
    fields: [quizIncidents.attemptId],
    references: [quizAttempts.id],
  }),
}));

export const refundRequestsRelations = relations(refundRequests, ({ one }) => ({
  student: one(students, {
    fields: [refundRequests.studentId],
    references: [students.id],
  }),
  transaction: one(transactions, {
    fields: [refundRequests.transactionId],
    references: [transactions.id],
  }),
  approver: one(users, {
    fields: [refundRequests.bursarApprovedBy],
    references: [users.id],
  }),
}));

// --- COMMUNICATION & COLLABORATION MODULE ---
export const announcements = mysqlTable('announcements', {
  id: int('id').autoincrement().primaryKey(),
  senderId: int('sender_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  targetType: mysqlEnum('target_type', ['global', 'faculty', 'department', 'course']).default('global'),
  targetId: int('target_id'), // ID of the faculty, department, or course
  priority: mysqlEnum('priority', ['low', 'normal', 'high']).default('normal'),
  expiresAt: datetime('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const forums = mysqlTable('forums', {
  id: int('id').autoincrement().primaryKey(),
  courseId: int('course_id').references(() => courses.id), // Optional for course-specific forums
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  type: mysqlEnum('type', ['course', 'general', 'group']).default('general'),
  createdBy: int('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const forumTopics = mysqlTable('forum_topics', {
  id: int('id').autoincrement().primaryKey(),
  forumId: int('forum_id').references(() => forums.id).notNull(),
  authorId: int('author_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  isPinned: boolean('is_pinned').default(false),
  isLocked: boolean('is_locked').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const forumPosts = mysqlTable('forum_posts', {
  id: int('id').autoincrement().primaryKey(),
  topicId: int('topic_id').references(() => forumTopics.id).notNull(),
  authorId: int('author_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  parentPostId: int('parent_post_id'), // For nested/threaded replies
  createdAt: timestamp('created_at').defaultNow(),
});

export const conversations = mysqlTable('conversations', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }), // For group names
  isGroup: boolean('is_group').default(false),
  lastMessageAt: timestamp('last_message_at').defaultNow().onUpdateNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const conversationParticipants = mysqlTable('conversation_participants', {
  id: int('id').autoincrement().primaryKey(),
  conversationId: int('conversation_id').references(() => conversations.id).notNull(),
  userId: int('user_id').references(() => users.id).notNull(),
  joinedAt: timestamp('joined_at').defaultNow(),
  lastReadAt: datetime('last_read_at'),
});

export const messages = mysqlTable('messages', {
  id: int('id').autoincrement().primaryKey(),
  conversationId: int('conversation_id').references(() => conversations.id).notNull(),
  senderId: int('sender_id').references(() => users.id).notNull(),
  content: text('content').notNull(), // Stores AES-256-GCM encrypted content
  iv: varchar('iv', { length: 255 }), // Required for decryption
  authTag: varchar('auth_tag', { length: 255 }), // Required for GCM verification
  messageType: mysqlEnum('message_type', ['text', 'file', 'image', 'system']).default('text'),
  isEncrypted: boolean('is_encrypted').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const messageAttachments = mysqlTable('message_attachments', {
  id: int('id').autoincrement().primaryKey(),
  messageId: int('message_id').references(() => messages.id).notNull(),
  fileUrl: varchar('file_url', { length: 255 }).notNull(),
  fileName: varchar('file_name', { length: 255 }),
  fileSize: int('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// --- CREDENTIALS MODULE (CERTIFICATES & BADGES) ---
export const badgeTemplates = mysqlTable('badge_templates', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  imageUrl: varchar('image_url', { length: 255 }),
  criteria: text('criteria'),
  issuerName: varchar('issuer_name', { length: 255 }).default('Academic Portal'),
  issuerUrl: varchar('issuer_url', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const issuedBadges = mysqlTable('issued_badges', {
  id: int('id').autoincrement().primaryKey(),
  badgeId: int('badge_id').references(() => badgeTemplates.id).notNull(),
  studentId: int('student_id').references(() => students.id).notNull(),
  issuedAt: timestamp('issued_at').defaultNow(),
  assertionUrl: varchar('assertion_url', { length: 255 }),
  evidenceUrl: varchar('evidence_url', { length: 255 }),
});

export const courseCertificates = mysqlTable('course_certificates', {
  id: int('id').autoincrement().primaryKey(),
  courseId: int('course_id').references(() => courses.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  signatureName: varchar('signature_name', { length: 255 }),
  signatureTitle: varchar('signature_title', { length: 255 }),
  logoUrl: varchar('logo_url', { length: 255 }),
  minCompletionThreshold: int('min_completion_threshold').default(100),
  minGradeThreshold: decimal('min_grade_threshold', { precision: 5, scale: 2 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const issuedCertificates = mysqlTable('issued_certificates', {
  id: int('id').autoincrement().primaryKey(),
  certificateId: int('certificate_id').references(() => courseCertificates.id).notNull(),
  studentId: int('student_id').references(() => students.id).notNull(),
  courseId: int('course_id').references(() => courses.id).notNull(),
  certificateCode: varchar('certificate_code', { length: 100 }).unique().notNull(),
  issuedAt: timestamp('issued_at').defaultNow(),
  pdfUrl: varchar('pdf_url', { length: 255 }),
});

// --- CMS MODULE ---
export const cmsMedia = mysqlTable('cms_media', {
  id: int('id').autoincrement().primaryKey(),
  filename: varchar('filename', { length: 255 }).notNull(),
  url: varchar('url', { length: 500 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }),
  sizeBytes: int('size_bytes'),
  altText: varchar('alt_text', { length: 255 }),
  uploaderId: int('uploader_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const cmsPages = mysqlTable('cms_pages', {
  id: int('id').autoincrement().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  content: text('content'), // HTML or JSON
  metaTitle: varchar('meta_title', { length: 255 }),
  metaDescription: text('meta_description'),
  keywords: text('keywords'),
  ogImage: varchar('og_image', { length: 500 }),
  canonicalUrl: varchar('canonical_url', { length: 500 }),
  structuredData: text('structured_data'), // JSON string for custom schema
  status: mysqlEnum('status', ['draft', 'published', 'pending_review', 'rejected']).default('draft'),
  authorId: int('author_id').references(() => users.id),
  isSystemPage: boolean('is_system_page').default(false),
  locale: varchar('locale', { length: 10 }).default('en').notNull(),
  translationGroupId: int('translation_group_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  slugLocaleUnique: unique('slug_locale_unique').on(table.slug, table.locale),
}));

export const cmsPageRevisions = mysqlTable('cms_page_revisions', {
  id: int('id').autoincrement().primaryKey(),
  pageId: int('page_id').references(() => cmsPages.id).notNull(),
  contentSnapshot: text('content_snapshot'),
  statusSnapshot: varchar('status_snapshot', { length: 50 }),
  savedById: int('saved_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const cmsMenus = mysqlTable('cms_menus', {
  id: int('id').autoincrement().primaryKey(),
  label: varchar('label', { length: 255 }).notNull(),
  href: varchar('href', { length: 500 }), // URL or relative path
  icon: varchar('icon', { length: 50 }), // Lucide icon name
  description: varchar('description', { length: 500 }),
  target: varchar('target', { length: 10 }).default('_self'), // _blank or _self
  isMega: boolean('is_mega').default(false), // Mega Menu toggle
  parentId: int('parent_id'), // hierarchical structure
  order: int('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  locale: varchar('locale', { length: 10 }).default('en').notNull(),
  translationGroupId: int('translation_group_id'),
  slot: varchar('slot', { length: 50 }).default('primary').notNull(),
  menuStyle: varchar('menu_style', { length: 50 }).default('dropdown').notNull(),
});

export const cmsNews = mysqlTable('cms_news', {
  id: int('id').autoincrement().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  teaser: text('teaser'), // AI-generated short summary
  content: text('content').notNull(),
  featuredImageId: int('featured_image_id').references(() => cmsMedia.id),
  metaTitle: varchar('meta_title', { length: 255 }),
  metaDescription: text('meta_description'),
  keywords: text('keywords'),
  status: mysqlEnum('status', ['draft', 'published', 'pending_review', 'rejected']).default('draft'),
  authorId: int('author_id').references(() => users.id),
  locale: varchar('locale', { length: 10 }).default('en').notNull(),
  translationGroupId: int('translation_group_id'),
  publishedAt: datetime('published_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  slugLocaleUnique: unique('slug_locale_unique').on(table.slug, table.locale),
}));

export const cmsEvents = mysqlTable('cms_events', {
  id: int('id').autoincrement().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  description: text('description').notNull(),
  location: varchar('location', { length: 255 }),
  startDate: datetime('start_date').notNull(),
  endDate: datetime('end_date').notNull(),
  isVirtual: boolean('is_virtual').default(false),
  eventLink: varchar('event_link', { length: 500 }),
  featuredImageId: int('featured_image_id').references(() => cmsMedia.id),
  status: mysqlEnum('status', ['draft', 'published', 'pending_review', 'rejected']).default('draft'),
  authorId: int('author_id').references(() => users.id),
  locale: varchar('locale', { length: 10 }).default('en').notNull(),
  translationGroupId: int('translation_group_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  slugLocaleUnique: unique('slug_locale_unique').on(table.slug, table.locale),
}));

export const cmsHomePageSections = mysqlTable('cms_homepage_sections', {
  id: int('id').autoincrement().primaryKey(),
  type: mysqlEnum('section_type', ['slider', 'hero', 'gallery', 'content', 'features', 'cta', 'news']).notNull(),
  title: varchar('title', { length: 255 }),
  subtitle: varchar('subtitle', { length: 500 }),
  content: text('content'), // JSON for flexible section data
  settings: text('settings'), // JSON for configuration (e.g. autoplay: true)
  order: int('sort_order').default(0),
  isActive: boolean('is_active').default(true),
});

export const cmsSectionMedia = mysqlTable('cms_section_media', {
  id: int('id').autoincrement().primaryKey(),
  sectionId: int('section_id').references(() => cmsHomePageSections.id),
  url: varchar('url', { length: 500 }).notNull(),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }), // for video/audio previews
  caption: varchar('caption', { length: 255 }),
  mediaType: mysqlEnum('media_type', ['image', 'video', 'audio', 'document']).default('image'),
  mimeType: varchar('mime_type', { length: 100 }),
  fileSize: int('file_size'),
  metadata: text('metadata'), // JSON for extra data (duration, dimensions)
  order: int('sort_order').default(0),
});

export const cmsTerms = mysqlTable('cms_terms', {
  id: int('id').autoincrement().primaryKey(),
  vocabulary: varchar('vocabulary', { length: 50 }).notNull(), // e.g., 'news_categories', 'tags'
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  parentId: int('parent_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const cmsTermRelationships = mysqlTable('cms_term_relationships', {
  id: int('id').autoincrement().primaryKey(),
  termId: int('term_id').references(() => cmsTerms.id).notNull(),
  entityType: mysqlEnum('entity_type', ['news', 'event', 'page']).notNull(),
  entityId: int('entity_id').notNull(),
});

// Alias for backward compatibility if needed, or we just migrate
export const cmsGalleryImages = cmsSectionMedia;

// --- RELATIONS ---

export const announcementRelations = relations(announcements, ({ one }) => ({
  sender: one(users, { fields: [announcements.senderId], references: [users.id] }),
}));

export const forumRelations = relations(forums, ({ one, many }) => ({
  course: one(courses, { fields: [forums.courseId], references: [courses.id] }),
  createdBy: one(users, { fields: [forums.createdBy], references: [users.id] }),
  topics: many(forumTopics),
}));

export const forumTopicRelations = relations(forumTopics, ({ one, many }) => ({
  forum: one(forums, { fields: [forumTopics.forumId], references: [forums.id] }),
  author: one(users, { fields: [forumTopics.authorId], references: [users.id] }),
  posts: many(forumPosts),
}));

export const forumPostRelations = relations(forumPosts, ({ one }) => ({
  topic: one(forumTopics, { fields: [forumPosts.topicId], references: [forumTopics.id] }),
  author: one(users, { fields: [forumPosts.authorId], references: [users.id] }),
}));

export const conversationRelations = relations(conversations, ({ many }) => ({
  participants: many(conversationParticipants),
  messages: many(messages),
}));

export const conversationParticipantRelations = relations(conversationParticipants, ({ one }) => ({
  conversation: one(conversations, { fields: [conversationParticipants.conversationId], references: [conversations.id] }),
  user: one(users, { fields: [conversationParticipants.userId], references: [users.id] }),
}));

export const messageRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
  attachments: many(messageAttachments),
}));

export const badgeTemplatesRelations = relations(badgeTemplates, ({ many }) => ({
  issuedBadges: many(issuedBadges),
}));

export const issuedBadgesRelations = relations(issuedBadges, ({ one }) => ({
  badge: one(badgeTemplates, {
    fields: [issuedBadges.badgeId],
    references: [badgeTemplates.id],
  }),
  student: one(students, {
    fields: [issuedBadges.studentId],
    references: [students.id],
  }),
}));

export const courseCertificatesRelations = relations(courseCertificates, ({ one, many }) => ({
  course: one(courses, {
    fields: [courseCertificates.courseId],
    references: [courses.id],
  }),
  issuedCertificates: many(issuedCertificates),
}));

export const issuedCertificatesRelations = relations(issuedCertificates, ({ one }) => ({
  template: one(courseCertificates, {
    fields: [issuedCertificates.certificateId],
    references: [courseCertificates.id],
  }),
  student: one(students, {
    fields: [issuedCertificates.studentId],
    references: [students.id],
  }),
  course: one(courses, {
    fields: [issuedCertificates.courseId],
    references: [courses.id],
  }),
}));

export const idCards = mysqlTable('id_cards', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').references(() => users.id).notNull(),
  userType: mysqlEnum('user_type', ['student', 'staff']).notNull(),
  cardType: mysqlEnum('card_type', ['digital', 'physical_print']).default('digital'),
  issueId: varchar('issue_id', { length: 50 }).unique().notNull(), // Unique serial number
  issuedAt: timestamp('issued_at').defaultNow(),
  expiresAt: datetime('expires_at'),
  status: mysqlEnum('status', ['active', 'expired', 'revoked']).default('active'),
  verificationCode: varchar('verification_code', { length: 255 }).unique().notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const idCardsRelations = relations(idCards, ({ one }) => ({
  user: one(users, {
    fields: [idCards.userId],
    references: [users.id],
  }),
}));

// --- CMS RELATIONS ---
export const cmsPagesRelations = relations(cmsPages, ({ one, many }) => ({
  author: one(users, {
    fields: [cmsPages.authorId],
    references: [users.id],
  }),
  revisions: many(cmsPageRevisions),
}));

export const cmsPageRevisionsRelations = relations(cmsPageRevisions, ({ one }) => ({
  page: one(cmsPages, {
    fields: [cmsPageRevisions.pageId],
    references: [cmsPages.id],
  }),
  savedBy: one(users, {
    fields: [cmsPageRevisions.savedById],
    references: [users.id],
  }),
}));

export const cmsMenusRelations = relations(cmsMenus, ({ one, many }) => ({
  parent: one(cmsMenus, {
    fields: [cmsMenus.parentId],
    references: [cmsMenus.id],
    relationName: "menu_hierarchy",
  }),
  children: many(cmsMenus, { relationName: "menu_hierarchy" }),
}));

export const cmsHomePageSectionsRelations = relations(cmsHomePageSections, ({ many }) => ({
  media: many(cmsSectionMedia),
}));

export const cmsSectionMediaRelations = relations(cmsSectionMedia, ({ one }) => ({
  section: one(cmsHomePageSections, {
    fields: [cmsSectionMedia.sectionId],
    references: [cmsHomePageSections.id],
  }),
}));

export const cmsTermsRelations = relations(cmsTerms, ({ one, many }) => ({
  parent: one(cmsTerms, {
    fields: [cmsTerms.parentId],
    references: [cmsTerms.id],
  }),
  children: many(cmsTerms, { relationName: "term_hierarchy" }),
  relationships: many(cmsTermRelationships),
}));

export const cmsTermRelationshipsRelations = relations(cmsTermRelationships, ({ one }) => ({
  term: one(cmsTerms, {
    fields: [cmsTermRelationships.termId],
    references: [cmsTerms.id],
  }),
}));

// --- Hostel Allocation Module ---

export const hostels = mysqlTable('hostels', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).unique().notNull(),
  type: mysqlEnum('type', ['male', 'female', 'mixed']).default('mixed'),
  capacity: int('capacity').default(0),
  isActive: boolean('is_active').default(true),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const hostelBlocks = mysqlTable('hostel_blocks', {
  id: int('id').autoincrement().primaryKey(),
  hostelId: int('hostel_id').references(() => hostels.id),
  name: varchar('name', { length: 100 }).notNull(), // e.g., "Block A"
  floorCount: int('floor_count').default(1),
});

export const hostelRooms = mysqlTable('hostel_rooms', {
  id: int('id').autoincrement().primaryKey(),
  blockId: int('block_id').references(() => hostelBlocks.id),
  roomNumber: varchar('room_number', { length: 50 }).notNull(),
  capacity: int('capacity').default(4),
  occupiedCount: int('occupied_count').default(0),
  gender: mysqlEnum('gender', ['male', 'female']).notNull(),
  price: decimal('price', { precision: 12, scale: 2 }).default('0.00'),
  isAvailable: boolean('is_available').default(true),
});

export const hostelApplications = mysqlTable('hostel_applications', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id),
  sessionId: int('session_id').references(() => academicSessions.id),
  hostelId: int('hostel_id').references(() => hostels.id),
  status: mysqlEnum('status', ['pending', 'approved', 'rejected', 'allocated', 'expired']).default('pending'),
  isPriority: boolean('is_priority').default(false), // fresher or final year
  paymentDeadline: datetime('payment_deadline'),
  paymentStatus: mysqlEnum('payment_status', ['unpaid', 'paid']).default('unpaid'),
  allocatedRoomId: int('allocated_room_id').references(() => hostelRooms.id),
  appliedAt: timestamp('applied_at').defaultNow(),
  checkedInAt: datetime('checked_in_at'),
  checkedOutAt: datetime('checked_out_at'),
  checkInNotes: text('check_in_notes'),
  checkOutNotes: text('check_out_notes'),
});

export const hostelSettings = mysqlTable('hostel_settings', {
  id: int('id').autoincrement().primaryKey(),
  hostelId: int('hostel_id').references(() => hostels.id).unique().notNull(),
  requiresClearance: boolean('requires_clearance').default(true),
  allowCustomSelection: boolean('allow_custom_selection').default(false),
  paymentWindowDays: int('payment_window_days').default(3),
  minLevelPriority: int('min_level_priority').default(100),
  maxLevelPriority: int('max_level_priority').default(500),
  paymentMode: mysqlEnum('payment_mode', ['standalone', 'bundled']).default('standalone'),
  hostelFee: decimal('hostel_fee', { precision: 10, scale: 2 }).default('0.00'),
});


export const hostelMaintenanceRequests = mysqlTable('hostel_maintenance_requests', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  classroomId: int('classroom_id'), // Optional: link to a classroom if needed, but perhaps better to link to room
  roomId: int('room_id').references(() => hostelRooms.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  category: mysqlEnum('category', ['plumbing', 'electrical', 'carpentry', 'masonry', 'other']).notNull(),
  priority: mysqlEnum('priority', ['low', 'medium', 'high', 'urgent']).default('medium'),
  status: mysqlEnum('status', ['pending', 'in-progress', 'resolved', 'cancelled']).default('pending'),
  imageUrl: varchar('image_url', { length: 500 }),
  assignedStaffId: int('assigned_staff_id').references(() => users.id),
  resolutionNotes: text('resolution_notes'),
  resolvedAt: datetime('resolved_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  classFk: foreignKey({
    name: 'hst_maint_req_cls_id_fk',
    columns: [table.classroomId],
    foreignColumns: [virtualClassrooms.id],
  }),
}));

export const hostelInventoryItems = mysqlTable('hostel_inventory_items', {
  id: int('id').autoincrement().primaryKey(),
  hostelId: int('hostel_id').references(() => hostels.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(), // e.g. "Single Bed", "Ceiling Fan"
  description: text('description'),
  totalQuantity: int('total_quantity').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const roomInventory = mysqlTable('room_inventory', {
  id: int('id').autoincrement().primaryKey(),
  roomId: int('room_id').references(() => hostelRooms.id).notNull(),
  inventoryItemId: int('inventory_item_id').references(() => hostelInventoryItems.id).notNull(),
  quantity: int('quantity').default(1),
  condition: mysqlEnum('condition', ['excellent', 'good', 'fair', 'poor', 'broken']).default('good'),
  lastInspectedAt: datetime('last_inspected_at'),
  notes: text('notes'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const hostelsRelations = relations(hostels, ({ many, one }) => ({
  blocks: many(hostelBlocks),
  applications: many(hostelApplications),
  settings: one(hostelSettings, {
    fields: [hostels.id],
    references: [hostelSettings.hostelId],
  }),
}));

export const hostelBlocksRelations = relations(hostelBlocks, ({ one, many }) => ({
  hostel: one(hostels, {
    fields: [hostelBlocks.hostelId],
    references: [hostels.id],
  }),
  rooms: many(hostelRooms),
}));

export const hostelRoomsRelations = relations(hostelRooms, ({ one, many }) => ({
  block: one(hostelBlocks, {
    fields: [hostelRooms.blockId],
    references: [hostelBlocks.id],
  }),
  allocations: many(hostelApplications),
}));

export const hostelApplicationsRelations = relations(hostelApplications, ({ one }) => ({
  student: one(students, {
    fields: [hostelApplications.studentId],
    references: [students.id],
  }),
  hostel: one(hostels, {
    fields: [hostelApplications.hostelId],
    references: [hostels.id],
  }),
  room: one(hostelRooms, {
    fields: [hostelApplications.allocatedRoomId],
    references: [hostelRooms.id],
  }),
  session: one(academicSessions, {
    fields: [hostelApplications.sessionId],
    references: [academicSessions.id],
  }),
}));

export const hostelMaintenanceRequestsRelations = relations(hostelMaintenanceRequests, ({ one }) => ({
  student: one(students, {
    fields: [hostelMaintenanceRequests.studentId],
    references: [students.id],
  }),
  room: one(hostelRooms, {
    fields: [hostelMaintenanceRequests.roomId],
    references: [hostelRooms.id],
  }),
  assignedStaff: one(users, {
    fields: [hostelMaintenanceRequests.assignedStaffId],
    references: [users.id],
  }),
}));

export const hostelInventoryItemsRelations = relations(hostelInventoryItems, ({ one, many }) => ({
  hostel: one(hostels, {
    fields: [hostelInventoryItems.hostelId],
    references: [hostels.id],
  }),
  roomAllocations: many(roomInventory),
}));

export const roomInventoryRelations = relations(roomInventory, ({ one }) => ({
  room: one(hostelRooms, {
    fields: [roomInventory.roomId],
    references: [hostelRooms.id],
  }),
  item: one(hostelInventoryItems, {
    fields: [roomInventory.inventoryItemId],
    references: [hostelInventoryItems.id],
  }),
}));
// --- VIRTUAL CLASSROOMS (LIVEKIT) ---

export const virtualClassrooms = mysqlTable('virtual_classrooms', {
  id: int('id').autoincrement().primaryKey(),
  courseId: int('course_id').references(() => courses.id).notNull(),
  lecturerId: int('lecturer_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  mode: mysqlEnum('mode', ['meeting', 'webinar']).default('meeting'),
  roomName: varchar('room_name', { length: 100 }).unique().notNull(), // Unique identifier for LiveKit
  timetableSlotId: int('timetable_slot_id').references(() => timetableSlots.id), // Optional: Link to official slot
  status: mysqlEnum('status', ['scheduled', 'active', 'ended']).default('scheduled'),
  startedAt: datetime('started_at'),
  endedAt: datetime('ended_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const classRecordings = mysqlTable('class_recordings', {
  id: int('id').autoincrement().primaryKey(),
  classroomId: int('classroom_id').references(() => virtualClassrooms.id).notNull(),
  s3Key: varchar('s3_key', { length: 255 }).notNull(),
  s3Url: varchar('s3_url', { length: 500 }).notNull(), // Presigned or public URL
  durationSeconds: int('duration_seconds'),
  fileSize: int('file_size'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const classEvents = mysqlTable('class_events', {
  id: int('id').autoincrement().primaryKey(),
  sessionId: int('session_id').notNull(),
  classroomId: int('classroom_id').references(() => virtualClassrooms.id),
  userId: int('user_id').references(() => users.id),
  participantIdentity: varchar('participant_identity', { length: 255 }).notNull(),
  eventType: mysqlEnum('event_type', [
    'hand_raise',
    'hand_lower',
    'poll_vote',
    'qa_question',
    'qa_answer',
    'reaction',
    'background_blur_enabled',
    'background_blur_disabled',
    'spotlight_self_enabled',
    'spotlight_self_disabled',
    'spotlight_changed',
    'new_poll_received',
    'poll_ended_received',
    'chat_message'
  ]).notNull(),
  eventData: text('event_data'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const virtualClassroomsRelations = relations(virtualClassrooms, ({ one, many }) => ({
  course: one(courses, {
    fields: [virtualClassrooms.courseId],
    references: [courses.id],
  }),
  lecturer: one(users, {
    fields: [virtualClassrooms.lecturerId],
    references: [users.id],
  }),
  timetableSlot: one(timetableSlots, {
    fields: [virtualClassrooms.timetableSlotId],
    references: [timetableSlots.id],
  }),
  recordings: many(classRecordings),
  events: many(classEvents),
}));

export const classRecordingsRelations = relations(classRecordings, ({ one }) => ({
  classroom: one(virtualClassrooms, {
    fields: [classRecordings.classroomId],
    references: [virtualClassrooms.id],
  }),
}));

export const classEventsRelations = relations(classEvents, ({ one }) => ({
  classroom: one(virtualClassrooms, {
    fields: [classEvents.classroomId],
    references: [virtualClassrooms.id],
  }),
  user: one(users, {
    fields: [classEvents.userId],
    references: [users.id],
  }),
}));

// --- JOURNAL MANAGEMENT MODULE ---

export const journals = mysqlTable('journals', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  description: text('description'),
  issn: varchar('issn', { length: 20 }),
  logoUrl: varchar('logo_url', { length: 500 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  managerId: int('manager_id').references(() => users.id),
  apcAmount: decimal('apc_amount', { precision: 10, scale: 2 }).default('0.00'),
  apcCurrency: varchar('apc_currency', { length: 10 }).default('NGN'),
  license: varchar('license', { length: 255 }).default('CC BY 4.0'), // Built-in OJS common feature
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const journalEditors = mysqlTable('journal_editors', {
  id: int('id').autoincrement().primaryKey(),
  journalId: int('journal_id').references(() => journals.id).notNull(),
  userId: int('user_id').references(() => users.id).notNull(),
  role: mysqlEnum('role', ['editor', 'section_editor']).default('editor'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const journalIssues = mysqlTable('journal_issues', {
  id: int('id').autoincrement().primaryKey(),
  journalId: int('journal_id').references(() => journals.id).notNull(),
  volume: int('volume').notNull(),
  number: int('number').notNull(),
  year: int('year').notNull(),
  title: varchar('title', { length: 255 }),
  description: text('description'),
  coverUrl: varchar('cover_url', { length: 500 }),
  isPublished: boolean('is_published').default(false),
  publishedAt: datetime('published_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const journalArticles = mysqlTable('journal_articles', {
  id: int('id').autoincrement().primaryKey(),
  journalId: int('journal_id').references(() => journals.id).notNull(),
  issueId: int('issue_id').references(() => journalIssues.id),
  title: varchar('title', { length: 500 }).notNull(),
  abstract: text('abstract'),
  keywords: text('keywords'),
  status: mysqlEnum('status', [
    'draft', 
    'submitted', 
    'under_review', 
    'revision_required', 
    'accepted', 
    'declined', 
    'copyediting',
    'production',
    'published'
  ]).default('draft'),
  doi: varchar('doi', { length: 255 }), // Built-in DOI support
  doiStatus: mysqlEnum('doi_status', ['pending', 'submitted', 'registered', 'error']).default('pending'),
  doiError: text('doi_error'),
  rorId: varchar('ror_id', { length: 50 }),
  aiSummary: text('ai_summary'),
  translatedMetadata: text('translated_metadata'), // JSONified translations
  isFeatured: boolean('is_featured').default(false),
  isApcPaid: boolean('is_apc_paid').default(false),
  submissionDate: datetime('submission_date'),
  publishedDate: datetime('published_date'),
  funding: text('funding'),
  conflictOfInterest: text('conflict_of_interest'),
  section: varchar('section', { length: 255 }),
  pages: varchar('pages', { length: 50 }),
  startingPage: int('starting_page'),
  endingPage: int('ending_page'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const journalArticleAuthors = mysqlTable('journal_article_authors', {
  id: int('id').autoincrement().primaryKey(),
  articleId: int('article_id').references(() => journalArticles.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  orcid: varchar('orcid', { length: 255 }),
  affiliation: varchar('affiliation', { length: 255 }),
  order: int('order').default(1),
  isCorresponding: boolean('is_corresponding').default(false),
});

export const journalArticleFiles = mysqlTable('journal_article_files', {
  id: int('id').autoincrement().primaryKey(),
  articleId: int('article_id').references(() => journalArticles.id).notNull(),
  fileUrl: varchar('file_url', { length: 500 }).notNull(),
  fileName: varchar('file_name', { length: 255 }),
  fileType: mysqlEnum('file_type', ['manuscript', 'supplementary', 'review_version', 'galley']).default('manuscript'),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
});

export const journalReviews = mysqlTable('journal_reviews', {
  id: int('id').autoincrement().primaryKey(),
  articleId: int('article_id').references(() => journalArticles.id).notNull(),
  reviewerId: int('reviewer_id').references(() => users.id).notNull(),
  round: int('round').default(1), // Support for multiple review rounds
  recommendation: mysqlEnum('recommendation', ['accept', 'minor_revisions', 'major_revisions', 'resubmit', 'decline']),
  commentsToEditor: text('comments_to_editor'),
  commentsToAuthor: text('comments_to_author'),
  dueDate: datetime('due_date'),
  completedAt: datetime('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const journalPayments = mysqlTable('journal_payments', {
  id: int('id').autoincrement().primaryKey(),
  articleId: int('article_id').references(() => journalArticles.id).notNull(),
  userId: int('user_id').references(() => users.id).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).notNull(),
  gateway: mysqlEnum('gateway', ['paystack', 'flutterwave', 'remita', 'manual']).notNull(),
  reference: varchar('reference', { length: 100 }).unique().notNull(),
  status: mysqlEnum('status', ['pending', 'completed', 'failed']).default('pending'),
  paidAt: datetime('paid_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// --- RELATIONSHIPS ---

export const journalsRelations = relations(journals, ({ one, many }) => ({
  manager: one(users, {
    fields: [journals.managerId],
    references: [users.id],
  }),
  editors: many(journalEditors),
  issues: many(journalIssues),
  articles: many(journalArticles),
}));

export const journalEditorsRelations = relations(journalEditors, ({ one }) => ({
  journal: one(journals, {
    fields: [journalEditors.journalId],
    references: [journals.id],
  }),
  user: one(users, {
    fields: [journalEditors.userId],
    references: [users.id],
  }),
}));

export const journalIssuesRelations = relations(journalIssues, ({ one, many }) => ({
  journal: one(journals, {
    fields: [journalIssues.journalId],
    references: [journals.id],
  }),
  articles: many(journalArticles),
}));

export const journalArticlesRelations = relations(journalArticles, ({ one, many }) => ({
  journal: one(journals, {
    fields: [journalArticles.journalId],
    references: [journals.id],
  }),
  issue: one(journalIssues, {
    fields: [journalArticles.issueId],
    references: [journalIssues.id],
  }),
  authors: many(journalArticleAuthors),
  files: many(journalArticleFiles),
  reviews: many(journalReviews),
}));

export const journalArticleAuthorsRelations = relations(journalArticleAuthors, ({ one }) => ({
  article: one(journalArticles, {
    fields: [journalArticleAuthors.articleId],
    references: [journalArticles.id],
  }),
}));

export const journalArticleFilesRelations = relations(journalArticleFiles, ({ one }) => ({
  article: one(journalArticles, {
    fields: [journalArticleFiles.articleId],
    references: [journalArticles.id],
  }),
}));

export const journalReviewsRelations = relations(journalReviews, ({ one }) => ({
  article: one(journalArticles, {
    fields: [journalReviews.articleId],
    references: [journalArticles.id],
  }),
  reviewer: one(users, {
    fields: [journalReviews.reviewerId],
    references: [users.id],
  }),
}));

export const journalPaymentsRelations = relations(journalPayments, ({ one }) => ({
  article: one(journalArticles, {
    fields: [journalPayments.articleId],
    references: [journalArticles.id],
  }),
  user: one(users, {
    fields: [journalPayments.userId],
    references: [users.id],
  }),
}));

// --- LIBRARY MANAGEMENT MODULE (ILRP) ---

export const libraryResources = mysqlTable('library_resources', {
  id: int('id').autoincrement().primaryKey(),
  title: varchar('title', { length: 500 }).notNull(),
  subtitle: varchar('subtitle', { length: 500 }),
  authors: text('authors'), // JSON or comma-separated
  isbn: varchar('isbn', { length: 20 }).unique(),
  issn: varchar('issn', { length: 20 }),
  publisher: varchar('publisher', { length: 255 }),
  publicationYear: int('publication_year'),
  publishedDate: varchar('published_date', { length: 50 }),
  format: varchar('format', { length: 50 }),
  description: text('description'),
  abstract: text('abstract'), // For AI summarization
  aiTags: text('ai_tags'), // JSON array of keywords for discovery
  language: varchar('language', { length: 50 }).default('English'),
  coverUrl: varchar('cover_url', { length: 500 }),
  metaData: text('meta_data'), // JSON Dublin Core/MARC21
  type: mysqlEnum('type', ['book', 'journal', 'magazine', 'audiobook', 'video', 'digitized_manuscript']).default('book'),
  category: varchar('category', { length: 255 }),
  callNumber: varchar('call_number', { length: 100 }), // e.g. Dewey Decimal
  totalCopies: int('total_copies').default(0),
  availableCopies: int('available_copies').default(0),
  curriculumMapping: text('curriculum_mapping'), // JSON: { "exam": "WAEC", "subject": "Physics" }
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const libraryPhysicalCopies = mysqlTable('library_physical_copies', {
  id: int('id').autoincrement().primaryKey(),
  resourceId: int('resource_id').references(() => libraryResources.id).notNull(),
  barcode: varchar('barcode', { length: 100 }).unique().notNull(),
  shelfLocation: varchar('shelf_location', { length: 255 }),
  condition: mysqlEnum('condition', ['new', 'good', 'fair', 'poor', 'damaged']).default('good'),
  status: mysqlEnum('status', ['available', 'borrowed', 'reserved', 'maintenance', 'lost']).default('available'),
  addedAt: timestamp('added_at').defaultNow(),
});

export const libraryPatronMetadata = mysqlTable('library_patron_metadata', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').references(() => users.id).unique().notNull(),
  schoolPortalId: varchar('school_portal_id', { length: 255 }).unique(),
  membershipNumber: varchar('membership_number', { length: 50 }).unique(),
  maxBorrowLimit: int('max_borrow_limit').default(5),
  currentBorrowCount: int('current_borrow_count').default(0),
  totalFinesOwed: decimal('total_fines_owed', { precision: 12, scale: 2 }).default('0.00'),
  status: mysqlEnum('status', ['active', 'suspended', 'blocked']).default('active'),
  notes: text('notes'),
});

export const libraryCirculation = mysqlTable('library_circulation', {
  id: int('id').autoincrement().primaryKey(),
  copyId: int('copy_id').references(() => libraryPhysicalCopies.id).notNull(),
  patronId: int('patron_id').references(() => users.id).notNull(),
  librarianId: int('librarian_id').references(() => users.id).notNull(),
  borrowDate: timestamp('borrow_date').defaultNow(),
  dueDate: datetime('due_date').notNull(),
  returnDate: datetime('return_date'),
  status: mysqlEnum('status', ['active', 'returned', 'overdue', 'lost']).default('active'),
  fineAmount: decimal('fine_amount', { precision: 10, scale: 2 }).default('0.00'),
  notes: text('notes'),
});

export const libraryDigitalAssets = mysqlTable('library_digital_assets', {
  id: int('id').autoincrement().primaryKey(),
  resourceId: int('resource_id').references(() => libraryResources.id).notNull(),
  fileUrl: varchar('file_url', { length: 500 }).notNull(),
  fileType: mysqlEnum('file_type', ['pdf', 'epub', 'mp4', 'mp3', 'other']).default('pdf'),
  fileSize: int('file_size'), // in bytes
  isDownloadable: boolean('is_downloadable').default(false),
  addedAt: timestamp('added_at').defaultNow(),
});

export const libraryReservations = mysqlTable('library_reservations', {
  id: int('id').autoincrement().primaryKey(),
  resourceId: int('resource_id').references(() => libraryResources.id).notNull(),
  patronId: int('patron_id').references(() => users.id).notNull(),
  reservationDate: timestamp('reservation_date').defaultNow(),
  status: mysqlEnum('status', ['pending', 'fulfilled', 'cancelled', 'expired']).default('pending'),
  fulfilledDate: datetime('fulfilled_date'),
});

export const libraryFines = mysqlTable('library_fines', {
  id: int('id').autoincrement().primaryKey(),
  patronId: int('patron_id').references(() => users.id).notNull(),
  circulationId: int('circulation_id').references(() => libraryCirculation.id),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  reason: varchar('reason', { length: 255 }).notNull(),
  status: mysqlEnum('status', ['unpaid', 'paid', 'waived']).default('unpaid'),
  createdAt: timestamp('created_at').defaultNow(),
  paidAt: datetime('paid_at'),
});

// --- CHANGE OF COURSE (TRANSFER) MODULE ---
export const studentCourseTransfers = mysqlTable('student_course_transfers', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  matricNumber: varchar('matric_number', { length: 50 }),
  feeStatus: mysqlEnum('fee_status', ['pending', 'paid', 'waived']).default('pending'),
  transactionId: int('transaction_id').references(() => transactions.id),
  
  // Present
  currentFacultyId: int('current_faculty_id').references(() => faculties.id).notNull(),
  currentDeptId: int('current_dept_id').references(() => departments.id).notNull(),
  currentLevel: int('current_level').notNull(),
  currentDegreeInView: varchar('current_degree_in_view', { length: 255 }),

  // Proposed
  proposedFacultyId: int('proposed_faculty_id').references(() => faculties.id).notNull(),
  proposedDeptId: int('proposed_dept_id').references(() => departments.id).notNull(),
  proposedLevel: int('proposed_level').notNull(),
  proposedDegreeInView: varchar('proposed_degree_in_view', { length: 255 }),

  // Workflow Stages
  
  // 1. Admissions Officer Eligibility
  admissionsOfficerStatus: mysqlEnum('admissions_officer_status', ['pending', 'eligible', 'not_eligible']).default('pending'),
  admissionsOfficerNote: text('admissions_officer_note'),
  admissionsOfficerId: int('admissions_officer_id').references(() => users.id),
  admissionsOfficerSignedAt: datetime('admissions_officer_signed_at'),

  // 2. Head of Present Department
  presentHodStatus: mysqlEnum('present_hod_status', ['pending', 'agreed', 'not_agreed']).default('pending'),
  presentHodId: int('present_hod_id').references(() => users.id),
  presentHodSignedAt: datetime('present_hod_signed_at'),

  // 3. Dean of Present Faculty
  presentDeanStatus: mysqlEnum('present_dean_status', ['pending', 'agreed', 'not_agreed']).default('pending'),
  presentDeanId: int('present_dean_id').references(() => users.id),
  presentDeanSignedAt: datetime('present_dean_signed_at'),

  // 4. Faculty Officer of Proposed Faculty
  proposedFacultyOfficerStatus: mysqlEnum('proposed_faculty_officer_status', ['pending', 'satisfied', 'not_satisfied']).default('pending'),
  proposedFacultyOfficerId: int('proposed_faculty_officer_id').references(() => users.id),
  proposedFacultyOfficerSignedAt: datetime('proposed_faculty_officer_signed_at'),

  // 5. Head of Proposed Department
  proposedHodStatus: mysqlEnum('proposed_hod_status', ['pending', 'accepted', 'not_accepted']).default('pending'),
  proposedHodId: int('proposed_hod_id').references(() => users.id),
  proposedHodSignedAt: datetime('proposed_hod_signed_at'),

  // 6. Dean of Proposed Faculty
  proposedDeanStatus: mysqlEnum('proposed_dean_status', ['pending', 'accepted', 'not_accepted']).default('pending'),
  proposedDeanId: int('proposed_dean_id').references(() => users.id),
  proposedDeanSignedAt: datetime('proposed_dean_signed_at'),

  // 7. Final Completion (Operations Manager / ADPU)
  finalStatus: mysqlEnum('final_status', ['pending', 'approved', 'rejected', 'completed']).default('pending'),
  operationsManagerId: int('operations_manager_id').references(() => users.id),
  effectedAt: datetime('effected_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
});

// --- LIBRARY RELATIONS ---

export const libraryResourcesRelations = relations(libraryResources, ({ many }) => ({
  copies: many(libraryPhysicalCopies),
}));

export const libraryPhysicalCopiesRelations = relations(libraryPhysicalCopies, ({ one, many }) => ({
  resource: one(libraryResources, {
    fields: [libraryPhysicalCopies.resourceId],
    references: [libraryResources.id],
  }),
  circulation: many(libraryCirculation),
}));

export const libraryPatronMetadataRelations = relations(libraryPatronMetadata, ({ one }) => ({
  user: one(users, {
    fields: [libraryPatronMetadata.userId],
    references: [users.id],
  }),
}));

export const libraryCirculationRelations = relations(libraryCirculation, ({ one, many }) => ({
  copy: one(libraryPhysicalCopies, {
    fields: [libraryCirculation.copyId],
    references: [libraryPhysicalCopies.id],
  }),
  patron: one(users, {
    fields: [libraryCirculation.patronId],
    references: [users.id],
  }),
  librarian: one(users, {
    fields: [libraryCirculation.librarianId],
    references: [users.id],
  }),
  fines: many(libraryFines),
}));

export const libraryDigitalAssetsRelations = relations(libraryDigitalAssets, ({ one }) => ({
  resource: one(libraryResources, {
    fields: [libraryDigitalAssets.resourceId],
    references: [libraryResources.id],
  }),
}));

export const libraryReservationsRelations = relations(libraryReservations, ({ one }) => ({
  resource: one(libraryResources, {
    fields: [libraryReservations.resourceId],
    references: [libraryResources.id],
  }),
  patron: one(users, {
    fields: [libraryReservations.patronId],
    references: [users.id],
  }),
}));

export const libraryFinesRelations = relations(libraryFines, ({ one }) => ({
  patron: one(users, {
    fields: [libraryFines.patronId],
    references: [users.id],
  }),
  circulation: one(libraryCirculation, {
    fields: [libraryFines.circulationId],
    references: [libraryCirculation.id],
  }),
}));

export const studentCourseTransfersRelations = relations(studentCourseTransfers, ({ one }) => ({
  student: one(students, {
    fields: [studentCourseTransfers.studentId],
    references: [students.id],
  }),
  currentFaculty: one(faculties, {
    fields: [studentCourseTransfers.currentFacultyId],
    references: [faculties.id],
  }),
  currentDept: one(departments, {
    fields: [studentCourseTransfers.currentDeptId],
    references: [departments.id],
  }),
  proposedFaculty: one(faculties, {
    fields: [studentCourseTransfers.proposedFacultyId],
    references: [faculties.id],
  }),
  proposedDept: one(departments, {
    fields: [studentCourseTransfers.proposedDeptId],
    references: [departments.id],
  }),
}));

export const systemConfig = mysqlTable('system_config', {
  id: int('id').autoincrement().primaryKey(),
  key: varchar('key', { length: 255 }).unique().notNull(),
  value: text('value').notNull(),
  configGroup: varchar('config_group', { length: 100 }).default('general'),
  isEncrypted: boolean('is_encrypted').default(false),
  description: varchar('description', { length: 500 }),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const journalAnnouncements = mysqlTable('journal_announcements', {
  id: int('id').autoincrement().primaryKey(),
  journalId: int('journal_id').references(() => journals.id),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  type: varchar('type', { length: 50 }).default('news'), // 'news', 'call_for_papers', 'deadline'
  isPublic: boolean('is_public').default(false),
  expiryDate: date('expiry_date'),
  createdAt: timestamp('created_at').defaultNow(),
});

// --- TRANSPORTATION MANAGEMENT ---
export const vehicles = mysqlTable('vehicles', {
  id: int('id').autoincrement().primaryKey(),
  registrationNumber: varchar('registration_number', { length: 50 }).unique().notNull(),
  make: varchar('make', { length: 100 }).notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  year: int('year').notNull(),
  vehicleType: mysqlEnum('vehicle_type', ['bus', 'van', 'car', 'motorcycle', 'truck']).notNull(),
  capacity: int('capacity').notNull(),
  fuelType: mysqlEnum('fuel_type', ['petrol', 'diesel', 'electric', 'hybrid']).notNull(),
  licensePlate: varchar('license_plate', { length: 20 }).unique().notNull(),
  chassisNumber: varchar('chassis_number', { length: 50 }).unique(),
  engineNumber: varchar('engine_number', { length: 50 }).unique(),
  purchaseDate: date('purchase_date').notNull(),
  purchaseCost: decimal('purchase_cost', { precision: 12, scale: 2 }).notNull(),
  currentMileage: int('current_mileage').default(0),
  status: mysqlEnum('status', ['active', 'maintenance', 'retired', 'accident']).default('active'),
  insuranceExpiry: date('insurance_expiry'),
  roadWorthinessExpiry: date('road_worthiness_expiry'),
  lastServiceDate: date('last_service_date'),
  nextServiceDate: date('next_service_date'),
  assignedDriverId: int('assigned_driver_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const drivers = mysqlTable('drivers', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').references(() => users.id).unique().notNull(),
  licenseNumber: varchar('license_number', { length: 50 }).unique().notNull(),
  licenseType: mysqlEnum('license_type', ['A', 'B', 'C', 'D', 'E']).notNull(),
  licenseExpiry: date('license_expiry').notNull(),
  experienceYears: int('experience_years').default(0),
  specializations: varchar('specializations', { length: 255 }), // JSON array of vehicle types
  medicalFitnessExpiry: date('medical_fitness_expiry'),
  defensiveTrainingDate: date('defensive_training_date'),
  lastBackgroundCheck: date('last_background_check'),
  accidentsRecord: int('accidents_record').default(0),
  violationsRecord: int('violations_record').default(0),
  status: mysqlEnum('status', ['active', 'suspended', 'retired']).default('active'),
  assignedVehicleId: int('assigned_vehicle_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const routes = mysqlTable('routes', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 20 }).unique().notNull(),
  description: text('description'),
  startPoint: varchar('start_point', { length: 255 }).notNull(),
  endPoint: varchar('end_point', { length: 255 }).notNull(),
  distance: decimal('distance', { precision: 8, scale: 2 }).notNull(), // in km
  estimatedTime: int('estimated_time').notNull(), // in minutes
  routeType: mysqlEnum('route_type', ['campus', 'inter_campus', 'city', 'express']).notNull(),
  fareStructure: text('fare_structure'), // JSON with different fare categories
  activeDays: varchar('active_days', { length: 20 }), // JSON array of days
  frequency: int('frequency'), // minutes between trips
  peakHoursOnly: boolean('peak_hours_only').default(false),
  status: mysqlEnum('status', ['active', 'inactive', 'suspended']).default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const schedules = mysqlTable('schedules', {
  id: int('id').autoincrement().primaryKey(),
  routeId: int('route_id').references(() => routes.id).notNull(),
  vehicleId: int('vehicle_id').references(() => vehicles.id).notNull(),
  driverId: int('driver_id').references(() => drivers.id).notNull(),
  departureTime: time('departure_time').notNull(),
  arrivalTime: time('arrival_time').notNull(),
  daysOfWeek: varchar('days_of_week', { length: 20 }).notNull(), // JSON array
  effectiveFrom: date('effective_from').notNull(),
  effectiveTo: date('effective_to'),
  status: mysqlEnum('status', ['active', 'cancelled', 'completed']).default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const trips = mysqlTable('trips', {
  id: int('id').autoincrement().primaryKey(),
  scheduleId: int('schedule_id').references(() => schedules.id),
  routeId: int('route_id').references(() => routes.id).notNull(),
  vehicleId: int('vehicle_id').references(() => vehicles.id).notNull(),
  driverId: int('driver_id').references(() => drivers.id).notNull(),
  tripDate: date('trip_date').notNull(),
  departureTime: datetime('departure_time').notNull(),
  actualDepartureTime: datetime('actual_departure_time'),
  arrivalTime: datetime('arrival_time'),
  actualArrivalTime: datetime('actual_arrival_time'),
  status: mysqlEnum('status', ['scheduled', 'in_progress', 'completed', 'cancelled', 'delayed']).default('scheduled'),
  passengerCount: int('passenger_count').default(0),
  revenue: decimal('revenue', { precision: 10, scale: 2 }).default('0.00'),
  fuelConsumed: decimal('fuel_consumed', { precision: 8, scale: 2 }).default('0.00'),
  distanceTraveled: decimal('distance_traveled', { precision: 8, scale: 2 }).default('0.00'),
  incidents: text('incidents'),
  driverNotes: text('driver_notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const student_transport_registrations = mysqlTable('student_transport_registrations', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  routeId: int('route_id').references(() => routes.id).notNull(),
  registrationDate: date('registration_date').notNull(),
  expiryDate: date('expiry_date').notNull(),
  status: mysqlEnum('status', ['active', 'expired', 'suspended', 'cancelled']).default('active'),
  qrCode: varchar('qr_code', { length: 500 }),
  paymentStatus: mysqlEnum('payment_status', ['paid', 'pending', 'overdue', 'exempt']).default('pending'),
  amountPaid: decimal('amount_paid', { precision: 10, scale: 2 }).default('0.00'),
  paymentMethod: varchar('payment_method', { length: 50 }),
  lastPaymentDate: date('last_payment_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const boarding_records = mysqlTable('boarding_records', {
  id: int('id').autoincrement().primaryKey(),
  tripId: int('trip_id').references(() => trips.id).notNull(),
  studentId: int('student_id').references(() => students.id).notNull(),
  registrationId: int('registration_id'),
  boardingTime: datetime('boarding_time').notNull(),
  boardingPoint: varchar('boarding_point', { length: 255 }),
  alightingTime: datetime('alighting_time'),
  alightingPoint: varchar('alighting_point', { length: 255 }),
  farePaid: decimal('fare_paid', { precision: 8, scale: 2 }).default('0.00'),
  paymentMethod: varchar('payment_method', { length: 50 }),
  qrScanned: boolean('qr_scanned').default(false),
  status: mysqlEnum('status', ['boarded', 'completed', 'cancelled']).default('boarded'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  regFk: foreignKey({
    name: 'brd_rec_reg_id_fk',
    columns: [table.registrationId],
    foreignColumns: [student_transport_registrations.id],
  }),
}));

export const route_stops = mysqlTable('route_stops', {
  id: int('id').autoincrement().primaryKey(),
  routeId: int('route_id').references(() => routes.id).notNull(),
  stopName: varchar('stop_name', { length: 255 }).notNull(),
  stopOrder: int('stop_order').notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 8 }).notNull(),
  longitude: decimal('longitude', { precision: 11, scale: 8 }).notNull(),
  facilities: varchar('facilities', { length: 255 }), // JSON array
  estimatedArrival: time('estimated_arrival'),
  estimatedDeparture: time('estimated_departure'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const maintenance_records = mysqlTable('maintenance_records', {
  id: int('id').autoincrement().primaryKey(),
  vehicleId: int('vehicle_id').references(() => vehicles.id).notNull(),
  maintenanceType: mysqlEnum('maintenance_type', ['routine', 'repair', 'inspection', 'emergency']).notNull(),
  description: text('description').notNull(),
  scheduledDate: date('scheduled_date').notNull(),
  completedDate: date('completed_date'),
  cost: decimal('cost', { precision: 10, scale: 2 }).default('0.00'),
  mechanicName: varchar('mechanic_name', { length: 255 }),
  partsUsed: text('parts_used'), // JSON array
  odometerReading: int('odometer_reading'),
  status: mysqlEnum('status', ['scheduled', 'in_progress', 'completed', 'cancelled']).default('scheduled'),
  nextMaintenanceDate: date('next_maintenance_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const fuel_records = mysqlTable('fuel_records', {
  id: int('id').autoincrement().primaryKey(),
  vehicleId: int('vehicle_id').references(() => vehicles.id).notNull(),
  fuelDate: date('fuel_date').notNull(),
  fuelType: mysqlEnum('fuel_type', ['petrol', 'diesel', 'electric', 'hybrid']).notNull(),
  quantity: decimal('quantity', { precision: 8, scale: 2 }).notNull(),
  unitPrice: decimal('unit_price', { precision: 8, scale: 2 }).notNull(),
  totalCost: decimal('total_cost', { precision: 10, scale: 2 }).notNull(),
  odometerReading: int('odometer_reading'),
  fuelingStation: varchar('fueling_station', { length: 255 }),
  receiptNumber: varchar('receipt_number', { length: 100 }),
  driverId: int('driver_id').references(() => drivers.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const incidents = mysqlTable('incidents', {
  id: int('id').autoincrement().primaryKey(),
  vehicleId: int('vehicle_id').references(() => vehicles.id).notNull(),
  driverId: int('driver_id').references(() => drivers.id).notNull(),
  tripId: int('trip_id').references(() => trips.id),
  incidentDate: datetime('incident_date').notNull(),
  incidentType: mysqlEnum('incident_type', ['accident', 'breakdown', 'traffic_violation', 'theft', 'other']).notNull(),
  severity: mysqlEnum('severity', ['minor', 'major', 'critical']).notNull(),
  description: text('description').notNull(),
  location: varchar('location', { length: 255 }),
  weatherConditions: varchar('weather_conditions', { length: 100 }),
  roadConditions: varchar('road_conditions', { length: 100 }),
  passengerInjuries: int('passenger_injuries').default(0),
  propertyDamage: decimal('property_damage', { precision: 10, scale: 2 }).default('0.00'),
  insuranceClaim: boolean('insurance_claim').default(false),
  claimNumber: varchar('claim_number', { length: 100 }),
  policeReport: boolean('police_report').default(false),
  reportNumber: varchar('report_number', { length: 100 }),
  status: mysqlEnum('status', ['reported', 'investigating', 'resolved', 'closed']).default('reported'),
  resolution: text('resolution'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const feedback = mysqlTable('feedback', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id),
  tripId: int('trip_id').references(() => trips.id),
  routeId: int('route_id').references(() => routes.id),
  driverId: int('driver_id').references(() => drivers.id),
  vehicleId: int('vehicle_id').references(() => vehicles.id),
  feedbackType: mysqlEnum('feedback_type', ['complaint', 'suggestion', 'compliment', 'safety_concern']).notNull(),
  rating: int('rating'), // 1-5 stars
  subject: varchar('subject', { length: 255 }).notNull(),
  message: text('message').notNull(),
  feedbackDate: timestamp('feedback_date').defaultNow(),
  status: mysqlEnum('status', ['pending', 'reviewed', 'resolved', 'dismissed']).default('pending'),
  response: text('response'),
  respondedBy: int('responded_by').references(() => users.id),
  responseDate: datetime('response_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const location_tracking = mysqlTable('location_tracking', {
  id: int('id').autoincrement().primaryKey(),
  vehicleId: int('vehicle_id').references(() => vehicles.id).notNull(),
  tripId: int('trip_id').references(() => trips.id),
  driverId: int('driver_id').references(() => drivers.id),
  timestamp: timestamp('timestamp').defaultNow(),
  latitude: decimal('latitude', { precision: 10, scale: 8 }).notNull(),
  longitude: decimal('longitude', { precision: 11, scale: 8 }).notNull(),
  speed: decimal('speed', { precision: 5, scale: 2 }).default('0.00'),
  heading: int('heading'), // degrees 0-359
  altitude: decimal('altitude', { precision: 8, scale: 2 }),
  accuracy: decimal('accuracy', { precision: 5, scale: 2 }),
  gpsStatus: mysqlEnum('gps_status', ['active', 'inactive', 'poor_signal']).default('active'),
  batteryLevel: int('battery_level'),
  ignitionStatus: mysqlEnum('ignition_status', ['on', 'off']).default('off'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const maintenance_alerts = mysqlTable('maintenance_alerts', {
  id: int('id').autoincrement().primaryKey(),
  vehicleId: int('vehicle_id').references(() => vehicles.id).notNull(),
  alertType: mysqlEnum('alert_type', ['service_due', 'oil_change', 'tire_rotation', 'brake_inspection', 'battery_check', 'other']).notNull(),
  description: text('description').notNull(),
  priority: mysqlEnum('priority', ['low', 'medium', 'high', 'urgent']).notNull(),
  dueDate: date('due_date').notNull(),
  mileageThreshold: int('mileage_threshold'),
  currentMileage: int('current_mileage'),
  estimatedCost: decimal('estimated_cost', { precision: 10, scale: 2 }).default('0.00'),
  status: mysqlEnum('status', ['pending', 'scheduled', 'completed', 'dismissed']).default('pending'),
  scheduledDate: date('scheduled_date'),
  completedDate: date('completed_date'),
  actualCost: decimal('actual_cost', { precision: 10, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// Transportation relations
export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  assignedDriver: one(drivers, {
    fields: [vehicles.assignedDriverId],
    references: [drivers.id],
  }),
  schedules: many(schedules),
  trips: many(trips),
  maintenanceRecords: many(maintenance_records),
  fuelRecords: many(fuel_records),
  incidents: many(incidents),
  feedback: many(feedback),
  locationTracking: many(location_tracking),
  maintenanceAlerts: many(maintenance_alerts),
}));

export const driversRelations = relations(drivers, ({ one, many }) => ({
  user: one(users, {
    fields: [drivers.userId],
    references: [users.id],
  }),
  assignedVehicle: one(vehicles, {
    fields: [drivers.assignedVehicleId],
    references: [vehicles.id],
  }),
  schedules: many(schedules),
  trips: many(trips),
  incidents: many(incidents),
  feedback: many(feedback),
  fuelRecords: many(fuel_records),
  locationTracking: many(location_tracking),
}));

export const routesRelations = relations(routes, ({ one, many }) => ({
  schedules: many(schedules),
  trips: many(trips),
  routeStops: many(route_stops),
  studentRegistrations: many(student_transport_registrations),
  feedback: many(feedback),
}));

export const schedulesRelations = relations(schedules, ({ one, many }) => ({
  route: one(routes, {
    fields: [schedules.routeId],
    references: [routes.id],
  }),
  vehicle: one(vehicles, {
    fields: [schedules.vehicleId],
    references: [vehicles.id],
  }),
  driver: one(drivers, {
    fields: [schedules.driverId],
    references: [drivers.id],
  }),
  trips: many(trips),
}));

export const tripsRelations = relations(trips, ({ one, many }) => ({
  schedule: one(schedules, {
    fields: [trips.scheduleId],
    references: [schedules.id],
  }),
  route: one(routes, {
    fields: [trips.routeId],
    references: [routes.id],
  }),
  vehicle: one(vehicles, {
    fields: [trips.vehicleId],
    references: [vehicles.id],
  }),
  driver: one(drivers, {
    fields: [trips.driverId],
    references: [drivers.id],
  }),
  boardingRecords: many(boarding_records),
  incidents: many(incidents),
  feedback: many(feedback),
  locationTracking: many(location_tracking),
}));

export const studentTransportRegistrationsRelations = relations(student_transport_registrations, ({ one, many }) => ({
  student: one(students, {
    fields: [student_transport_registrations.studentId],
    references: [students.id],
  }),
  route: one(routes, {
    fields: [student_transport_registrations.routeId],
    references: [routes.id],
  }),
  boardingRecords: many(boarding_records),
}));

export const boardingRecordsRelations = relations(boarding_records, ({ one }) => ({
  trip: one(trips, {
    fields: [boarding_records.tripId],
    references: [trips.id],
  }),
  student: one(students, {
    fields: [boarding_records.studentId],
    references: [students.id],
  }),
  registration: one(student_transport_registrations, {
    fields: [boarding_records.registrationId],
    references: [student_transport_registrations.id],
  }),
}));

export const routeStopsRelations = relations(route_stops, ({ one }) => ({
  route: one(routes, {
    fields: [route_stops.routeId],
    references: [routes.id],
  }),
}));

export const maintenanceRecordsRelations = relations(maintenance_records, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [maintenance_records.vehicleId],
    references: [vehicles.id],
  }),
}));

export const fuelRecordsRelations = relations(fuel_records, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [fuel_records.vehicleId],
    references: [vehicles.id],
  }),
  driver: one(drivers, {
    fields: [fuel_records.driverId],
    references: [drivers.id],
  }),
}));

export const incidentsRelations = relations(incidents, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [incidents.vehicleId],
    references: [vehicles.id],
  }),
  driver: one(drivers, {
    fields: [incidents.driverId],
    references: [drivers.id],
  }),
  trip: one(trips, {
    fields: [incidents.tripId],
    references: [trips.id],
  }),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  student: one(students, {
    fields: [feedback.studentId],
    references: [students.id],
  }),
  trip: one(trips, {
    fields: [feedback.tripId],
    references: [trips.id],
  }),
  route: one(routes, {
    fields: [feedback.routeId],
    references: [routes.id],
  }),
  driver: one(drivers, {
    fields: [feedback.driverId],
    references: [drivers.id],
  }),
  vehicle: one(vehicles, {
    fields: [feedback.vehicleId],
    references: [vehicles.id],
  }),
  respondedByUser: one(users, {
    fields: [feedback.respondedBy],
    references: [users.id],
  }),
}));

export const locationTrackingRelations = relations(location_tracking, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [location_tracking.vehicleId],
    references: [vehicles.id],
  }),
  trip: one(trips, {
    fields: [location_tracking.tripId],
    references: [trips.id],
  }),
  driver: one(drivers, {
    fields: [location_tracking.driverId],
    references: [drivers.id],
  }),
}));

export const maintenanceAlertsRelations = relations(maintenance_alerts, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [maintenance_alerts.vehicleId],
    references: [vehicles.id],
  }),
}));

export const multi_campus_coordination = mysqlTable('multi_campus_coordination', {
  id: int('id').autoincrement().primaryKey(),
  sourceCampusId: int('source_campus_id').notNull(),
  destinationCampusId: int('destination_campus_id').notNull(),
  routeType: mysqlEnum('route_type', ['shuttle', 'express', 'chartered', 'emergency']).notNull(),
  operatingHours: text('operating_hours'), // JSON
  frequencyMinutes: int('frequency_minutes').notNull(),
  vehicleCapacity: int('vehicle_capacity').notNull(),
  driverRequirements: text('driver_requirements'),
  fareStructure: text('fare_structure'), // JSON
  priorityLevel: mysqlEnum('priority_level', ['low', 'medium', 'high', 'critical']).default('medium'),
  coordinationRules: text('coordination_rules'), // JSON
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const campus_locations = mysqlTable('campus_locations', {
  id: int('id').autoincrement().primaryKey(),
  campusId: int('campus_id').notNull(),
  locationName: varchar('location_name', { length: 255 }).notNull(),
  locationType: mysqlEnum('location_type', ['main_gate', 'bus_stop', 'parking_lot', 'student_center', 'faculty_building', 'hostel', 'library', 'sports_complex', 'admin_block']).notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 8 }).notNull(),
  longitude: decimal('longitude', { precision: 11, scale: 8 }).notNull(),
  address: text('address'),
  capacity: int('capacity').default(0),
  facilities: text('facilities'), // JSON
  operatingHours: text('operating_hours'), // JSON
  accessibilityFeatures: text('accessibility_features'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const emergency_transportation = mysqlTable('emergency_transportation', {
  id: int('id').autoincrement().primaryKey(),
  emergencyType: mysqlEnum('emergency_type', ['medical', 'security', 'natural_disaster', 'accident', 'fire', 'other']).notNull(),
  severityLevel: mysqlEnum('severity_level', ['low', 'medium', 'high', 'critical']).notNull(),
  campusId: int('campus_id').notNull(),
  locationId: int('location_id'),
  description: text('description').notNull(),
  requestedBy: int('requested_by').references(() => users.id),
  approvedBy: int('approved_by').references(() => users.id),
  priorityLevel: mysqlEnum('priority_level', ['low', 'medium', 'high', 'critical']).default('medium'),
  passengersInvolved: text('passengers_involved'),
  specialRequirements: text('special_requirements'),
  costEstimate: decimal('cost_estimate', { precision: 10, scale: 2 }).default('0.00'),
  notes: text('notes'),
  status: mysqlEnum('status', ['requested', 'approved', 'dispatched', 'in_progress', 'completed', 'cancelled']).default('requested'),
  vehicleId: int('vehicle_id').references(() => vehicles.id),
  driverId: int('driver_id').references(() => drivers.id),
  dispatchTime: datetime('dispatch_time'),
  arrivalTime: datetime('arrival_time'),
  completionTime: datetime('completion_time'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const transportation_performance_metrics = mysqlTable('transportation_performance_metrics', {
  id: int('id').autoincrement().primaryKey(),
  metricType: mysqlEnum('metric_type', ['kpi', 'efficiency', 'safety', 'satisfaction', 'financial', 'operational']).notNull(),
  metricName: varchar('metric_name', { length: 255 }).notNull(),
  metricValue: decimal('metric_value', { precision: 10, scale: 2 }).notNull(),
  metricUnit: varchar('metric_unit', { length: 50 }),
  targetValue: decimal('target_value', { precision: 10, scale: 2 }).notNull(),
  variancePercentage: decimal('variance_percentage', { precision: 5, scale: 2 }).notNull(),
  periodStart: datetime('period_start').notNull(),
  periodEnd: datetime('period_end').notNull(),
  campusId: int('campus_id'),
  vehicleId: int('vehicle_id'),
  driverId: int('driver_id'),
  routeId: int('route_id'),
  benchmarkValue: decimal('benchmark_value', { precision: 10, scale: 2 }),
  trendDirection: mysqlEnum('trend_direction', ['up', 'down', 'stable']),
  notes: text('notes'),
  calculatedBy: int('calculated_by').references(() => users.id),
  calculatedAt: timestamp('calculated_at').defaultNow(),
});

export const global_transportation_settings = mysqlTable('global_transportation_settings', {
  id: int('id').autoincrement().primaryKey(),
  category: varchar('category', { length: 100 }).notNull(),
  settingKey: varchar('setting_key', { length: 100 }).notNull(),
  settingValue: text('setting_value').notNull(),
  description: text('description'),
  isGlobal: boolean('is_global').default(true),
  campusId: int('campus_id'),
  lastModifiedBy: int('last_modified_by').references(() => users.id),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const transportation_audit_logs = mysqlTable('transportation_audit_logs', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').references(() => users.id).notNull(),
  action: varchar('action', { length: 255 }).notNull(),
  module: varchar('module', { length: 100 }).notNull(),
  recordId: int('record_id'),
  oldValues: text('old_values'), // JSON
  newValues: text('new_values'), // JSON
  ipAddress: varchar('ip_address', { length: 45 }),
  timestamp: timestamp('timestamp').defaultNow(),
});

export const gps_tracking_realtime = mysqlTable('gps_tracking_realtime', {
  id: int('id').autoincrement().primaryKey(),
  vehicleId: int('vehicle_id').references(() => vehicles.id).notNull(),
  tripId: int('trip_id').references(() => trips.id),
  latitude: decimal('latitude', { precision: 10, scale: 8 }).notNull(),
  longitude: decimal('longitude', { precision: 11, scale: 8 }).notNull(),
  speed: decimal('speed', { precision: 5, scale: 2 }).default('0.00'),
  heading: int('heading'),
  altitude: decimal('altitude', { precision: 8, scale: 2 }),
  accuracy: decimal('accuracy', { precision: 5, scale: 2 }),
  ignitionStatus: boolean('ignition_status'),
  gpsStatus: varchar('gps_status', { length: 50 }),
  batteryLevel: int('battery_level'),
  fuelLevel: int('fuel_level'),
  odometerReading: int('odometer_reading'),
  engineStatus: varchar('engine_status', { length: 50 }),
  doorStatus: varchar('door_status', { length: 50 }),
  timestamp: timestamp('timestamp').defaultNow(),
});

export const route_optimization = mysqlTable('route_optimization', {
  id: int('id').autoincrement().primaryKey(),
  routeId: int('route_id').references(() => routes.id).notNull(),
  optimizationDate: date('optimization_date').notNull(),
  suggestedChanges: text('suggested_changes'), // JSON
  fuelSavings: decimal('fuel_savings', { precision: 8, scale: 2 }).default('0.00'),
  timeSavings: int('time_savings').default(0), // minutes
  applied: boolean('applied').default(false),
  appliedAt: datetime('applied_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const demand_forecasting = mysqlTable('demand_forecasting', {
  id: int('id').autoincrement().primaryKey(),
  routeId: int('route_id').references(() => routes.id).notNull(),
  forecastDate: date('forecast_date').notNull(),
  predictedPassengerCount: int('predicted_passenger_count').notNull(),
  confidenceLevel: decimal('confidence_level', { precision: 5, scale: 2 }),
  accuracy: decimal('accuracy', { precision: 5, scale: 2 }),
  factors: text('factors'), // JSON
  createdAt: timestamp('created_at').defaultNow(),
});

export const predictive_maintenance_ai = mysqlTable('predictive_maintenance_ai', {
  id: int('id').autoincrement().primaryKey(),
  vehicleId: int('vehicle_id').references(() => vehicles.id).notNull(),
  predictionDate: date('prediction_date').notNull(),
  component: varchar('component', { length: 100 }).notNull(),
  issueProbability: decimal('issue_probability', { precision: 5, scale: 2 }).notNull(),
  urgencyLevel: mysqlEnum('urgency_level', ['low', 'medium', 'high', 'critical']).notNull(),
  recommendedAction: text('recommended_action'),
  status: varchar('status', { length: 50 }).default('predicted'),
  confidenceScore: decimal('confidence_score', { precision: 5, scale: 2 }),
  estimatedCost: decimal('estimated_cost', { precision: 10, scale: 2 }),
  resolvedAt: datetime('resolved_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const passenger_behavior_analytics = mysqlTable('passenger_behavior_analytics', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  tripId: int('trip_id').references(() => trips.id),
  routeId: int('route_id').references(() => routes.id),
  boardingTime: datetime('boarding_time').notNull(),
  satisfactionScore: int('satisfaction_score'),
  loyaltyScore: int('loyalty_score'),
  deviceType: varchar('device_type', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const smart_notifications = mysqlTable('smart_notifications', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').references(() => users.id).notNull(),
  notificationType: varchar('notification_type', { length: 100 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  priority: mysqlEnum('priority', ['low', 'medium', 'high', 'urgent']).default('medium'),
  channels: text('channels'), // JSON array
  status: varchar('status', { length: 50 }).default('pending'),
  scheduledAt: datetime('scheduled_at'),
  sentAt: datetime('sent_at'),
  responseRequired: boolean('response_required').default(false),
  metadata: text('metadata'), // JSON
  createdAt: timestamp('created_at').defaultNow(),
});

export const payment_transactions = mysqlTable('payment_transactions', {
  id: int('id').autoincrement().primaryKey(),
  transactionReference: varchar('transaction_reference', { length: 100 }).unique().notNull(),
  userId: int('user_id').references(() => users.id).notNull(),
  transactionType: varchar('transaction_type', { length: 100 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('NGN'),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(),
  paymentGateway: varchar('payment_gateway', { length: 50 }),
  gatewayTransactionId: varchar('gateway_transaction_id', { length: 100 }),
  status: varchar('status', { length: 50 }).default('pending'),
  metadata: text('metadata'), // JSON
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const mobile_app_analytics = mysqlTable('mobile_app_analytics', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').references(() => users.id),
  sessionId: varchar('sessionId', { length: 100 }),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  screenName: varchar('screen_name', { length: 100 }),
  eventData: text('event_data'), // JSON
  deviceInfo: text('device_info'), // JSON
  appVersion: varchar('app_version', { length: 50 }),
  sessionDuration: int('session_duration'), // seconds
  timestamp: timestamp('timestamp').defaultNow(),
});

export const mobile_app_sessions = mysqlTable('mobile_app_sessions', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').references(() => users.id).notNull(),
  deviceType: varchar('device_type', { length: 50 }).notNull(),
  deviceId: varchar('device_id', { length: 255 }).notNull(),
  appVersion: varchar('app_version', { length: 50 }),
  pushToken: text('push_token'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  isActive: boolean('is_active').default(true),
  lastActive: timestamp('last_active').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

// --- VISITOR MANAGEMENT ---
export const visitors = mysqlTable('visitors', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  idNumber: varchar('id_number', { length: 50 }),
  company: varchar('company', { length: 255 }),
  purpose: varchar('purpose', { length: 255 }).notNull(),
  hostId: int('host_id').references(() => users.id),
  hostName: varchar('host_name', { length: 255 }),
  departmentId: int('department_id').references(() => departments.id),
  facultyId: int('faculty_id').references(() => faculties.id),
  unitId: int('unit_id').references(() => institutionalUnits.id),
  expectedArrival: datetime('expected_arrival'),
  expectedDeparture: datetime('expected_departure'),
  actualArrival: datetime('actual_arrival'),
  actualDeparture: datetime('actual_departure'),
  status: mysqlEnum('status', ['pending', 'approved', 'checked_in', 'checked_out', 'cancelled']).default('pending'),
  qrCode: varchar('qr_code', { length: 500 }),
  notes: text('notes'),
  createdBy: int('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const visitor_access_log = mysqlTable('visitor_access_log', {
  id: int('id').autoincrement().primaryKey(),
  visitorId: int('visitor_id').references(() => visitors.id),
  accessType: mysqlEnum('access_type', ['check_in', 'check_out', 'exit_denied']).notNull(),
  timestamp: timestamp('timestamp').defaultNow(),
  gate: varchar('gate', { length: 50 }),
  securityOfficer: varchar('security_officer', { length: 255 }),
  notes: text('notes'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
});

export const visitor_destinations = mysqlTable('visitor_destinations', {
  id: int('id').autoincrement().primaryKey(),
  visitorId: int('visitor_id').references(() => visitors.id),
  destinationType: mysqlEnum('destination_type', ['office', 'laboratory', 'library', 'classroom', 'other']).notNull(),
  destinationName: varchar('destination_name', { length: 255 }).notNull(),
  destinationId: int('destination_id'),
  facultyId: int('faculty_id').references(() => faculties.id),
  departmentId: int('department_id').references(() => departments.id),
  unitId: int('unit_id').references(() => institutionalUnits.id),
  visitStartTime: datetime('visit_start_time'),
  visitEndTime: datetime('visit_end_time'),
  purpose: varchar('purpose', { length: 255 }),
  status: mysqlEnum('status', ['pending', 'approved', 'completed', 'cancelled']).default('pending'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Visitor relations
export const visitorsRelations = relations(visitors, ({ one, many }) => ({
  host: one(users, {
    fields: [visitors.hostId],
    references: [users.id],
  }),
  department: one(departments, {
    fields: [visitors.departmentId],
    references: [departments.id],
  }),
  faculty: one(faculties, {
    fields: [visitors.facultyId],
    references: [faculties.id],
  }),
  unit: one(institutionalUnits, {
    fields: [visitors.unitId],
    references: [institutionalUnits.id],
  }),
  creator: one(users, {
    fields: [visitors.createdBy],
    references: [users.id],
  }),
  accessLogs: many(visitor_access_log),
  destinations: many(visitor_destinations),
}));

export const visitorAccessLogRelations = relations(visitor_access_log, ({ one }) => ({
  visitor: one(visitors, {
    fields: [visitor_access_log.visitorId],
    references: [visitors.id],
  }),
}));



export const visitorDestinationsRelations = relations(visitor_destinations, ({ one }) => ({
  visitor: one(visitors, {
    fields: [visitor_destinations.visitorId],
    references: [visitors.id],
  }),
  faculty: one(faculties, {
    fields: [visitor_destinations.facultyId],
    references: [faculties.id],
  }),
  department: one(departments, {
    fields: [visitor_destinations.departmentId],
    references: [departments.id],
  }),
  unit: one(institutionalUnits, {
    fields: [visitor_destinations.unitId],
    references: [institutionalUnits.id],
  }),
}));





// --- ALUMNI MODULE ---

export const alumniProfiles = mysqlTable('alumni_profiles', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').references(() => users.id).unique().notNull(),
  graduationYear: int('graduation_year').notNull(),
  currentCompany: varchar('current_company', { length: 255 }),
  currentPosition: varchar('current_position', { length: 255 }),
  linkedInUrl: varchar('linkedin_url', { length: 500 }),
  isVerified: boolean('is_verified').default(false),
  verifiedAt: datetime('verified_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const alumniRelations = relations(alumniProfiles, ({ one }) => ({
  user: one(users, {
    fields: [alumniProfiles.userId],
    references: [users.id],
  }),
}));

export const parentsRelations = relations(parents, ({ one }) => ({
  user: one(users, {
    fields: [parents.userId],
    references: [users.id],
  }),
}));

export const parentStudentMappingsRelations = relations(parentStudentMappings, ({ one }) => ({
  parent: one(users, {
    fields: [parentStudentMappings.parentId],
    references: [users.id],
  }),
  student: one(students, {
    fields: [parentStudentMappings.studentId],
    references: [students.id],
  }),
}));

export const crmLeadsRelations = relations(crmLeads, ({ one, many }) => ({
  programme: one(programmes, {
    fields: [crmLeads.programmeId],
    references: [programmes.id],
  }),
  unit: one(institutionalUnits, {
    fields: [crmLeads.unitId],
    references: [institutionalUnits.id],
  }),
  assignedStaff: one(users, {
    fields: [crmLeads.assignedStaffId],
    references: [users.id],
  }),
  interactions: many(crmLeadInteractions),
}));

export const crmLeadInteractionsRelations = relations(crmLeadInteractions, ({ one }) => ({
  lead: one(crmLeads, {
    fields: [crmLeadInteractions.leadId],
    references: [crmLeads.id],
  }),
  staff: one(users, {
    fields: [crmLeadInteractions.staffId],
    references: [users.id],
  }),
}));

// --- INVENTORY & STOCK MANAGEMENT ---
export const inventoryCategories = mysqlTable('inventory_categories', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
});

export const inventorySuppliers = mysqlTable('inventory_suppliers', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  contactPerson: varchar('contact_person', { length: 255 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
});

export const inventoryItems = mysqlTable('inventory_items', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  sku: varchar('sku', { length: 50 }).unique(),
  categoryId: int('category_id').references(() => inventoryCategories.id),
  unitOfMeasure: varchar('unit_of_measure', { length: 50 }).default('pcs'),
  quantityInStock: decimal('quantity_in_stock', { precision: 12, scale: 2 }).default('0.00'),
  reorderLevel: decimal('reorder_level', { precision: 12, scale: 2 }).default('10.00'),
  unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).default('0.00'),
  unitId: int('unit_id').references(() => institutionalUnits.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const inventoryTransactions = mysqlTable('inventory_transactions', {
  id: int('id').autoincrement().primaryKey(),
  itemId: int('item_id').references(() => inventoryItems.id).notNull(),
  quantity: decimal('quantity', { precision: 12, scale: 2 }).notNull(),
  type: mysqlEnum('type', ['purchase', 'issuance', 'adjustment', 'return']).notNull(),
  supplierId: int('supplier_id').references(() => inventorySuppliers.id),
  recipientId: int('recipient_id').references(() => users.id),
  recordedBy: int('recorded_by').references(() => users.id).notNull(),
  notes: text('notes'),
  transactionDate: timestamp('transaction_date').defaultNow(),
});

// Relations
export const inventoryItemsRelations = relations(inventoryItems, ({ one, many }) => ({
  category: one(inventoryCategories, {
    fields: [inventoryItems.categoryId],
    references: [inventoryCategories.id],
  }),
  unit: one(institutionalUnits, {
    fields: [inventoryItems.unitId],
    references: [institutionalUnits.id],
  }),
  transactions: many(inventoryTransactions),
}));

export const inventoryTransactionsRelations = relations(inventoryTransactions, ({ one }) => ({
  item: one(inventoryItems, {
    fields: [inventoryTransactions.itemId],
    references: [inventoryItems.id],
  }),
  supplier: one(inventorySuppliers, {
    fields: [inventoryTransactions.supplierId],
    references: [inventorySuppliers.id],
  }),
  recipient: one(users, {
    fields: [inventoryTransactions.recipientId],
    references: [users.id],
  }),
  recorder: one(users, {
    fields: [inventoryTransactions.recordedBy],
    references: [users.id],
  }),
}));

// --- ACADEMIC CALENDAR & EVENT SCHEDULING ---
export const academicCalendarEvents = mysqlTable('academic_calendar_events', {
  id: int('id').autoincrement().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  startDate: datetime('start_date').notNull(),
  endDate: datetime('end_date').notNull(),
  type: mysqlEnum('type', ['academic', 'holiday', 'exam', 'meeting', 'social', 'other']).default('academic'),
  targetAudience: mysqlEnum('target_audience', ['everyone', 'students', 'staff', 'parents']).default('everyone'),
  unitId: int('unit_id').references(() => institutionalUnits.id), // For multi-branch specific events
  isPublic: boolean('is_public').default(true),
  color: varchar('color', { length: 20 }).default('#4F46E5'), // Indigo default
  createdBy: int('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const academicCalendarMilestones = mysqlTable('academic_calendar_milestones', {
  id: int('id').autoincrement().primaryKey(),
  sessionId: int('session_id').references(() => academicSessions.id).notNull(),
  term: mysqlEnum('term', ['1', '2', '3']).notNull(),
  milestoneName: varchar('milestone_name', { length: 255 }).notNull(), // e.g., "Registration Deadline"
  date: date('date').notNull(),
  description: text('description'),
  isMandatory: boolean('is_mandatory').default(true),
});

// Relations
export const academicCalendarEventsRelations = relations(academicCalendarEvents, ({ one }) => ({
  unit: one(institutionalUnits, {
    fields: [academicCalendarEvents.unitId],
    references: [institutionalUnits.id],
  }),
  creator: one(users, {
    fields: [academicCalendarEvents.createdBy],
    references: [users.id],
  }),
}));

export const academicCalendarMilestonesRelations = relations(academicCalendarMilestones, ({ one }) => ({
  session: one(academicSessions, {
    fields: [academicCalendarMilestones.sessionId],
    references: [academicSessions.id],
  }),
}));



// --- GAMIFICATION & ENGAGEMENT MODULE ---
export const gamificationStats = mysqlTable('gamification_stats', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).unique().notNull(),
  level: int('level').default(1),
  currentXp: int('current_xp').default(0),
  totalXp: int('total_xp').default(0),
  eduCoins: int('edu_coins').default(0),
  streakDays: int('streak_days').default(0),
  lastActivityDate: date('last_activity_date'),
  unlockedThemes: text('unlocked_themes'), // JSON array: ["dark", "neon"]
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const xpTransactions = mysqlTable('xp_transactions', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  amount: int('amount').notNull(),
  reason: varchar('reason', { length: 255 }).notNull(), // e.g., "quiz_completion", "daily_attendance"
  metadata: text('metadata'), // e.g., quizId
  createdAt: timestamp('created_at').defaultNow(),
});

export const badges = mysqlTable('badges', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 50 }), // lucide icon name
  rarity: mysqlEnum('rarity', ['common', 'rare', 'epic', 'legendary']).default('common'),
  criteria: text('criteria'), // JSON logic
});

export const badgesRelations = relations(badges, ({ many }) => ({
  issuedBadges: many(gamificationIssuedBadges),
}));

export const gamificationIssuedBadges = mysqlTable('gamification_issued_badges', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  badgeId: int('badge_id').references(() => badges.id).notNull(),
  issuedAt: timestamp('issued_at').defaultNow(),
});

// Relations for Gamification
export const gamificationStatsRelations = relations(gamificationStats, ({ one }) => ({
  student: one(students, {
    fields: [gamificationStats.studentId],
    references: [students.id],
  }),
}));

export const xpTransactionsRelations = relations(xpTransactions, ({ one }) => ({
  student: one(students, {
    fields: [xpTransactions.studentId],
    references: [students.id],
  }),
}));

export const gamificationIssuedBadgesRelations = relations(gamificationIssuedBadges, ({ one }) => ({
  student: one(students, {
    fields: [gamificationIssuedBadges.studentId],
    references: [students.id],
  }),
  badge: one(badges, {
    fields: [gamificationIssuedBadges.badgeId],
    references: [badges.id],
  }),
}));

// --- INTELLIGENT TUTORING SYSTEM (ITS) & CURRICULUM ---

export const curriculumFrameworks = mysqlTable('curriculum_frameworks', {
    id: int('id').autoincrement().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(), // e.g. "NERDC 2024", "NUC CCMAS 2023"
    level: mysqlEnum('level', ['primary', 'secondary', 'university', 'polytechnic', 'coe']).notNull(),
    regulatoryBody: varchar('regulatory_body', { length: 100 }), // NERDC, NUC, NBTE, NCCE
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow(),
});

export const curriculumDisciplines = mysqlTable('curriculum_disciplines', {
    id: int('id').autoincrement().primaryKey(),
    frameworkId: int('framework_id').references(() => curriculumFrameworks.id).notNull(),
    name: varchar('name', { length: 255 }).notNull(), // e.g. "Computing", "Medical Sciences"
    code: varchar('code', { length: 20 }),
});

export const curriculumTopics = mysqlTable('curriculum_topics', {
    id: int('id').autoincrement().primaryKey(),
    disciplineId: int('discipline_id').references(() => curriculumDisciplines.id),
    frameworkId: int('framework_id').references(() => curriculumFrameworks.id),
    level: int('level').notNull(), // 100, 200 or Primary 1, 2
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    order: int('order').default(0),
});

export const curriculumOutcomes = mysqlTable('curriculum_outcomes', {
    id: int('id').autoincrement().primaryKey(),
    topicId: int('topic_id').references(() => curriculumTopics.id).notNull(),
    type: mysqlEnum('type', ['objective', 'competency', 'standard', 'outcome']).default('objective'),
    description: text('description').notNull(),
});

export const lessons = mysqlTable('lessons', {
    id: int('id').autoincrement().primaryKey(),
    topicId: int('topic_id').references(() => curriculumTopics.id).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    type: mysqlEnum('type', ['video', 'animation', 'interactive', 'text', 'audio']).default('video'),
    contentUrl: varchar('content_url', { length: 500 }),
    aiScript: text('ai_script'), // Script for the ITS to read
    durationMinutes: int('duration_minutes'),
    isOfflineReady: boolean('is_offline_ready').default(false),
    createdAt: timestamp('created_at').defaultNow(),
});

export const itsSessions = mysqlTable('its_sessions', {
    id: int('id').autoincrement().primaryKey(),
    studentId: int('student_id').references(() => students.id),
    lessonId: int('lesson_id').references(() => lessons.id),
    status: mysqlEnum('status', ['started', 'paused', 'completed']).default('started'),
    engagementScore: int('engagement_score'), // 0-100 based on interaction/vision
    attendanceJson: text('attendance_json'), // For classroom mode facial recognition logs
    startedAt: timestamp('started_at').defaultNow(),
    completedAt: datetime('completed_at'),
});

export const curriculumFrameworksRelations = relations(curriculumFrameworks, ({ many }) => ({
    disciplines: many(curriculumDisciplines),
}));

export const curriculumDisciplinesRelations = relations(curriculumDisciplines, ({ one, many }) => ({
    framework: one(curriculumFrameworks, {
        fields: [curriculumDisciplines.frameworkId],
        references: [curriculumFrameworks.id],
    }),
    topics: many(curriculumTopics),
}));

export const curriculumTopicsRelations = relations(curriculumTopics, ({ one, many }) => ({
    discipline: one(curriculumDisciplines, {
        fields: [curriculumTopics.disciplineId],
        references: [curriculumDisciplines.id],
    }),
    outcomes: many(curriculumOutcomes),
    lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one }) => ({
    topic: one(curriculumTopics, {
        fields: [lessons.topicId],
        references: [curriculumTopics.id],
    }),
}));

export const itsQuestions = mysqlTable('its_questions', {
    id: int('id').autoincrement().primaryKey(),
    lessonId: int('lesson_id').references(() => lessons.id).notNull(),
    question: text('question').notNull(),
    options: text('options'), // JSON string for multiple choice
    correctAnswer: varchar('correct_answer', { length: 255 }),
    type: mysqlEnum('type', ['multiple_choice', 'true_false', 'short_answer']).default('multiple_choice'),
    triggerTimeSeconds: int('trigger_time_seconds'), // When during the lesson to show this
});

export const itsResponses = mysqlTable('its_responses', {
    id: int('id').autoincrement().primaryKey(),
    sessionId: int('session_id').references(() => itsSessions.id).notNull(),
    studentId: int('student_id').references(() => students.id).notNull(),
    questionId: int('question_id').references(() => itsQuestions.id).notNull(),
    response: text('response').notNull(),
    isCorrect: boolean('is_correct').default(false),
    responseTimeSeconds: int('response_time_seconds'),
    createdAt: timestamp('created_at').defaultNow(),
});

export const itsQuestionsRelations = relations(itsQuestions, ({ one, many }) => ({
    lesson: one(lessons, {
        fields: [itsQuestions.lessonId],
        references: [lessons.id],
    }),
    responses: many(itsResponses),
}));

export const itsResponsesRelations = relations(itsResponses, ({ one }) => ({
    session: one(itsSessions, {
        fields: [itsResponses.sessionId],
        references: [itsSessions.id],
    }),
    student: one(students, {
        fields: [itsResponses.studentId],
        references: [students.id],
    }),
    question: one(itsQuestions, {
        fields: [itsResponses.questionId],
        references: [itsQuestions.id],
    }),
}));

export const admissionFormTemplates = mysqlTable('admission_form_templates', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  level: mysqlEnum('level', ['primary', 'secondary', 'tertiary']).notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  description: text('description'),
  flowType: mysqlEnum('flow_type', ['payment_first', 'form_first', 'free_form']).default('form_first'),
  feeStructureId: int('fee_structure_id').references(() => feeStructures.id),
  applicationFee: decimal('application_fee', { precision: 12, scale: 2 }).default('0.00'),
  lateFee: decimal('late_fee', { precision: 12, scale: 2 }).default('0.00'),
  requireAcceptanceFee: boolean('require_acceptance_fee').default(false),
  acceptanceFee: decimal('acceptance_fee', { precision: 12, scale: 2 }).default('0.00'),
  admissionLetterTemplate: text('admission_letter_template'),
  startDate: datetime('start_date').notNull(),
  endDate: datetime('end_date').notNull(),
  lateEndDate: datetime('late_end_date'),
  minAge: int('min_age'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const admissionFormSections = mysqlTable('admission_form_sections', {
  id: int('id').autoincrement().primaryKey(),
  templateId: int('template_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  order: int('order').default(0),
}, (table) => ({
  tmplFk: foreignKey({
    name: 'adm_frm_sec_tmpl_id_fk',
    columns: [table.templateId],
    foreignColumns: [admissionFormTemplates.id],
  }),
}));

export const admissionFormFields = mysqlTable('admission_form_fields', {
  id: int('id').autoincrement().primaryKey(),
  sectionId: int('section_id').references(() => admissionFormSections.id).notNull(),
  label: varchar('label', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // text, select, date, file, email, number
  placeholder: varchar('placeholder', { length: 255 }),
  options: text('options'), // JSON for select options
  isRequired: boolean('is_required').default(false),
  order: int('order').default(0),
  isSystemField: boolean('is_system_field').default(false),
  systemKey: varchar('system_key', { length: 100 }), // e.g. "firstName", "dob"
});
export const admissionApplicationsV2 = mysqlTable('admission_applications_v2', {
  id: int('id').autoincrement().primaryKey(),
  templateId: int('template_id').notNull(),
  applicantId: int('applicant_id').references(() => users.id),
  studentId: int('student_id').references(() => students.id),
  status: mysqlEnum('status', ['draft', 'submitted', 'paid', 'screened', 'admitted', 'rejected']).default('draft'),
  paymentStatus: mysqlEnum('payment_status', ['pending', 'paid', 'failed']).default('pending'),
  paymentReference: varchar('payment_reference', { length: 100 }),
  data: text('data'), // Dynamic JSON answers
  nin: varchar('nin', { length: 11 }).unique(),
  applicantPhoto: varchar('applicant_photo', { length: 255 }),
  ageAtAdmission: int('age_at_admission'),
  editFineStatus: mysqlEnum('edit_fine_status', ['none', 'pending', 'paid']).default('none'),
  editFineReference: varchar('edit_fine_reference', { length: 100 }),
  editWindowExpiresAt: datetime('edit_window_expires_at'),
  admissionNotes: text('admission_notes'),
  pin: varchar('pin', { length: 255 }), // Hashed or plaintext PIN for candidate portal access
  acceptancePaymentStatus: mysqlEnum('acceptance_payment_status', ['pending', 'paid', 'not_applicable']).default('pending'),
  appliedAt: timestamp('applied_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  tmplFk: foreignKey({
    name: 'adm_apps_v2_tmpl_id_fk',
    columns: [table.templateId],
    foreignColumns: [admissionFormTemplates.id],
  }),
}));

export const admissionEntranceExams = mysqlTable('admission_entrance_exams', {
  id: int('id').autoincrement().primaryKey(),
  templateId: int('template_id').notNull(),
  examDate: datetime('exam_date').notNull(),
  duration: int('duration_minutes').notNull(),
  instructions: text('instructions'),
  quizId: int('quiz_id'), // Link to CBT module
  showResultsInstantly: boolean('show_results_instantly').default(false),
  resultsReleased: boolean('results_released').default(false),
}, (table) => ({
  tmplFk: foreignKey({
    name: 'adm_ent_exm_tmpl_id_fk',
    columns: [table.templateId],
    foreignColumns: [admissionFormTemplates.id],
  }),
}));

export const admissionFormTemplatesRelations = relations(admissionFormTemplates, ({ many }) => ({
    sections: many(admissionFormSections),
    applications: many(admissionApplicationsV2),
    exams: many(admissionEntranceExams),
}));

export const admissionFormSectionsRelations = relations(admissionFormSections, ({ one, many }) => ({
    template: one(admissionFormTemplates, {
        fields: [admissionFormSections.templateId],
        references: [admissionFormTemplates.id],
    }),
    fields: many(admissionFormFields),
}));

export const admissionFormFieldsRelations = relations(admissionFormFields, ({ one }) => ({
    section: one(admissionFormSections, {
        fields: [admissionFormFields.sectionId],
        references: [admissionFormSections.id],
    }),
}));

export const admissionApplicationsV2Relations = relations(admissionApplicationsV2, ({ one }) => ({
    template: one(admissionFormTemplates, {
        fields: [admissionApplicationsV2.templateId],
        references: [admissionFormTemplates.id],
    }),
    student: one(students, {
        fields: [admissionApplicationsV2.studentId],
        references: [students.id],
    }),
}));

export const admissionEntranceExamsRelations = relations(admissionEntranceExams, ({ one }) => ({
    template: one(admissionFormTemplates, {
        fields: [admissionEntranceExams.templateId],
        references: [admissionFormTemplates.id],
    }),
}));

export const admissionExamSubjects = mysqlTable('admission_exam_subjects', {
  id: int('id').autoincrement().primaryKey(),
  examId: int('exam_id').references(() => admissionEntranceExams.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(), // e.g. Mathematics, English
  questionCount: int('question_count').default(0),
  marksPerQuestion: decimal('marks_per_question', { precision: 5, scale: 2 }).default('1.00'),
});

export const admissionExamQuestions = mysqlTable('admission_exam_questions', {
  id: int('id').autoincrement().primaryKey(),
  subjectId: int('subject_id').notNull(),
  questionText: text('question_text').notNull(),
  questionType: mysqlEnum('question_type', ['multiple_choice', 'true_false', 'matching']).default('multiple_choice'),
  options: text('options'), // JSON string for options/matching pairs
  correctAnswer: text('correct_answer').notNull(),
  explanation: text('explanation'),
  imagePath: varchar('image_path', { length: 255 }),
}, (table) => ({
  subFk: foreignKey({
    name: 'adm_exm_q_sub_id_fk',
    columns: [table.subjectId],
    foreignColumns: [admissionExamSubjects.id],
  }),
}));

export const admissionExamResults = mysqlTable('admission_exam_results', {
  id: int('id').autoincrement().primaryKey(),
  applicationId: int('application_id').notNull(),
  examId: int('exam_id').references(() => admissionEntranceExams.id).notNull(),
  subjectScores: text('subject_scores'), // JSON mapping subjectId to score
  totalScore: decimal('total_score', { precision: 5, scale: 2 }).default('0.00'),
  startTime: datetime('start_time'),
  endTime: datetime('end_time'),
  status: mysqlEnum('status', ['started', 'completed', 'flagged']).default('started'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  appFk: foreignKey({
    name: 'adm_exm_res_app_id_fk',
    columns: [table.applicationId],
    foreignColumns: [admissionApplicationsV2.id],
  }),
}));

export const admissionExamSubjectsRelations = relations(admissionExamSubjects, ({ one, many }) => ({
    exam: one(admissionEntranceExams, {
        fields: [admissionExamSubjects.examId],
        references: [admissionEntranceExams.id],
    }),
    questions: many(admissionExamQuestions),
}));

export const admissionExamQuestionsRelations = relations(admissionExamQuestions, ({ one }) => ({
    subject: one(admissionExamSubjects, {
        fields: [admissionExamQuestions.subjectId],
        references: [admissionExamSubjects.id],
    }),
}));

export const admissionExamResultsRelations = relations(admissionExamResults, ({ one }) => ({
    application: one(admissionApplicationsV2, {
        fields: [admissionExamResults.applicationId],
        references: [admissionApplicationsV2.id],
    }),
    exam: one(admissionEntranceExams, {
        fields: [admissionExamResults.examId],
        references: [admissionEntranceExams.id],
    }),
}));

// --- SPORTS & ATHLETICS MODULE ---
export const sportsTeams = mysqlTable('sports_teams', {
  id: int('id').autoincrement().primaryKey(),
  unitId: int('unit_id').references(() => institutionalUnits.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(), // e.g. Football, Basketball
  gender: mysqlEnum('gender', ['male', 'female', 'mixed']).default('mixed'),
  coachId: int('coach_id').references(() => users.id),
  description: text('description'),
  imageUrl: varchar('image_url', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const sportsTeamMembers = mysqlTable('sports_team_members', {
  id: int('id').autoincrement().primaryKey(),
  teamId: int('team_id').references(() => sportsTeams.id, { onDelete: 'cascade' }).notNull(),
  studentId: int('student_id').references(() => users.id).notNull(),
  position: varchar('position', { length: 100 }), // e.g. Striker, Point Guard
  jerseyNumber: int('jersey_number'),
  status: mysqlEnum('status', ['active', 'injured', 'inactive']).default('active'),
  joinedAt: timestamp('joined_at').defaultNow(),
});

export const sportsFixtures = mysqlTable('sports_fixtures', {
  id: int('id').autoincrement().primaryKey(),
  unitId: int('unit_id').references(() => institutionalUnits.id).notNull(),
  teamId: int('team_id').references(() => sportsTeams.id).notNull(),
  opponent: varchar('opponent', { length: 255 }).notNull(),
  venue: varchar('venue', { length: 255 }).notNull(),
  matchType: mysqlEnum('match_type', ['home', 'away', 'neutral']).default('home'),
  scheduledAt: datetime('scheduled_at').notNull(),
  status: mysqlEnum('status', ['scheduled', 'ongoing', 'completed', 'cancelled']).default('scheduled'),
  scoreHome: int('score_home').default(0),
  scoreAway: int('score_away').default(0),
  resultNote: text('result_note'), // Summary of the match
  liveFeedUrl: text('live_feed_url'), // Link to external live scores if applicable
});

export const sportsInventory = mysqlTable('sports_inventory', {
  id: int('id').autoincrement().primaryKey(),
  unitId: int('unit_id').references(() => institutionalUnits.id).notNull(),
  itemName: varchar('item_name', { length: 255 }).notNull(),
  totalQuantity: int('total_quantity').default(0),
  availableQuantity: int('available_quantity').default(0),
  condition: varchar('condition', { length: 100 }).default('good'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const sportsMedia = mysqlTable('sports_media', {
  id: int('id').autoincrement().primaryKey(),
  unitId: int('unit_id').references(() => institutionalUnits.id).notNull(),
  teamId: int('team_id').references(() => sportsTeams.id),
  fixtureId: int('fixture_id').references(() => sportsFixtures.id),
  type: mysqlEnum('type', ['photo', 'video']).default('photo'),
  url: text('url').notNull(),
  caption: text('caption'),
  isFeatured: boolean('is_featured').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const systemModules = mysqlTable('system_modules', {
    id: int('id').autoincrement().primaryKey(),
    key: varchar('key', { length: 100 }).unique().notNull(), // e.g. "its", "gamification", "parent_portal"
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    isEnabled: boolean('is_enabled').default(true),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const matriculationSettings = mysqlTable('matriculation_settings', {
  id: int('id').autoincrement().primaryKey(),
  unitId: int('unit_id').references(() => institutionalUnits.id),
  facultyId: int('faculty_id').references(() => faculties.id),
  deptId: int('dept_id').references(() => departments.id),
  nomenclature: varchar('nomenclature', { length: 100 }).default('Matriculation Number'), // or Admission Number
  format: varchar('format', { length: 255 }).notNull(), // e.g. {DEPT_CODE}/{YEAR}/{SERIAL}
  serialStart: int('serial_start').default(1),
  serialPadding: int('serial_padding').default(3), // e.g. 3 for 001
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const matriculationSequences = mysqlTable('matriculation_sequences', {
  id: int('id').autoincrement().primaryKey(),
  settingId: int('setting_id').references(() => matriculationSettings.id).notNull(),
  year: int('year').notNull(),
  currentSerial: int('current_serial').default(0),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  unq: unique().on(table.settingId, table.year),
}));

export const matriculationSettingsRelations = relations(matriculationSettings, ({ one }) => ({
  unit: one(institutionalUnits, {
    fields: [matriculationSettings.unitId],
    references: [institutionalUnits.id],
  }),
  faculty: one(faculties, {
    fields: [matriculationSettings.facultyId],
    references: [faculties.id],
  }),
  department: one(departments, {
    fields: [matriculationSettings.deptId],
    references: [departments.id],
  }),
}));

export const matriculationSequencesRelations = relations(matriculationSequences, ({ one }) => ({
  setting: one(matriculationSettings, {
    fields: [matriculationSequences.settingId],
    references: [matriculationSettings.id],
  }),
}));

// --- BURSARY: DIRECT PAYMENTS ---
export const directPayments = mysqlTable('direct_payments', {
  id: int('id').autoincrement().primaryKey(),
  transactionNumber: varchar('transaction_number', { length: 100 }).unique().notNull(),
  studentId: int('student_id').references(() => students.id),
  branchId: int('branch_id').references(() => institutionalUnits.id).notNull(),
  operatorId: int('operator_id').references(() => users.id).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).default('0.00'),
  tellerNumber: varchar('teller_number', { length: 100 }),
  remark: text('remark'),
  excelUploadId: int('excel_upload_id').references(() => excelUploads.id),
  status: mysqlEnum('status', ['active', 'nullified']).default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const excelUploads = mysqlTable('excel_uploads', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  filename: varchar('filename', { length: 255 }).notNull(),
  userId: int('user_id').references(() => users.id).notNull(),
  branchId: int('branch_id').references(() => institutionalUnits.id).notNull(),
  totalRows: int('total_rows').default(0),
  processedRows: int('processed_rows').default(0),
  status: mysqlEnum('status', ['pending', 'processing', 'completed', 'failed', 'deleted']).default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const directPaymentsRelations = relations(directPayments, ({ one }) => ({
  student: one(students, {
    fields: [directPayments.studentId],
    references: [students.id],
  }),
  branch: one(institutionalUnits, {
    fields: [directPayments.branchId],
    references: [institutionalUnits.id],
  }),
  operator: one(users, {
    fields: [directPayments.operatorId],
    references: [users.id],
  }),
  excelUpload: one(excelUploads, {
    fields: [directPayments.excelUploadId],
    references: [excelUploads.id],
  }),
}));

export const excelUploadsRelations = relations(excelUploads, ({ one, many }) => ({
  user: one(users, {
    fields: [excelUploads.userId],
    references: [users.id],
  }),
  branch: one(institutionalUnits, {
    fields: [excelUploads.branchId],
    references: [institutionalUnits.id],
  }),
  transactions: many(directPayments),
}));

// --- BURSARY: FINANCE PREFERENCES ---
export const financePreferences = mysqlTable('finance_preferences', {
  id: int('id').autoincrement().primaryKey(),
  sessionId: int('session_id').references(() => academicSessions.id).notNull(),
  branchId: int('branch_id').references(() => institutionalUnits.id).notNull(),
  data: text('data').notNull(), // JSON blob for preferences
  updatedBy: int('updated_by').references(() => users.id).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  unq: unique().on(table.sessionId, table.branchId),
}));

export const financePreferencesRelations = relations(financePreferences, ({ one }) => ({
  session: one(academicSessions, {
    fields: [financePreferences.sessionId],
    references: [academicSessions.id],
  }),
  branch: one(institutionalUnits, {
    fields: [financePreferences.branchId],
    references: [institutionalUnits.id],
  }),
  user: one(users, {
    fields: [financePreferences.updatedBy],
    references: [users.id],
  }),
}));

// --- UNIVERSITY FINANCIALS: STAFF LOANS & ADVANCES ---

export const loanTemplates = mysqlTable('loan_templates', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(), // e.g., "Vehicle Loan", "House Support Loan"
  description: text('description'),
  category: mysqlEnum('category', ['personal', 'housing', 'vehicle', 'other']).default('other'),
  fieldConfig: text('field_config').notNull(), // JSON: Array<{ label, name, type, required }>
  interestRate: decimal('interest_rate', { precision: 5, scale: 2 }).default('0.00'),
  minAmount: decimal('min_amount', { precision: 12, scale: 2 }),
  maxAmount: decimal('max_amount', { precision: 12, scale: 2 }),
  repaymentPeriodMax: int('repayment_period_max').default(12),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const staffLoans = mysqlTable('staff_loans', {
  id: int('id').autoincrement().primaryKey(),
  staffId: int('staff_id').references(() => staffProfiles.id).notNull(),
  templateId: int('template_id').references(() => loanTemplates.id).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  repaymentPeriodMonths: int('repayment_period_months').notNull(),
  customData: text('custom_data'), // JSON blob for dynamic field values
  interestRate: decimal('interest_rate', { precision: 5, scale: 2 }).default('0.00'),
  status: mysqlEnum('status', ['pending', 'approved', 'disbursed', 'rejected', 'completed']).default('pending'),
  disbursementDate: datetime('disbursement_date'),
  approvedBy: int('approved_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const cashAdvances = mysqlTable('cash_advances', {
  id: int('id').autoincrement().primaryKey(),
  staffId: int('staff_id').references(() => staffProfiles.id).notNull(),
  purpose: text('purpose').notNull(), // e.g. "Office Project A", "International Conference"
  requestedAmount: decimal('requested_amount', { precision: 12, scale: 2 }).notNull(),
  approvedAmount: decimal('approved_amount', { precision: 12, scale: 2 }),
  status: mysqlEnum('status', ['requested', 'approved', 'disbursed', 'retired', 'audited', 'rejected']).default('requested'),
  disbursementDate: datetime('disbursement_date'),
  retirementDeadline: datetime('retirement_deadline'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const cashAdvanceRetirements = mysqlTable('cash_advance_retirements', {
  id: int('id').autoincrement().primaryKey(),
  advanceId: int('advance_id').references(() => cashAdvances.id).notNull(),
  totalSpent: decimal('total_spent', { precision: 12, scale: 2 }).notNull(),
  balanceReturned: decimal('balance_returned', { precision: 12, scale: 2 }).default('0.00'),
  status: mysqlEnum('status', ['pending', 'audited', 'rejected']).default('pending'),
  auditorComments: text('auditor_comments'),
  retiredAt: timestamp('retired_at').defaultNow(),
});

export const cashAdvanceReceipts = mysqlTable('cash_advance_receipts', {
  id: int('id').autoincrement().primaryKey(),
  retirementId: int('retirement_id').notNull(),
  description: varchar('description', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  receiptUrl: text('receipt_url'), // Link to S3/Wasabi
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  retFk: foreignKey({
    name: 'cash_adv_rcpt_ret_id_fk',
    columns: [table.retirementId],
    foreignColumns: [cashAdvanceRetirements.id],
  }),
}));

// --- AUDIT MODULE ---

export const auditVerifications = mysqlTable('audit_verifications', {
  id: int('id').autoincrement().primaryKey(),
  entityType: mysqlEnum('entity_type', ['voucher', 'retirement', 'payroll', 'inventory']).notNull(),
  entityId: int('entity_id').notNull(), // Links to PV ID, Retirement ID, etc.
  auditorId: int('auditor_id').references(() => users.id).notNull(),
  decision: mysqlEnum('decision', ['verified', 'flagged', 'rejected']).notNull(),
  findings: text('findings'),
  recommendation: text('recommendation'),
  verifiedAt: timestamp('verified_at').defaultNow(),
});

// Relations for the new tables

export const staffLoansRelations = relations(staffLoans, ({ one }) => ({
  staff: one(staffProfiles, { fields: [staffLoans.staffId], references: [staffProfiles.id] }),
  template: one(loanTemplates, { fields: [staffLoans.templateId], references: [loanTemplates.id] }),
  approver: one(users, { fields: [staffLoans.approvedBy], references: [users.id] }),
}));

export const loanTemplatesRelations = relations(loanTemplates, ({ many }) => ({
  loans: many(staffLoans),
}));

export const cashAdvancesRelations = relations(cashAdvances, ({ one, many }) => ({
  staff: one(staffProfiles, { fields: [cashAdvances.staffId], references: [staffProfiles.id] }),
  retirements: many(cashAdvanceRetirements),
}));

export const cashAdvanceRetirementsRelations = relations(cashAdvanceRetirements, ({ one, many }) => ({
  advance: one(cashAdvances, { fields: [cashAdvanceRetirements.advanceId], references: [cashAdvances.id] }),
  receipts: many(cashAdvanceReceipts),
}));

export const auditVerificationsRelations = relations(auditVerifications, ({ one }) => ({
  auditor: one(users, { fields: [auditVerifications.auditorId], references: [users.id] }),
}));
export const schoolFunctions = mysqlTable('school_functions', {
  id: int('id').autoincrement().primaryKey(),
  branchId: int('branch_id').references(() => institutionalUnits.id).notNull(),
  property: varchar('property', { length: 255 }).notNull(), // e.g. "tuition_fee_logic"
  value: text('value').notNull(), // The actual script/code
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  branchPropIdx: uniqueIndex('branch_prop_idx').on(table.branchId, table.property),
}));

export const schoolFunctionsRelations = relations(schoolFunctions, ({ one }) => ({
  branch: one(institutionalUnits, { fields: [schoolFunctions.branchId], references: [institutionalUnits.id] }),
}));

export const tenantNodes = mysqlTable('tenant_nodes', {
  id: int('id').autoincrement().primaryKey(),
  nodeId: varchar('node_id', { length: 100 }).unique().notNull(),
  hostname: varchar('hostname', { length: 255 }).unique().notNull(),
  dbName: varchar('db_name', { length: 100 }).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const phdApplications = mysqlTable('phd_applications', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  researchTitle: varchar('research_title', { length: 500 }).notNull(),
  status: varchar('status', { length: 100 }).default('applied'), // 'applied', 'supervisors_pending', 'supervisors_accepted', 'fees_paid', 'under_review', 'approved_corrections', 'defense_scheduled', 'completed'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const phdSupervisors = mysqlTable('phd_supervisors', {
  id: int('id').autoincrement().primaryKey(),
  phdApplicationId: int('phd_application_id').references(() => phdApplications.id).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'internal' | 'external'
  staffProfileId: int('staff_profile_id').references(() => staffProfiles.id), // Null for external
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  token: varchar('token', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).default('pending'), // 'pending', 'accepted', 'rejected'
  invitedAt: timestamp('invited_at').defaultNow(),
  respondedAt: timestamp('responded_at'),
});

export const phdTheses = mysqlTable('phd_theses', {
  id: int('id').autoincrement().primaryKey(),
  phdApplicationId: int('phd_application_id').references(() => phdApplications.id).notNull(),
  fileUrl: text('file_url').notNull(),
  turnitinReportUrl: text('turnitin_report_url'),
  turnitinScore: int('turnitin_score'),
  status: varchar('status', { length: 100 }).default('draft'), // 'draft', 'dept_review', 'subdean_review', 'pg_committee_review', 'meeting_pending', 'approved', 'reupload_required'
  isCorrectedVersion: boolean('is_corrected_version').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const phdReviewLogs = mysqlTable('phd_review_logs', {
  id: int('id').autoincrement().primaryKey(),
  phdThesisId: int('phd_thesis_id').references(() => phdTheses.id).notNull(),
  reviewerId: int('reviewer_id').references(() => users.id).notNull(),
  stage: varchar('stage', { length: 100 }).notNull(), // 'department', 'subdean', 'pg_committee', 'provost'
  action: varchar('action', { length: 50 }).notNull(), // 'approve', 'reject'
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const phdExaminers = mysqlTable('phd_examiners', {
  id: int('id').autoincrement().primaryKey(),
  phdApplicationId: int('phd_application_id').references(() => phdApplications.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'internal', 'external'
  honorariumAmount: varchar('honorarium_amount', { length: 100 }), // String decimal
  paymentStatus: varchar('payment_status', { length: 50 }).default('pending'), // 'pending', 'approved_by_provost', 'paid'
  createdAt: timestamp('created_at').defaultNow(),
});

export const phdDefenses = mysqlTable('phd_defenses', {
  id: int('id').autoincrement().primaryKey(),
  phdApplicationId: int('phd_application_id').references(() => phdApplications.id).notNull(),
  defenseDate: timestamp('defense_date').notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).default('scheduled'), // 'scheduled', 'successful', 'failed'
  provostApprovedAt: timestamp('provost_approved_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// --- EXAMINATION BODIES & O-LEVEL RESULTS ---

export const examinationBodies = mysqlTable('examination_bodies', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(), // e.g., WAEC, NECO
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const applicantOLevelSittings = mysqlTable('applicant_olevel_sittings', {
  id: int('id').autoincrement().primaryKey(),
  applicantId: int('applicant_id').references(() => users.id).notNull(),
  applicationId: int('application_id').references(() => admissionApplicationsV2.id).notNull(),
  examBodyId: int('exam_body_id').references(() => examinationBodies.id).notNull(),
  examYear: varchar('exam_year', { length: 4 }).notNull(),
  examNumber: varchar('exam_number', { length: 50 }).notNull(),
  sittingNumber: int('sitting_number').notNull(), // 1 or 2
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
});

export const applicantOLevelSubjects = mysqlTable('applicant_olevel_subjects', {
  id: int('id').autoincrement().primaryKey(),
  sittingId: int('sitting_id').references(() => applicantOLevelSittings.id).notNull(),
  subjectName: varchar('subject_name', { length: 100 }).notNull(),
  grade: varchar('grade', { length: 10 }).notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

export const applicantOLevelSittingsRelations = relations(applicantOLevelSittings, ({ one, many }) => ({
    applicant: one(users, {
        fields: [applicantOLevelSittings.applicantId],
        references: [users.id],
    }),
    application: one(admissionApplicationsV2, {
        fields: [applicantOLevelSittings.applicationId],
        references: [admissionApplicationsV2.id],
    }),
    examBody: one(examinationBodies, {
        fields: [applicantOLevelSittings.examBodyId],
        references: [examinationBodies.id],
    }),
    subjects: many(applicantOLevelSubjects),
}));

export const applicantOLevelSubjectsRelations = relations(applicantOLevelSubjects, ({ one }) => ({
    sitting: one(applicantOLevelSittings, {
        fields: [applicantOLevelSubjects.sittingId],
        references: [applicantOLevelSittings.id],
    }),
}));

// --- HR AUTOMATED COMMUNICATIONS ---

export const hrMessageTemplates = mysqlTable('hr_message_templates', {
  id: int('id').autoincrement().primaryKey(),
  eventName: varchar('event_name', { length: 100 }).unique().notNull(), // e.g. "birthday_staff", "birthday_student", "work_anniversary"
  subject: varchar('subject', { length: 255 }).notNull(),
  messageBody: text('message_body').notNull(), // Supports variables like [FirstName]
  isActive: boolean('is_active').default(true),
  sendViaEmail: boolean('send_via_email').default(true),
  sendViaWhatsapp: boolean('send_via_whatsapp').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const hrScheduledMessages = mysqlTable('hr_scheduled_messages', {
  id: int('id').autoincrement().primaryKey(),
  subject: varchar('subject', { length: 255 }).notNull(),
  messageBody: text('message_body').notNull(),
  targetAudience: mysqlEnum('target_audience', ['all_staff', 'all_students', 'all_users', 'specific_user']).notNull(),
  targetUserId: int('target_user_id').references(() => users.id),
  scheduledDate: date('scheduled_date').notNull(),
  status: mysqlEnum('status', ['pending', 'sent', 'failed', 'cancelled']).default('pending'),
  sendViaEmail: boolean('send_via_email').default(true),
  sendViaWhatsapp: boolean('send_via_whatsapp').default(false),
  createdBy: int('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  sentAt: timestamp('sent_at'),
});

export const hrScheduledMessagesRelations = relations(hrScheduledMessages, ({ one }) => ({
  targetUser: one(users, { fields: [hrScheduledMessages.targetUserId], references: [users.id] }),
  creator: one(users, { fields: [hrScheduledMessages.createdBy], references: [users.id] }),
}));

// Added to resolve Next.js build module resolution errors
export const quranMemorizationLogs = mysqlTable('quran_memorization_logs', {
  id: int('id').primaryKey().autoincrement(),
});

export const reportCardRubrics = mysqlTable('report_card_rubrics', {
  id: int('id').primaryKey().autoincrement(),
});


// Added to resolve Next.js build module resolution errors
export const graduateDocumentApplications = mysqlTable('graduate_document_applications', { id: int('id').primaryKey().autoincrement() });
export const graduateProfiles = mysqlTable('graduate_profiles', { id: int('id').primaryKey().autoincrement() });
export const documentForms = mysqlTable('document_forms', { id: int('id').primaryKey().autoincrement() });
export const documentPricingRules = mysqlTable('document_pricing_rules', { id: int('id').primaryKey().autoincrement() });
export const documentTypes = mysqlTable('document_types', { id: int('id').primaryKey().autoincrement() });


export const staffAttendance = mysqlTable('staff_attendance', {
  id: int('id').autoincrement().primaryKey(),
  staffId: int('staff_id').references(() => staffProfiles.id).notNull(),
  date: date('date').notNull(),
  clockIn: datetime('clock_in'),
  clockOut: datetime('clock_out'),
  clockInIp: varchar('clock_in_ip', { length: 45 }),
  clockOutIp: varchar('clock_out_ip', { length: 45 }),
  status: mysqlEnum('status', ['present', 'absent', 'late', 'half_day']).default('present'),
});

export const staffAttendanceRelations = relations(staffAttendance, ({ one }) => ({
  staff: one(staffProfiles, {
    fields: [staffAttendance.staffId],
    references: [staffProfiles.id],
  }),
}));


export const academicCarryOvers = mysqlTable('academic_carry_overs', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  courseId: int('course_id').references(() => courses.id).notNull(),
  sessionId: int('session_id').references(() => academicSessions.id).notNull(),
  semester: mysqlEnum('semester', ['1', '2']).notNull(),
  status: mysqlEnum('status', ['pending', 'registered', 'passed', 'failed']).default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const payrollDeductionRules = mysqlTable('payroll_deduction_rules', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: mysqlEnum('type', ['fixed', 'percentage']).notNull(),
  value: varchar('value', { length: 50 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const conductLogs = mysqlTable('conduct_logs', {
  id: int('id').autoincrement().primaryKey(),
  targetType: mysqlEnum('target_type', ['student', 'staff']).notNull(),
  studentId: int('student_id').references(() => students.id),
  staffId: int('staff_id').references(() => staffProfiles.id),
  infraction: varchar('infraction', { length: 255 }).notNull(),
  description: text('description').notNull(),
  dateOfIncident: date('date_of_incident').notNull(),
  senateSanction: mysqlEnum('senate_sanction', ['none', 'warning', 'suspension', 'expulsion', 'rustication', 'termination', 'demotion']).default('none'),
  sanctionStartDate: date('sanction_start_date'),
  sanctionEndDate: date('sanction_end_date'),
  status: mysqlEnum('status', ['active', 'resolved', 'appealed']).default('active'),
  loggedBy: int('logged_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const conductLogsRelations = relations(conductLogs, ({ one }) => ({
  student: one(students, {
    fields: [conductLogs.studentId],
    references: [students.id],
  }),
  staff: one(staffProfiles, {
    fields: [conductLogs.staffId],
    references: [staffProfiles.id],
  }),
  logger: one(users, {
    fields: [conductLogs.loggedBy],
    references: [users.id],
  }),
}));

export const graduationClearances = mysqlTable('graduation_clearances', {
  id: int('id').autoincrement().primaryKey(),
  studentId: int('student_id').references(() => students.id).notNull(),
  status: mysqlEnum('status', ['pending', 'cleared', 'rejected']).default('pending'),
  libraryStatus: mysqlEnum('library_status', ['pending', 'cleared', 'rejected']).default('pending'),
  bursaryStatus: mysqlEnum('bursary_status', ['pending', 'cleared', 'rejected']).default('pending'),
  departmentStatus: mysqlEnum('department_status', ['pending', 'cleared', 'rejected']).default('pending'),
  registrarStatus: mysqlEnum('registrar_status', ['pending', 'cleared', 'rejected']).default('pending'),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const graduationClearancesRelations = relations(graduationClearances, ({ one }) => ({
  student: one(students, {
    fields: [graduationClearances.studentId],
    references: [students.id],
  }),
}));


export const medicalInventoryRelations = relations(medicalInventory, ({ many }) => ({
  dispensations: many(medicalDispensations),
}));

export const medicalDispensationsRelations = relations(medicalDispensations, ({ one }) => ({
  student: one(students, {
    fields: [medicalDispensations.studentId],
    references: [students.id],
  }),
  inventory: one(medicalInventory, {
    fields: [medicalDispensations.inventoryId],
    references: [medicalInventory.id],
  }),
  appointment: one(medicalAppointments, {
    fields: [medicalDispensations.appointmentId],
    references: [medicalAppointments.id],
  }),
  dispenser: one(users, {
    fields: [medicalDispensations.dispensedBy],
    references: [users.id],
  }),
}));

export const medicalExcusatsRelations = relations(medicalExcusats, ({ one }) => ({
  student: one(students, {
    fields: [medicalExcusats.studentId],
    references: [students.id],
  }),
  issuer: one(users, {
    fields: [medicalExcusats.issuedBy],
    references: [users.id],
  }),
}));

// --- EXTENDED ADMISSION MODULE ---
export const admissionLeads = mysqlTable('admission_leads', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  programOfInterest: varchar('program_of_interest', { length: 255 }),
  source: varchar('source', { length: 100 }), // e.g., Website, Fair, Referral
  status: mysqlEnum('status', ['new', 'contacted', 'applied', 'cold']).default('new'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const admissionWaitlists = mysqlTable('admission_waitlists', {
  id: int('id').autoincrement().primaryKey(),
  applicationId: int('application_id').references(() => admissionApplicationsV2.id).notNull(),
  rankPosition: int('rank_position'),
  status: mysqlEnum('status', ['waiting', 'offered', 'rejected']).default('waiting'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const admissionInterviews = mysqlTable('admission_interviews', {
  id: int('id').autoincrement().primaryKey(),
  applicationId: int('application_id').references(() => admissionApplicationsV2.id).notNull(),
  interviewDate: timestamp('interview_date'),
  interviewerId: int('interviewer_id').references(() => users.id),
  mode: mysqlEnum('mode', ['physical', 'virtual']).default('physical'),
  locationOrLink: varchar('location_or_link', { length: 500 }),
  status: mysqlEnum('status', ['scheduled', 'completed', 'no_show', 'cancelled']).default('scheduled'),
  score: int('score'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const admissionWaitlistsRelations = relations(admissionWaitlists, ({ one }) => ({
  application: one(admissionApplicationsV2, {
    fields: [admissionWaitlists.applicationId],
    references: [admissionApplicationsV2.id],
  }),
}));

export const admissionInterviewsRelations = relations(admissionInterviews, ({ one }) => ({
  application: one(admissionApplicationsV2, {
    fields: [admissionInterviews.applicationId],
    references: [admissionApplicationsV2.id],
  }),
  interviewer: one(users, {
    fields: [admissionInterviews.interviewerId],
    references: [users.id],
  }),
}));

// --- CENTRALIZED CBT ENGINE ---

export const cbtQuizzes = mysqlTable('cbt_quizzes', {
  id: int('id').autoincrement().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  durationMinutes: int('duration_minutes').default(60),
  randomizeQuestions: boolean('randomize_questions').default(true),
  totalMarks: decimal('total_marks', { precision: 5, scale: 2 }).default('100.00'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const cbtQuestions = mysqlTable('cbt_questions', {
  id: int('id').autoincrement().primaryKey(),
  quizId: int('quiz_id').references(() => cbtQuizzes.id).notNull(),
  questionText: text('question_text').notNull(),
  containsLatex: boolean('contains_latex').default(false),
  questionType: mysqlEnum('question_type', ['multiple_choice', 'true_false', 'short_answer']).default('multiple_choice'),
  options: text('options'), // JSON string of options
  correctAnswer: text('correct_answer').notNull(),
  marks: decimal('marks', { precision: 5, scale: 2 }).default('1.00'),
  explanation: text('explanation'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const cbtAttempts = mysqlTable('cbt_attempts', {
  id: int('id').autoincrement().primaryKey(),
  quizId: int('quiz_id').references(() => cbtQuizzes.id).notNull(),
  userId: int('user_id').references(() => users.id).notNull(),
  startTime: timestamp('start_time').defaultNow(),
  endTime: timestamp('end_time'),
  status: mysqlEnum('status', ['in_progress', 'completed', 'auto_submitted', 'flagged']).default('in_progress'),
  score: decimal('score', { precision: 5, scale: 2 }).default('0.00'),
  tabSwitches: int('tab_switches').default(0), // Anti-cheat tracker
  createdAt: timestamp('created_at').defaultNow(),
});

export const cbtResponses = mysqlTable('cbt_responses', {
  id: int('id').autoincrement().primaryKey(),
  attemptId: int('attempt_id').references(() => cbtAttempts.id).notNull(),
  questionId: int('question_id').references(() => cbtQuestions.id).notNull(),
  selectedAnswer: text('selected_answer'),
  isCorrect: boolean('is_correct').default(false),
  marksAwarded: decimal('marks_awarded', { precision: 5, scale: 2 }).default('0.00'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const cbtQuizzesRelations = relations(cbtQuizzes, ({ many }) => ({
  questions: many(cbtQuestions),
  attempts: many(cbtAttempts),
}));

export const cbtQuestionsRelations = relations(cbtQuestions, ({ one, many }) => ({
  quiz: one(cbtQuizzes, {
    fields: [cbtQuestions.quizId],
    references: [cbtQuizzes.id],
  }),
  responses: many(cbtResponses),
}));

export const cbtAttemptsRelations = relations(cbtAttempts, ({ one, many }) => ({
  quiz: one(cbtQuizzes, {
    fields: [cbtAttempts.quizId],
    references: [cbtQuizzes.id],
  }),
  user: one(users, {
    fields: [cbtAttempts.userId],
    references: [users.id],
  }),
  responses: many(cbtResponses),
}));

export const cbtResponsesRelations = relations(cbtResponses, ({ one }) => ({
  attempt: one(cbtAttempts, {
    fields: [cbtResponses.attemptId],
    references: [cbtAttempts.id],
  }),
  question: one(cbtQuestions, {
    fields: [cbtResponses.questionId],
    references: [cbtQuestions.id],
  }),
}));

// --- GRIEVANCE MODULE ---

export const grievances = mysqlTable('grievances', {
  id: int('id').autoincrement().primaryKey(),
  reporterId: int('reporter_id').references(() => users.id).notNull(), // Confidential but required
  targetId: int('target_id').references(() => users.id), // Optional, if reporting a specific person
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  evidenceUrl: varchar('evidence_url', { length: 1000 }),
  status: mysqlEnum('status', ['submitted', 'under_investigation', 'resolved', 'dismissed']).default('submitted'),
  resolutionNotes: text('resolution_notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const grievancesRelations = relations(grievances, ({ one }) => ({
  reporter: one(users, {
    fields: [grievances.reporterId],
    references: [users.id],
    relationName: "reporter_user",
  }),
  target: one(users, {
    fields: [grievances.targetId],
    references: [users.id],
    relationName: "target_user",
  }),
}));

// --- WORKS & MAINTENANCE MODULE ---

export const maintenanceStaffProfiles = mysqlTable('maintenance_staff_profiles', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').references(() => users.id).unique().notNull(),
  specialty: mysqlEnum('specialty', ['electrical', 'plumbing', 'hvac', 'carpentry', 'auto_mechanic', 'masonry', 'general']).default('general').notNull(),
  status: mysqlEnum('status', ['active', 'on_leave', 'suspended']).default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const generalMaintenanceRequests = mysqlTable('general_maintenance_requests', {
  id: int('id').autoincrement().primaryKey(),
  reporterUserId: int('reporter_user_id').references(() => users.id).notNull(),
  locationType: mysqlEnum('location_type', ['classroom', 'lab', 'office', 'hostel_common', 'sports', 'other']).notNull(),
  buildingName: varchar('building_name', { length: 255 }).notNull(),
  roomOrAreaDescription: varchar('room_or_area_description', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  category: mysqlEnum('category', ['electrical', 'plumbing', 'hvac', 'carpentry', 'masonry', 'other']).notNull(),
  priority: mysqlEnum('priority', ['low', 'medium', 'high', 'urgent']).default('medium'),
  status: mysqlEnum('status', ['pending', 'in-progress', 'resolved', 'cancelled']).default('pending'),
  assignedStaffId: int('assigned_staff_id').references(() => users.id),
  resolutionNotes: text('resolution_notes'),
  resolvedAt: datetime('resolved_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const maintenanceStaffProfilesRelations = relations(maintenanceStaffProfiles, ({ one }) => ({
  user: one(users, {
    fields: [maintenanceStaffProfiles.userId],
    references: [users.id],
  }),
}));

export const generalMaintenanceRequestsRelations = relations(generalMaintenanceRequests, ({ one }) => ({
  reporter: one(users, {
    fields: [generalMaintenanceRequests.reporterUserId],
    references: [users.id],
    relationName: "general_maint_reporter",
  }),
  assignedStaff: one(users, {
    fields: [generalMaintenanceRequests.assignedStaffId],
    references: [users.id],
    relationName: "general_maint_assigned_staff",
  }),
}));

export const maintenanceRepairQuotes = mysqlTable('maintenance_repair_quotes', {
  id: int('id').autoincrement().primaryKey(),
  requestId: int('request_id').references(() => generalMaintenanceRequests.id).notNull(),
  technicianId: int('technician_id').references(() => users.id).notNull(),
  itemDescription: varchar('item_description', { length: 255 }).notNull(),
  estimatedCost: decimal('estimated_cost', { precision: 12, scale: 2 }).notNull(),
  quoteNotes: text('quote_notes'),
  status: mysqlEnum('status', ['pending', 'approved', 'rejected']).default('pending').notNull(),
  reviewedBy: int('reviewed_by').references(() => users.id),
  reviewedAt: datetime('reviewed_at'),
  rejectionNotes: text('rejection_notes'),
  expenditureRequestId: int('expenditure_request_id').references(() => expenditureRequests.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const maintenanceRepairQuotesRelations = relations(maintenanceRepairQuotes, ({ one }) => ({
  request: one(generalMaintenanceRequests, {
    fields: [maintenanceRepairQuotes.requestId],
    references: [generalMaintenanceRequests.id],
  }),
  technician: one(users, {
    fields: [maintenanceRepairQuotes.technicianId],
    references: [users.id],
    relationName: "quote_technician",
  }),
  reviewer: one(users, {
    fields: [maintenanceRepairQuotes.reviewedBy],
    references: [users.id],
    relationName: "quote_reviewer",
  }),
  expenditureRequest: one(expenditureRequests, {
    fields: [maintenanceRepairQuotes.expenditureRequestId],
    references: [expenditureRequests.id],
  }),
}));

// --- SECURITY UNIT TABLES ---
export const securityVehicles = mysqlTable('security_vehicles', {
  id: int('id').autoincrement().primaryKey(),
  ownerId: int('owner_id').references(() => users.id),
  ownerName: varchar('owner_name', { length: 255 }).notNull(),
  ownerType: mysqlEnum('owner_type', ['student', 'staff', 'visitor', 'other']).notNull(),
  licensePlate: varchar('license_plate', { length: 50 }).notNull(),
  vehicleMake: varchar('vehicle_make', { length: 100 }).notNull(),
  vehicleModel: varchar('vehicle_model', { length: 100 }).notNull(),
  vehicleColor: varchar('vehicle_color', { length: 50 }).notNull(),
  passNumber: varchar('pass_number', { length: 100 }).unique().notNull(),
  status: mysqlEnum('status', ['pending', 'approved', 'expired', 'revoked']).default('pending').notNull(),
  qrCode: varchar('qr_code', { length: 500 }),
  expiresAt: datetime('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const securityVehicleLogs = mysqlTable('security_vehicle_logs', {
  id: int('id').autoincrement().primaryKey(),
  vehicleId: int('vehicle_id').references(() => securityVehicles.id).notNull(),
  gateName: varchar('gate_name', { length: 100 }).notNull(),
  direction: mysqlEnum('direction', ['entry', 'exit']).notNull(),
  securityOfficerId: int('security_officer_id').references(() => users.id).notNull(),
  timestamp: timestamp('timestamp').defaultNow(),
});

export const securityStrategicPositions = mysqlTable('security_strategic_positions', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).unique().notNull(),
  description: text('description'),
  qrCode: varchar('qr_code', { length: 255 }).unique().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const securityPatrolLogs = mysqlTable('security_patrol_logs', {
  id: int('id').autoincrement().primaryKey(),
  checkpointId: int('checkpoint_id').references(() => securityStrategicPositions.id).notNull(),
  patrolOfficerId: int('patrol_officer_id').references(() => users.id).notNull(),
  notes: text('notes'),
  gpsCoordinates: varchar('gps_coordinates', { length: 100 }),
  scannedAt: timestamp('scanned_at').defaultNow(),
});

export const securityIncidents = mysqlTable('security_incidents', {
  id: int('id').autoincrement().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  incidentType: mysqlEnum('incident_type', ['theft', 'trespass', 'property_damage', 'assault', 'accident', 'fire_hazard', 'medical_emergency', 'other']).notNull(),
  severity: mysqlEnum('severity', ['low', 'medium', 'high', 'critical']).notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  reportedBy: int('reported_by').references(() => users.id).notNull(),
  status: mysqlEnum('status', ['reported', 'under_investigation', 'resolved', 'closed']).default('reported').notNull(),
  resolutionNotes: text('resolution_notes'),
  resolvedAt: datetime('resolved_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// Relations
export const securityVehiclesRelations = relations(securityVehicles, ({ one, many }) => ({
  owner: one(users, { fields: [securityVehicles.ownerId], references: [users.id] }),
  logs: many(securityVehicleLogs),
}));

export const securityVehicleLogsRelations = relations(securityVehicleLogs, ({ one }) => ({
  vehicle: one(securityVehicles, { fields: [securityVehicleLogs.vehicleId], references: [securityVehicles.id] }),
  officer: one(users, { fields: [securityVehicleLogs.securityOfficerId], references: [users.id] }),
}));

export const securityPatrolLogsRelations = relations(securityPatrolLogs, ({ one }) => ({
  checkpoint: one(securityStrategicPositions, { fields: [securityPatrolLogs.checkpointId], references: [securityStrategicPositions.id] }),
  officer: one(users, { fields: [securityPatrolLogs.patrolOfficerId], references: [users.id] }),
}));

export const securityIncidentsRelations = relations(securityIncidents, ({ one }) => ({
  officer: one(users, { fields: [securityIncidents.reportedBy], references: [users.id] }),
}));

// --- STUDENT AFFAIRS MODULE ---

export const studentAffairsEvents = mysqlTable('student_affairs_events', {
  id: int('id').autoincrement().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  startDate: datetime('start_date').notNull(),
  endDate: datetime('end_date').notNull(),
  createdBy: int('created_by').references(() => users.id).notNull(),
  capacity: int('capacity'),
  isPaid: boolean('is_paid').default(false).notNull(),
  fee: decimal('fee', { precision: 12, scale: 2 }),
  status: mysqlEnum('status', ['scheduled', 'cancelled', 'completed']).default('scheduled').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const studentAffairsEventRegistrations = mysqlTable('student_affairs_event_registrations', {
  id: int('id').autoincrement().primaryKey(),
  eventId: int('event_id').references(() => studentAffairsEvents.id).notNull(),
  userId: int('user_id').references(() => users.id).notNull(),
  registeredAt: timestamp('registered_at').defaultNow(),
  status: mysqlEnum('status', ['registered', 'cancelled']).default('registered').notNull(),
  paymentStatus: mysqlEnum('payment_status', ['pending', 'paid', 'no_payment_required']).default('no_payment_required').notNull(),
  transactionId: int('transaction_id').references(() => transactions.id),
  checkedIn: boolean('checked_in').default(false).notNull(),
  checkedInAt: timestamp('checked_in_at'),
});

export const studentAffairsClubs = mysqlTable('student_affairs_clubs', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).unique().notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  presidentId: int('president_id').references(() => users.id).notNull(),
  advisorId: int('advisor_id').references(() => users.id),
  logoUrl: varchar('logo_url', { length: 500 }),
  status: mysqlEnum('status', ['pending', 'approved', 'rejected', 'suspended']).default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const studentAffairsClubMembers = mysqlTable('student_affairs_club_members', {
  id: int('id').autoincrement().primaryKey(),
  clubId: int('club_id').references(() => studentAffairsClubs.id).notNull(),
  studentId: int('student_id').references(() => students.id).notNull(),
  role: mysqlEnum('role', ['president', 'secretary', 'treasurer', 'member', 'pending']).default('pending').notNull(),
  joinedAt: timestamp('joined_at').defaultNow(),
});

export const studentAffairsBulletins = mysqlTable('student_affairs_bulletins', {
  id: int('id').autoincrement().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  category: mysqlEnum('category', ['academic', 'social', 'sports', 'announcement']).default('announcement').notNull(),
  status: mysqlEnum('status', ['draft', 'published']).default('draft').notNull(),
  authorId: int('author_id').references(() => users.id).notNull(),
  publishedAt: datetime('published_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// Relations
export const studentAffairsEventsRelations = relations(studentAffairsEvents, ({ one, many }) => ({
  creator: one(users, { fields: [studentAffairsEvents.createdBy], references: [users.id] }),
  registrations: many(studentAffairsEventRegistrations),
}));

export const studentAffairsEventRegistrationsRelations = relations(studentAffairsEventRegistrations, ({ one }) => ({
  event: one(studentAffairsEvents, { fields: [studentAffairsEventRegistrations.eventId], references: [studentAffairsEvents.id] }),
  user: one(users, { fields: [studentAffairsEventRegistrations.userId], references: [users.id] }),
  transaction: one(transactions, { fields: [studentAffairsEventRegistrations.transactionId], references: [transactions.id] }),
}));

export const studentAffairsClubsRelations = relations(studentAffairsClubs, ({ one, many }) => ({
  president: one(users, { fields: [studentAffairsClubs.presidentId], references: [users.id] }),
  advisor: one(users, { fields: [studentAffairsClubs.advisorId], references: [users.id] }),
  members: many(studentAffairsClubMembers),
}));

export const studentAffairsClubMembersRelations = relations(studentAffairsClubMembers, ({ one }) => ({
  club: one(studentAffairsClubs, { fields: [studentAffairsClubMembers.clubId], references: [studentAffairsClubs.id] }),
  student: one(students, { fields: [studentAffairsClubMembers.studentId], references: [students.id] }),
}));

export const studentAffairsBulletinsRelations = relations(studentAffairsBulletins, ({ one }) => ({
  author: one(users, { fields: [studentAffairsBulletins.authorId], references: [users.id] }),
}));

export const supportTickets = mysqlTable('support_tickets', {
  id: int('id').autoincrement().primaryKey(),
  ticketNumber: varchar('ticket_number', { length: 50 }).unique().notNull(),
  userId: int('user_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  category: mysqlEnum('category', ['technical', 'academic', 'financial', 'hostel', 'administrative', 'other']).default('technical'),
  priority: mysqlEnum('priority', ['low', 'medium', 'high', 'urgent']).default('low'),
  status: mysqlEnum('status', ['open', 'in_progress', 'resolved', 'closed']).default('open'),
  assignedToId: int('assigned_to_id').references(() => staffProfiles.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  resolvedAt: timestamp('resolved_at'),
});

export const supportTicketMessages = mysqlTable('support_ticket_messages', {
  id: int('id').autoincrement().primaryKey(),
  ticketId: int('ticket_id').references(() => supportTickets.id).notNull(),
  senderId: int('sender_id').references(() => users.id).notNull(),
  messageText: text('message_text').notNull(),
  attachmentUrl: varchar('attachment_url', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// Support Ticket Relations
export const supportTicketsRelations = relations(supportTickets, ({ one, many }) => ({
  user: one(users, { fields: [supportTickets.userId], references: [users.id] }),
  assignedTo: one(staffProfiles, { fields: [supportTickets.assignedToId], references: [staffProfiles.id] }),
  messages: many(supportTicketMessages),
}));

export const supportTicketMessagesRelations = relations(supportTicketMessages, ({ one }) => ({
  ticket: one(supportTickets, { fields: [supportTicketMessages.ticketId], references: [supportTickets.id] }),
  sender: one(users, { fields: [supportTicketMessages.senderId], references: [users.id] }),
}));
