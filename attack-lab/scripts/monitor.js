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

    for (const event of pastWithdraws) {
        const { user, amount } = event.args;
        console.log(`(Past) Withdraw: ${user} | ${ethers.formatEther(amount)} ETH`);
    }

    const withdrawCounts = new Map();

    contract.on("Deposit", (user, amount) => {
        console.log(`Deposit: ${user} | ${ethers.formatEther(amount)} ETH`);
    });

    contract.on("Withdraw", (user, amount) => {
        const count = (withdrawCounts.get(user) || 0) + 1;
        withdrawCounts.set(user, count);

        console.log(`Withdraw: ${user} | ${ethers.formatEther(amount)} ETH`);

        if (count >= 3) {
            console.log("🚨 REENTRANCY DETECTED!");
            console.log("Attacker:", user);
            console.log("Withdraw count:", count);
            console.log("----------------------------");
        }
    });
}

main();