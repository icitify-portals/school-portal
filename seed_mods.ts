import { seedModules } from './src/actions/modules';

async function run() {
  try {
    await seedModules();
    console.log('Modules seeded!');
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}

run();
