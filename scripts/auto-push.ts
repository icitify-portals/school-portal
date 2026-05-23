import { spawn } from 'child_process';

const child = spawn('npx', ['drizzle-kit', 'push'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true,
});

let buffer = '';

child.stdout.on('data', (data) => {
  const str = data.toString();
  process.stdout.write(str);
  buffer += str;
  if (buffer.includes('❯ +') || buffer.includes('create column')) {
      child.stdin.write('\n');
      buffer = ''; // Reset buffer after sending
  }
});

child.stderr.on('data', (data) => {
  process.stderr.write(data.toString());
});

child.on('close', (code) => {
  console.log(`Child process exited with code ${code}`);
  process.exit(code);
});
