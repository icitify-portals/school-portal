#!/bin/bash
DB="school_portal"
MYSQL="mysql -uroot -pRootPassword123! $DB 2>/dev/null"

echo "=== DUPLICATE EMAILS ==="
$MYSQL -e "SELECT email, COUNT(*) as count, GROUP_CONCAT(id SEPARATOR ',') as ids FROM users WHERE email IS NOT NULL AND email != '' GROUP BY LOWER(email) HAVING COUNT(*) > 1 ORDER BY count DESC;"

echo ""
echo "=== DUPLICATE MATRIC NUMBERS ==="
$MYSQL -e "SELECT matric_number, COUNT(*) as count, GROUP_CONCAT(id SEPARATOR ',') as ids FROM students WHERE matric_number IS NOT NULL AND matric_number != '' GROUP BY matric_number HAVING COUNT(*) > 1 ORDER BY count DESC;"

echo ""
echo "=== DUPLICATE NAMES (same first + last + programme_type) ==="
$MYSQL -e "SELECT first_name, last_name, programme_type, COUNT(*) as count, GROUP_CONCAT(id SEPARATOR ',') as ids FROM students WHERE first_name IS NOT NULL AND last_name IS NOT NULL GROUP BY LOWER(first_name), LOWER(last_name), programme_type HAVING COUNT(*) > 1 ORDER BY count DESC LIMIT 30;"

echo ""
echo "=== ORPHAN STUDENTS (no linked user) ==="
$MYSQL -e "SELECT COUNT(*) as orphan_count FROM students s LEFT JOIN users u ON s.user_id = u.id WHERE u.id IS NULL;"

echo ""
echo "=== SUMMARY ==="
$MYSQL -e "SELECT (SELECT COUNT(*) FROM students) as total_students, (SELECT COUNT(*) FROM users WHERE role='student') as total_student_users;"
