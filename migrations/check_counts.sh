#!/bin/bash
# Check if old tables exist and have data
mysql -uroot -pRootPassword123! school_portal 2>/dev/null <<'EOF'
SELECT 'cbt_quizzes' as tbl, COUNT(*) as cnt FROM cbt_quizzes
UNION ALL SELECT 'cbt_questions', COUNT(*) FROM cbt_questions
UNION ALL SELECT 'cbt_attempts', COUNT(*) FROM cbt_attempts
UNION ALL SELECT 'cbt_responses', COUNT(*) FROM cbt_responses
UNION ALL SELECT 'quizzes', COUNT(*) FROM quizzes
UNION ALL SELECT 'quiz_questions', COUNT(*) FROM quiz_questions
UNION ALL SELECT 'quiz_attempts', COUNT(*) FROM quiz_attempts
UNION ALL SELECT 'quiz_responses', COUNT(*) FROM quiz_responses
UNION ALL SELECT 'admission_entrance_exams', COUNT(*) FROM admission_entrance_exams
UNION ALL SELECT 'admission_exam_questions', COUNT(*) FROM admission_exam_questions
UNION ALL SELECT 'admission_exam_results', COUNT(*) FROM admission_exam_results
UNION ALL SELECT 'unified_exams', COUNT(*) FROM unified_exams
UNION ALL SELECT 'unified_exam_questions', COUNT(*) FROM unified_exam_questions
UNION ALL SELECT 'unified_exam_attempts', COUNT(*) FROM unified_exam_attempts
UNION ALL SELECT 'global_question_banks', COUNT(*) FROM global_question_banks
;
EOF
