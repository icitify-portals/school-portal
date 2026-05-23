import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.join(__dirname, '../src/db/schema.ts');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');
const lines = schemaContent.split('\n');

console.log('Searching for semester_summaries...');
lines.forEach((line, index) => {
  if (line.toLowerCase().includes('semester_summaries') || line.toLowerCase().includes('semester_summary') || line.toLowerCase().includes('hod_approved_at') || line.toLowerCase().includes('dean_approved_at')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
