#!/bin/bash
grep -v 'NEXT_PUBLIC_ALATPAY_API_KEY_MAIN=' /var/www/school-portal/.env > /var/www/school-portal/.env.tmp
echo 'NEXT_PUBLIC_ALATPAY_API_KEY_MAIN="1132c914d20e4d56b111f22f597fdbfb"' >> /var/www/school-portal/.env.tmp
mv /var/www/school-portal/.env.tmp /var/www/school-portal/.env
cd /var/www/school-portal
docker compose down school-portal-app
docker compose up -d school-portal-app
