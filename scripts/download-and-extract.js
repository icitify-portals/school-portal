import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

async function run() {
    const fileId = '14SWjnJe4V0_4FwI1YpG0ehbfbvVMtJRV';
    const url = `https://docs.google.com/uc?export=download&id=${fileId}`;
    const destPath = path.join(process.cwd(), 'scratch', 'editor_lesson.zip');
    const extractDir = path.join(process.cwd(), 'scratch', 'editor_lesson_extracted');

    if (!fs.existsSync(path.join(process.cwd(), 'scratch'))) {
        fs.mkdirSync(path.join(process.cwd(), 'scratch'), { recursive: true });
    }

    console.log(`Downloading zip from Google Drive URL: ${url}...`);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to download: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        console.log(`Content Type: ${contentType}`);
        
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        fs.writeFileSync(destPath, buffer);
        console.log(`Zip downloaded successfully to: ${destPath}`);

        console.log(`Extracting to: ${extractDir}...`);
        const zip = new AdmZip(destPath);
        zip.extractAllTo(extractDir, true);
        console.log('Extraction completed successfully!');
        
        // List extracted files
        const listFiles = (dir) => {
            const files = fs.readdirSync(dir);
            files.forEach(file => {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    console.log(`[DIR] ${path.relative(extractDir, fullPath)}`);
                    listFiles(fullPath);
                } else {
                    console.log(`[FILE] ${path.relative(extractDir, fullPath)} (${stat.size} bytes)`);
                }
            });
        };
        listFiles(extractDir);

    } catch (error) {
        console.error('Download/Extract failed:', error);
    }
}

run();
