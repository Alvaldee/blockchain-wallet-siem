import { network } from "hardhat";
import fs from "fs";
import { fileURLToPath } from "url";

async function main() {
    const { ethers } = await network.connect();
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);

    const configPath = fileURLToPath(new URL("../bot/config.json", import.meta.url));
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const vulnAddress = config.contracts[0];

    if (!vulnAddress) {
        console.error("No Vulnerable address in config! Run scripts/deploy.js first.");
        process.exit(1);
    }
    console.log("Using Vulnerable at:", vulnAddress);

    const Attack = await ethers.getContractFactory("Attack");
    const attack = await Attack.deploy(vulnAddress);
    await attack.waitForDeployment();
    const attackAddress = await attack.getAddress();
    console.log("Attack deployed at:", attackAddress);

    let vulnBalance = await ethers.provider.getBalance(vulnAddress);
    let attackBalance = await ethers.provider.getBalance(attackAddress);
    console.log("\n=== BEFORE ATTACK ===");
    console.log("Vulnerable:", ethers.formatEther(vulnBalance), "ETH");
    console.log("Attacker:  ", ethers.formatEther(attackBalance), "ETH");

    console.log("\n🚨 LAUNCHING ATTACK...");
    const tx = await attack.attack({ value: ethers.parseEther("1"), gasLimit: 3000000 });
    console.log("Attack TX:", tx.hash);
    await tx.wait();
    console.log("Attack TX mined!");

    vulnBalance = await ethers.provider.getBalance(vulnAddress);
    attackBalance = await ethers.provider.getBalance(attackAddress);
    console.log("\n=== AFTER ATTACK ===");
    console.log("Vulnerable:", ethers.formatEther(vulnBalance), "ETH");
    console.log("Attacker:  ", ethers.formatEther(attackBalance), "ETH");
}

main().catch(console.error);
