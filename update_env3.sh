#!/bin/bash
grep -v 'NEXT_PUBLIC_ALATPAY_API_KEY_MAIN=' /var/www/school-portal/.env | grep -v 'ALATPAY_SECRET_KEY_MAIN=' | grep -v 'ALATPAY_WEBHOOK_KEY_MAIN=' > /var/www/school-portal/.env.tmp
echo 'NEXT_PUBLIC_ALATPAY_API_KEY_MAIN="01b86183964c4f1fb4654990bc48e969"' >> /var/www/school-portal/.env.tmp
echo 'ALATPAY_SECRET_KEY_MAIN="9d1291db25c14a2ebf98a26eb77504cc"' >> /var/www/school-portal/.env.tmp
echo 'ALATPAY_WEBHOOK_KEY_MAIN="ed1f0156ba5a6df8566e15f7574ea02b"' >> /var/www/school-portal/.env.tmp
mv /var/www/school-portal/.env.tmp /var/www/school-portal/.env
cd /var/www/school-portal
docker compose down school-portal-app
docker compose up -d school-portal-app
