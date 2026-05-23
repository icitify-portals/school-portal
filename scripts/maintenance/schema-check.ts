import * as schema from './src/db/schema.ts';

const targets = [
    'results',
    'resultsRelations',
    'semesterSummaries',
    'semesterSummariesRelations',
    'students',
    'studentsRelations',
    'enrollments',
    'enrollmentsRelations',
    'courses',
    'coursesRelations',
    'departmentsRelations',
    'academicSessionsRelations'
];

console.log('--- SCHEMA EXPORT CHECK ---');
for (const target of targets) {
    const val = (schema as any)[target];
    const status = val === undefined ? 'MISSING' : 'OK (' + typeof val + ')';
    console.log(`[${target.padEnd(28)}] : ${status}`);
}

const undefinedItems = Object.entries(schema)
    .filter(([k, v]) => v === undefined)
    .map(([k, v]) => k);

if (undefinedItems.length > 0) {
    console.log('--- UNDEFINED EXPORTS FOUND ---');
    console.log(undefinedItems.join(', '));
} else {
    console.log('--- ALL EXPORTS OK ---');
}
