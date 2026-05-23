import fs from 'fs';

const logPath = 'C:\\Users\\hp\\.gemini\\antigravity\\brain\\63c25d4c-73e5-488f-a751-8c2ed4a6a4ca\\.system_generated\\tasks\\task-450.log';
const logContent = fs.readFileSync(logPath, 'utf8');
const lines = logContent.split('\n');

console.log("=== LOG SEARCH FOR /staff/sports ===");
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('/staff/sports')) {
        console.log(`${i + 1}: ${lines[i]}`);
    }
}
