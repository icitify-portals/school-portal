import { db } from './src/db/db';
import { getAllUnifiedTransactions } from './src/actions/bursary';

async function test() {
    const txs = await getAllUnifiedTransactions();
    const accTxs = txs.filter(t => t.purpose?.includes('Acceptance'));
    console.log(JSON.stringify(accTxs.slice(0, 5).map(t => t.student), null, 2));
    process.exit(0);
}
test();
