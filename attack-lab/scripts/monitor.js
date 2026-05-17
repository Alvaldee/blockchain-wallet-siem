import { network } from "hardhat";
import { createRequire } from "module";
import fs from "fs";
import { sendDiscordAlert } from "../alerts/discordAlert.js";

const require = createRequire(import.meta.url);

async function main() {
    const { ethers } = await network.connect();

    const deployed = JSON.parse(fs.readFileSync("deployed.json"));
    const vulnerableAddress = deployed.vulnerable;

    const artifact = require("../artifacts/contracts/Vulnerable.sol/Vulnerable.json");
    const contract = new ethers.Contract(
        vulnerableAddress, 
        artifact.abi, 
        await ethers.provider.getSigner()
    );

    console.log("Monitoring address:\n", vulnerableAddress);
    console.log("🟢 Listening for events...\n");

    // Track processed transactions to avoid duplicate alerts
    const processedTxs = new Set();

    // Check past withdrawals
    const pastWithdraws = await contract.queryFilter("Withdraw");
    const pastTxCounts = new Map();

    for (const event of pastWithdraws) {
        const { user, amount } = event.args;
        const txHash = event.transactionHash;

        const count = (pastTxCounts.get(txHash) || 0) + 1;
        pastTxCounts.set(txHash, count);

        console.log(`(Past) Withdraw: ${user} | ${ethers.formatEther(amount)} ETH | tx: ${txHash.slice(0, 10)}...`);
    }

    // Alert on past reentrancies
    for (const [txHash, count] of pastTxCounts.entries()) {
        if (count >= 2) {
            console.log("\n🚨 Past Reentrancy detected!");
            console.log("Tx:", txHash);
            console.log("Withdraw count:", count);
            console.log("----------------------------\n");
        }
    }

    // Listen for new deposits
    contract.on("Deposit", (user, amount) => {
        console.log(`Deposit: ${user} | ${ethers.formatEther(amount)} ETH`);
    });

    // Listen for new withdrawals - analyze per transaction
    contract.on("Withdraw", async (user, amount, event) => {
        const txHash = event.log.transactionHash;

        console.log(`Withdraw: ${user} | ${ethers.formatEther(amount)} ETH | tx: ${txHash.slice(0, 10)}...`);

        // Skip if already processed
        if (processedTxs.has(txHash)) return;

        // Wait a bit for all events in the transaction to be emitted
        await new Promise(resolve => setTimeout(resolve, 100));

        // Now fetch ALL Withdraw events from this transaction
        const receipt = await ethers.provider.getTransactionReceipt(txHash);
        const withdrawTopic = contract.interface.getEvent("Withdraw").topicHash;
        
        const withdrawLogs = receipt.logs.filter(log => 
            log.topics[0] === withdrawTopic
        );

        if (withdrawLogs.length >= 2) {
            processedTxs.add(txHash);

            console.log("\n" + "=".repeat(60));
            console.log("🚨 REENTRANCY ATTACK DETECTED!");
            console.log("Transaction:", txHash);
            console.log("Withdraw count:", withdrawLogs.length);
            console.log("Attacker:", user);
            console.log("=".repeat(60) + "\n");

            await sendDiscordAlert({
                description: `Address ${user} called withdraw ${withdrawLogs.length} times in one transaction`,
                severity: "HIGH",
                withdrawCount: withdrawLogs.length,
                withdrawer: user,
                txHash,
            });
        }
    });
}

main().catch(console.error);