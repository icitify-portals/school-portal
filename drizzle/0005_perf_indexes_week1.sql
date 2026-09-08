-- 0005: Week 1 performance indexes (menu latency, bursary transactions, notifications, admission lists)
-- Safe, idempotent via conditional logic handled by app startup check; run manually: mysql -u portal_user -p school_portal < drizzle/0005_perf_indexes_week1.sql

-- students: level/programme filters + session + health
CREATE INDEX idx_students_status_level_type ON students (status, current_level, programme_type);
CREATE INDEX idx_students_session ON students (current_session_id);
CREATE INDEX idx_students_status ON students (status);

-- notifications: bell badge & polling (user_id, is_read, created_at)
CREATE INDEX idx_notif_user_read_created ON notifications (user_id, is_read, created_at DESC);

-- broadcast_messages: history ORDER BY created_at
CREATE INDEX idx_broadcast_created ON broadcast_messages (created_at DESC);

-- admission_applications_v2: admin lists, filters, counts
CREATE INDEX idx_adm_status ON admission_applications_v2 (status);
CREATE INDEX idx_adm_payment ON admission_applications_v2 (payment_status);
CREATE INDEX idx_adm_template ON admission_applications_v2 (template_id);
CREATE INDEX idx_adm_programme ON admission_applications_v2 (programme_id);
CREATE INDEX idx_adm_applicant ON admission_applications_v2 (applicant_id);
CREATE INDEX idx_adm_student ON admission_applications_v2 (student_id);
CREATE INDEX idx_adm_applied ON admission_applications_v2 (applied_at DESC);
CREATE INDEX idx_adm_template_status ON admission_applications_v2 (template_id, status);
CREATE INDEX idx_adm_exam_attendance ON admission_applications_v2 (exam_attendance_status);

-- transactions: unified transactions, ledger, RRR lookup
CREATE INDEX idx_tx_student_status_created ON transactions (student_id, status, created_at DESC);
CREATE INDEX idx_tx_gwref ON transactions (gateway_reference);
CREATE INDEX idx_tx_rrr ON transactions (rrr);
CREATE INDEX idx_tx_created ON transactions (created_at DESC);

-- wallet / payment transactions
CREATE INDEX idx_ptype_status_created ON payment_transactions (transaction_type, status, created_at DESC);
CREATE INDEX idx_wallet_student_status_created ON wallet_transactions (student_id, status, created_at DESC);

-- student ledger / enrollments
CREATE INDEX idx_ledger_student_created ON student_ledger (student_id, created_at DESC);
CREATE INDEX idx_enroll_student_session_sem ON enrollments (student_id, session_id, semester);

-- studentBills
CREATE INDEX idx_bills_student ON student_bills (student_id);
