-- 0004: Post-UTME screening unification (Phases 1-3)
-- Single selection criterion = Post-UTME screening (Math + English /200 -> %).
-- Per-exercise cut-off stored on the template (ND/HND can differ). Default 40%.
--
-- CANONICAL VERSION - applied manually to production (MySQL 8.0) on 2026-08-25.
-- Written for MySQL 8 syntax (no ADD COLUMN IF NOT EXISTS - that is MariaDB-only).
-- Local dev MariaDB already aligned via db:push equivalents.
--
-- NOTE: production also carried pre-existing drift that this migration fixes:
--   * admission_applications_v2 had camelCase leftovers (programmeId, processingFeeStatus,
--     processingFeeReference) and form_data instead of data; missing form_number,
--     application_number, form_hash, application_mode, jamb_reg_number.
--   * admission_form_templates had processingFee/processingFeeLabel instead of snake_case;
--     missing nin_verification_config.

-- ── admission_applications_v2: align to src/db/schema.ts ───────────
ALTER TABLE `admission_applications_v2` CHANGE COLUMN `form_data` `data` longtext;
ALTER TABLE `admission_applications_v2` RENAME COLUMN `programmeId` TO `programme_id`;
ALTER TABLE `admission_applications_v2` CHANGE COLUMN `processingFeeStatus` `processing_fee_status` ENUM('pending','paid','failed') DEFAULT 'pending';
ALTER TABLE `admission_applications_v2` CHANGE COLUMN `processingFeeReference` `processing_fee_reference` varchar(100);
ALTER TABLE `admission_applications_v2` ADD COLUMN `form_number` varchar(50) UNIQUE;
ALTER TABLE `admission_applications_v2` ADD COLUMN `application_number` varchar(50) UNIQUE;
ALTER TABLE `admission_applications_v2` ADD COLUMN `form_hash` varchar(64);
ALTER TABLE `admission_applications_v2` ADD COLUMN `application_mode` ENUM('full_time','part_time');
ALTER TABLE `admission_applications_v2` ADD COLUMN `jamb_reg_number` varchar(20);
ALTER TABLE `admission_applications_v2` ADD COLUMN `exam_attendance_status` ENUM('pending','present','absent') DEFAULT 'pending';
ALTER TABLE `admission_applications_v2` ADD COLUMN `math_score` decimal(5,2);
ALTER TABLE `admission_applications_v2` ADD COLUMN `english_score` decimal(5,2);
ALTER TABLE `admission_applications_v2` ADD COLUMN `screening_score` decimal(5,2) COMMENT 'Combined Math + English total (/200)';
ALTER TABLE `admission_applications_v2` ADD COLUMN `screening_percentage` decimal(5,2) COMMENT '(screening_score / 200) * 100';
ALTER TABLE `admission_applications_v2` ADD COLUMN `decision_source` ENUM('auto','manual') COMMENT 'How admitted/rejected was decided';

-- ── admission_form_templates: exercise-level settings ──────────────
ALTER TABLE `admission_form_templates` CHANGE COLUMN `processingFee` `processing_fee` decimal(12,2) DEFAULT '0.00';
ALTER TABLE `admission_form_templates` CHANGE COLUMN `processingFeeLabel` `processing_fee_label` varchar(255) DEFAULT 'Processing Fee';
ALTER TABLE `admission_form_templates` ADD COLUMN `nin_verification_config` text;
ALTER TABLE `admission_form_templates` ADD COLUMN `id_card_fee` decimal(12,2) DEFAULT '0.00';
ALTER TABLE `admission_form_templates` ADD COLUMN `cutoff_percent` decimal(5,2) DEFAULT '40.00';

-- ── Global default cut-off for newly created exercises ─────────────
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`)
VALUES ('post_utme_cutoff_percent', '40', 'Default Post-UTME screening cut-off (%) applied to newly created admission exercises')
ON DUPLICATE KEY UPDATE `setting_value` = `setting_value`;
