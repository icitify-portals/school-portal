import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.join(__dirname, '../src/db/schema.ts');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

const tables = schemaContent.split('export const ');

tables.forEach(tableBlock => {
  if (!tableBlock.includes("mysqlTable('")) return;
  
  const lines = tableBlock.split('\n');
  const tableNameMatch = lines[0].match(/mysqlTable\('([^']+)'/);
  if (!tableNameMatch) return;
  const tableName = tableNameMatch[1];
  
  lines.forEach((line, index) => {
    const refMatch = line.match(/\.references\(\(\) => ([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\)/);
    if (refMatch) {
      const colMatch = line.match(/^\s*([a-zA-Z0-9_]+):/);
      if (colMatch) {
        const colName = colMatch[1];
        // Translate camelCase to snake_case for DB column name approximation
        const dbColName = colName.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        const refTableVar = refMatch[1];
        // Translate refTableVar (camelCase) to DB table name approximation (snake_case)
        const dbRefTableName = refTableVar.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).toLowerCase();
        const refColName = refMatch[2];
        const dbRefColName = refColName.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        
        const autoFkName = `${tableName}_${dbColName}_${dbRefTableName}_${dbRefColName}_fk`;
        if (autoFkName.length > 64) {
          console.log(`⚠️ Long FK in table "${tableName}" at line ${index + 1}:`);
          console.log(`   Field: ${colName}`);
          console.log(`   Ref: ${refTableVar}.${refColName}`);
          console.log(`   Generated FK Name: ${autoFkName} (${autoFkName.length} chars)`);
        }
      }
    }
  });
});
