#!/bin/bash
# Seed default global question bank with the correct admin user ID
ADMIN_ID=$(mysql -uroot -pRootPassword123! school_portal -N -e "SELECT id FROM users WHERE email LIKE '%admin%' OR role='admin' LIMIT 1" 2>/dev/null)
echo "Found admin user ID: $ADMIN_ID"
mysql -uroot -pRootPassword123! school_portal 2>/dev/null <<EOF
INSERT IGNORE INTO global_question_banks (name, description, created_by_id) 
VALUES ('General Question Bank', 'Default global question bank for all exams', $ADMIN_ID);

-- Migrate the 1 LMS quiz with 2 questions into unified_exams
INSERT IGNORE INTO unified_exams (title, description, duration_minutes, total_marks, passing_score, context_type, course_id, is_active, created_by_id)
SELECT q.title, q.description, q.time_limit_minutes, q.max_points, q.passing_score, 'course', q.course_id, 1, $ADMIN_ID
FROM quizzes q
WHERE NOT EXISTS (SELECT 1 FROM unified_exams WHERE title = q.title AND context_type = 'course');

INSERT IGNORE INTO unified_exam_questions (exam_id, question_text, question_type, options, correct_answer, points, explanation, display_order)
SELECT ue.id, qq.question_text, qq.type, qq.options, qq.correct_answer, qq.points, qq.explanation, qq.display_order
FROM quiz_questions qq
JOIN quizzes q ON qq.quiz_id = q.id
JOIN unified_exams ue ON ue.title = q.title AND ue.context_type = 'course'
WHERE NOT EXISTS (SELECT 1 FROM unified_exam_questions WHERE exam_id = ue.id AND question_text = qq.question_text);

SELECT 'Unified exams after migration:' as status;
SELECT context_type, COUNT(*) as cnt FROM unified_exams GROUP BY context_type;
SELECT 'Unified questions:' as status;
SELECT COUNT(*) as total FROM unified_exam_questions;
EOF
