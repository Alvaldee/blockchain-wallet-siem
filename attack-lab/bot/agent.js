import { ethers } from "ethers";
import fs from "fs";
import { handleTransaction } from "./detection.js";
import { checkESConnection } from "../logs/esClient.js";

const config = JSON.parse(
    fs.readFileSync(new URL("./config.json", import.meta.url))
);

async function main() {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

    // Normalise config: support both old string-array and new object-array formats
    const contractList = config.contracts.map(c =>
        typeof c === "string" ? { address: c, type: "reentrancy", name: "Vulnerable" } : c
    );

    // Map: lowercase address → contract metadata
    const contractMap = new Map(
        contractList.map(c => [c.address.toLowerCase(), c])
    );

    await checkESConnection();
    console.log("🟢 Multi-vulnerability detection bot running...\n");
    for (const [addr, info] of contractMap) {
        console.log(`   📍 ${info.name} (${info.type}) @ ${addr}`);
    }
    console.log("\nWaiting for blocks...\n");

    provider.on("block", async (blockNumber) => {
        console.log(`\n📦 Block #${blockNumber}`);

        const block = await provider.getBlock(blockNumber);
        console.log(`   Transactions in block: ${block.transactions.length}`);

        for (const txHash of block.transactions) {
            const tx = await provider.getTransaction(txHash);
            if (!tx || !tx.to) continue;

            const receipt = await provider.getTransactionReceipt(txHash);
            if (!receipt) continue;

            // Pick up any log emitted by a tracked contract, regardless of tx.to
            const hasTrackedLog = receipt.logs.some(
                log => contractMap.has(log.address.toLowerCase())
            );

            if (!hasTrackedLog) continue;

            console.log(`   ✅ TX ${txHash.slice(0, 10)}... touches a tracked contract`);
            await handleTransaction(tx, receipt, contractMap);
        }
    });
}

main().catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
});
