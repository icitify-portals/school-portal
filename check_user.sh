#!/bin/bash
cd /var/www/school-portal
DB_PASS=$(grep DATABASE_URL .env | cut -d ':' -f3 | cut -d '@' -f1)
docker compose exec -T school-portal-db mysql -u root -p"$DB_PASS" school_portal -e "SELECT id, email, password, requires_password_change, role FROM users WHERE email = 'adekunleabdullah@gmail.com';"
