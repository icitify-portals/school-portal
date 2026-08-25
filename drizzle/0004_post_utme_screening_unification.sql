-- 0004: Post-UTME screening unification (Phase 1)
-- Single selection criterion = Post-UTME screening (Math + English /200 -> %)
-- Per-exercise cut-off stored on the template (ND/HND can differ). Default 40%.
-- Run manually on production if not using drizzle-kit push.

-- ── Per-exercise settings on templates ──────────────────────────────
ALTER TABLE `admission_form_templates`
  ADD COLUMN IF NOT EXISTS `id_card_fee` decimal(12,2) DEFAULT '0.00';
--> statement-breakpoint
ALTER TABLE `admission_form_templates`
  ADD COLUMN IF NOT EXISTS `cutoff_percent` decimal(5,2) DEFAULT '40.00';

-- ── Screening results + decision audit on applications ─────────────
ALTER TABLE `admission_applications_v2`
  ADD COLUMN IF NOT EXISTS `math_score` decimal(5,2);
--> statement-breakpoint
ALTER TABLE `admission_applications_v2`
  ADD COLUMN IF NOT EXISTS `english_score` decimal(5,2);
--> statement-breakpoint
ALTER TABLE `admission_applications_v2`
  ADD COLUMN IF NOT EXISTS `screening_score` decimal(5,2) COMMENT 'Combined Math + English total (/200)';
--> statement-breakpoint
ALTER TABLE `admission_applications_v2`
  ADD COLUMN IF NOT EXISTS `screening_percentage` decimal(5,2) COMMENT '(screening_score / 200) * 100';
--> statement-breakpoint
ALTER TABLE `admission_applications_v2`
  ADD COLUMN IF NOT EXISTS `decision_source` enum('auto','manual') COMMENT 'How admitted/rejected was decided';
--> statement-breakpoint
-- Exam attendance (added in 242b498 but never applied to some environments)
ALTER TABLE `admission_applications_v2`
  ADD COLUMN IF NOT EXISTS `exam_attendance_status` enum('pending','present','absent') DEFAULT 'pending';

-- ── Global default cut-off for newly created exercises ─────────────
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`)
VALUES ('post_utme_cutoff_percent', '40', 'Default Post-UTME screening cut-off (%) applied to newly created admission exercises')
ON DUPLICATE KEY UPDATE `setting_value` = `setting_value`;
