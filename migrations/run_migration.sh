#!/bin/bash
# Run each step SQL against the database
for i in 2 3 4 5; do
  echo "=== Running step${i}.sql ==="
  docker exec school-portal-db sh -c "mysql -uroot -pRootPassword123! school_portal < /tmp/step${i}.sql" 2>&1
  echo "=== Done step${i}.sql ==="
done
echo "=== Running step6 (ALTER) ==="
docker exec school-portal-db sh -c "mysql -uroot -pRootPassword123! school_portal < /tmp/step6.sql" 2>&1
echo "=== Done step6.sql ==="
echo "=== Verifying ==="
docker exec school-portal-db sh -c "mysql -uroot -pRootPassword123! school_portal -e 'SHOW TABLES' 2>/dev/null | grep unified"
docker exec school-portal-db sh -c "mysql -uroot -pRootPassword123! school_portal -e 'SHOW TABLES' 2>/dev/null | grep bank_questions"
echo "=== ALL DONE ==="
