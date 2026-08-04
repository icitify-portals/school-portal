#!/bin/bash
grep -v 'ALATPAY_SECRET_KEY_MAIN=' /var/www/school-portal/.env | grep -v 'ALATPAY_WEBHOOK_KEY_MAIN=' > /var/www/school-portal/.env.tmp
echo 'ALATPAY_SECRET_KEY_MAIN="53c38de3692c4a48a52d790a5c86a62d"' >> /var/www/school-portal/.env.tmp
echo 'ALATPAY_WEBHOOK_KEY_MAIN="2c32e1fd62719579fccbb6f8b4622d6a"' >> /var/www/school-portal/.env.tmp
mv /var/www/school-portal/.env.tmp /var/www/school-portal/.env
cd /var/www/school-portal
docker compose down school-portal-app
docker compose up -d school-portal-app
