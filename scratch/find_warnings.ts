import fs from 'fs';
import path from 'path';

function walk(dir: string, callback: (file: string) => void) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(dirPath);
    });
}

const regex = /<(Input|Textarea)([\s\S]*?)\bvalue\s*=\s*{([\s\S]*?)}/g;

walk('c:/xampp/htdocs/portal-moodle/school-portal/src', (filePath) => {
    if (!filePath.endsWith('.tsx')) return;
    const content = fs.readFileSync(filePath, 'utf8');
    let match;
    while ((match = regex.exec(content)) !== null) {
        const tagName = match[1];
        const tagContent = match[2] + " value={" + match[3] + "}";
        const hasOnChange = /\bonChange\b/.test(tagContent);
        const hasReadOnly = /\breadOnly\b/.test(tagContent);
        if (!hasOnChange && !hasReadOnly) {
            console.log(`Missing onChange/readOnly in ${tagName} (${filePath}):`, tagContent.replace(/\s+/g, ' ').substring(0, 100) + "...");
            const linesBefore = content.substring(0, match.index).split('\n').length;
            console.log("At line:", linesBefore);
        }
    }
});


