$sql = @"
SELECT u.name, u.email, u.phone 
FROM admission_applications_v2 a 
JOIN users u ON a.applicant_id = u.id 
JOIN admission_form_templates t ON a.template_id = t.id 
LEFT JOIN students s ON u.id = s.user_id 
WHERE t.name LIKE '%HND%' AND s.id IS NULL AND u.email NOT LIKE '%fssibadan.edu.ng%';
"@
Set-Content -Path "query.sql" -Value $sql
scp query.sql deploy@147.93.84.90:/tmp/query.sql
ssh -o BatchMode=yes deploy@147.93.84.90 "docker compose -f /var/www/school-portal/docker-compose.yml exec -T school-portal-db mysql -uportal_user -pStrongPassword123! school_portal < /tmp/query.sql"
