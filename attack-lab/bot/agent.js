import { ethers } from "ethers";
import fs from "fs";
import { handleTransaction } from "./detection.js";

const config = JSON.parse(
    fs.readFileSync(new URL("./config.json", import.meta.url))
);

async function main() {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

    const tracked = new Set(
        config.contracts.map(addr => addr.toLowerCase())
    );

    console.log("🟢 Reentrancy detection bot running...\n");
    console.log("📍 Tracking addresses:", Array.from(tracked));
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

            // Check logs emitted BY tracked contracts, not just tx.to.
            // Reentrancy attacks call the vulnerable contract internally — tx.to is
            // the attacker contract, but the Withdraw events still appear in the receipt.
            const hasTrackedLog = receipt.logs.some(
                log => tracked.has(log.address.toLowerCase())
            );

            if (!hasTrackedLog) {
                console.log(`   ⏭️  TX ${txHash.slice(0, 10)}... no tracked contract logs`);
                continue;
            }

            console.log(`   ✅ TX ${txHash.slice(0, 10)}... touches tracked contract`);
            await handleTransaction(tx, receipt, tracked);
        }
    });
}

main().catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
});
