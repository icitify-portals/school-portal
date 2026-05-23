import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.join(__dirname, '../src/db/schema.ts');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');
const lines = schemaContent.split('\n');

const targetTables = [
  'submission_rubric_grades',
  'hostel_maintenance_requests',
  'boarding_records',
  'admission_form_sections',
  'admission_applications_v2',
  'admission_entrance_exams',
  'admission_exam_questions',
  'admission_exam_results',
  'cash_advance_receipts'
];

targetTables.forEach(tableName => {
  let startLine = -1;
  let endLine = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(`mysqlTable('${tableName}'`) || lines[i].includes(`mysqlTable("${tableName}"`)) {
      startLine = i + 1;
      // Search for the end of table definition `});`
      for (let j = i; j < lines.length; j++) {
        if (lines[j].trim() === '});') {
          endLine = j + 1;
          break;
        }
      }
      break;
    }
  }
  
  console.log(`Table "${tableName}": lines ${startLine} to ${endLine}`);
});
