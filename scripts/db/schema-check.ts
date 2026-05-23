import * as schema from './src/db/schema.ts';

console.log('Checking schema exports...');
let undefinedCount = 0;
for (const [key, value] of Object.entries(schema)) {
    if (value === undefined) {
        console.error(`Export "${key}" is undefined!`);
        undefinedCount++;
    }
}

if (undefinedCount === 0) {
    console.log('All schema exports are defined.');
} else {
    console.error(`Found ${undefinedCount} undefined exports.`);
}

// Check for specific suspicious ones
console.log('venues:', typeof schema.venues);
console.log('staffProfiles:', typeof schema.staffProfiles);
console.log('users:', typeof schema.users);
