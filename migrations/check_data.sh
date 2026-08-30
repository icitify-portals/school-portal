#!/bin/bash
# Check existing data in CBT/quizzes/admission tables
echo "=== CBT Quizzes ==="
mysql -uroot -pRootPassword123! school_portal -e "SELECT COUNT(*) as cnt FROM cbt_quizzes" 2>/dev/null

echo "=== CBT Questions ==="
mysql -uroot -pRootPassword123! school_portal -e "SELECT COUNT(*) as cnt FROM cbt_questions" 2>/dev/null

echo "=== CBT Attempts ==="
mysql -uroot -pRootPassword123! school_portal -e "SELECT COUNT(*) as cnt FROM cbt_attempts" 2>/dev/null

echo "=== LMS Quizzes ==="
mysql -uroot -pRootPassword123! school_portal -e "SELECT COUNT(*) as cnt FROM quizzes" 2>/dev/null

echo "=== Quiz Questions ==="
mysql -uroot -pRootPassword123! school_portal -e "SELECT COUNT(*) as cnt FROM quiz_questions" 2>/dev/null

echo "=== Quiz Attempts ==="
mysql -uroot -pRootPassword123! school_portal -e "SELECT COUNT(*) as cnt FROM quiz_attempts" 2>/dev/null

echo "=== Admission Entrance Exams ==="
mysql -uroot -pRootPassword123! school_portal -e "SELECT COUNT(*) as cnt FROM admission_entrance_exams" 2>/dev/null

echo "=== Admission Exam Questions ==="
mysql -uroot -pRootPassword123! school_portal -e "SELECT COUNT(*) as cnt FROM admission_exam_questions" 2>/dev/null

echo "=== Admission Exam Results ==="
mysql -uroot -pRootPassword123! school_portal -e "SELECT COUNT(*) as cnt FROM admission_exam_results" 2>/dev/null

echo "=== Unified Exams (target) ==="
mysql -uroot -pRootPassword123! school_portal -e "SELECT COUNT(*) as cnt FROM unified_exams" 2>/dev/null

echo "=== Global Question Banks ==="
mysql -uroot -pRootPassword123! school_portal -e "SELECT * FROM global_question_banks" 2>/dev/null
