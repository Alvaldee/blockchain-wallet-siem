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

    console.log("🟢 Hybrid detection bot running...\n");

    provider.on("block", async (blockNumber) => {
        const block = await provider.getBlock(blockNumber, true);

        for (const tx of block.transactions) {
            if (!tx.to) continue;
            if (!tracked.has(tx.to.toLowerCase())) continue;

            await handleTransaction(tx, provider);
        }
    });
}

main();