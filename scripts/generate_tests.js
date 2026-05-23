import fs from "node:fs";
import path from "node:path";

const actionsDir = path.resolve("src", "actions");
const testFile = path.resolve("src", "__tests__", "actions", "all-actions.test.ts");

const files = fs.readdirSync(actionsDir).filter(f => f.endsWith(".ts"));

let content = `import { describe, it, expect } from 'vitest';
`;

files.forEach(f => {
    const moduleName = f.replace(".ts", "");
    content += `import * as ${moduleName.replace(/[^a-zA-Z0-9]/g, "_")} from "../../actions/${moduleName}";
`;
});

content += `\ndescribe('Global Actions Coverage', () => {
`;

files.forEach(f => {
    const moduleName = f.replace(".ts", "");
    const safeModuleName = moduleName.replace(/[^a-zA-Z0-9]/g, "_");
    content += `    it('should import ${moduleName} and have exports', () => {
        expect(${safeModuleName}).toBeDefined();
        const exports = Object.keys(${safeModuleName});
        expect(exports.length).toBeGreaterThan(0);
    });

`;
});

content += `});\n`;

fs.writeFileSync(testFile, content);
console.log(`Generated ${testFile} with ${files.length} modules.`);
