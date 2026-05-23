const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../src/db/schema.ts');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');
const lines = schemaContent.split('\n');

console.log('Searching for admission_exam_results or similar...');
lines.forEach((line, index) => {
  if (line.toLowerCase().includes('admission_exam_results') || line.toLowerCase().includes('admissionexamresults') || line.toLowerCase().includes('end_time') || line.toLowerCase().includes('endtime')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
