import { network } from "hardhat";
import { createRequire } from "module";
import fs from "fs";

const require = createRequire(import.meta.url);

async function main() {
    const { ethers } = await network.connect();

    const deployed = JSON.parse(fs.readFileSync("deployed.json"));
    const vulnerableAddress = deployed.vulnerable;

    // Load ABI directly instead of using getContractAt
    const artifact = require("../artifacts/contracts/Vulnerable.sol/Vulnerable.json");
    const contract = new ethers.Contract(vulnerableAddress, artifact.abi, await ethers.provider.getSigner());

    console.log("Monitoring address:\n", vulnerableAddress);
    console.log("🟢 Listening for events...\n");

    const pastWithdraws = await contract.queryFilter("Withdraw");
    const withdrawCounts = new Map();

    for (const event of pastWithdraws) {
        const { user, amount } = event.args;
        const txHash = event.transactionHash;

        const count = (withdrawCounts.get(txHash) || 0) + 1;
        withdrawCounts.set(txHash, count);

        if (count >= 2) {
            console.log("Past Reentrancy detected!");
            console.log("Tx: ", txHash);
        }
        console.log(`(Past) Withdraw: ${user} | ${ethers.formatEther(amount)} ETH`);
    }

    contract.on("Deposit", (user, amount) => {
        console.log(`Deposit: ${user} | ${ethers.formatEther(amount)} ETH`);
    });

    contract.on("Withdraw", async (user, amount, event) => {
        const txHash = event.log.transactionHash;

        const count = (withdrawCounts.get(user) || 0) + 1;
        withdrawCounts.set(txHash, count);

        console.log(`Withdraw: ${user} | ${ethers.formatEther(amount)} ETH | tx: ${txHash}`);

        if (count >= 2) {
            console.log("🚨 REENTRANCY DETECTED! (Same transaction)!");
            console.log("Attacker:", user);
            console.log("Tx:", txHash);
            console.log("----------------------------");
        }
    });
}

main();