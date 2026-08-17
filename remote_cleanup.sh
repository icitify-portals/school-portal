#!/bin/bash
cd /var/www/school-portal
DB_PASS=$(grep DATABASE_URL .env | cut -d ':' -f3 | cut -d '@' -f1)
docker compose exec -T school-portal-db mysql -u root -p"$DB_PASS" school_portal < revert_stu_2026.sql
echo "Cleanup completed."
