cd /var/www/school-portal
docker exec school-portal-app npx tsx src/db/query.ts "SELECT id, status, payment_status, acceptance_payment_status, processing_fee_status FROM admission_applications_v2 WHERE applicant_id = (SELECT id FROM users WHERE email = 'admin@icitifysolution.com');"
