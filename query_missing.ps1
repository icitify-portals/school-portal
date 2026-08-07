$sql = @"
SELECT u.id, u.name, u.email, u.phone FROM users u JOIN students s ON u.id = s.user_id 
WHERE (u.name LIKE '%Jimoh%' AND u.name LIKE '%Naimot%') 
   OR (u.name LIKE '%Sangogade%' AND u.name LIKE '%John%') 
   OR (u.name LIKE '%HAKEEM%' AND u.name LIKE '%SHULLIAKHO%');
"@
Set-Content -Path "query_missing.sql" -Value $sql
scp query_missing.sql deploy@147.93.84.90:/tmp/query_missing.sql
ssh -o BatchMode=yes deploy@147.93.84.90 "docker compose -f /var/www/school-portal/docker-compose.yml exec -T school-portal-db mysql -uportal_user -pStrongPassword123! school_portal < /tmp/query_missing.sql"
