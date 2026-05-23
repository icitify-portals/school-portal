const mysql = require('mysql2/promise');

(async () => {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'moodledb'
  });
  
  const [result] = await connection.execute('DESCRIBE institutional_units');
  console.log('institutional_units columns:');
  result.forEach(col => console.log(`- ${col.Field}: ${col.Type}`));
  
  await connection.end();
})();
