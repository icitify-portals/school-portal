import { getFeeStructures } from "./src/actions/bursary";

async function run() {
    const data = await getFeeStructures();
    console.log(data);
}
run();
