import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.join(__dirname, '../src/db/schema.ts');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');
const lines = schemaContent.split('\n');

console.log('Searching for schoolScheduleSettings...');
lines.forEach((line, index) => {
  if (line.toLowerCase().includes('school_schedule_settings') || line.toLowerCase().includes('schoolschedulesettings')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
