import { network } from "hardhat";
import path from "path";
import fs from "fs";

async function main() {
    const { ethers } = await network.connect();
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);

    // 1. Deploy Vulnerable
    const Vulnerable = await ethers.getContractFactory("Vulnerable");
    const vulnerable = await Vulnerable.deploy();
    await vulnerable.waitForDeployment();
    const vulnAddress = await vulnerable.getAddress();
    console.log("Vulnerable deployed at:", vulnAddress);
    const filePath = path.resolve("deployed.json");
    fs.writeFileSync(filePath, JSON.stringify({
    vulnerable: vulnAddress
    }, null, 2));
    console.log("Saved to deployed.json");

    // 2. Fund Vulnerable
    await vulnerable.deposit({ value: ethers.parseEther("5") });
    console.log("Funded Vulnerable with 5 ETH");

    // 3. Deploy Attacker
    const Attack = await ethers.getContractFactory("Attack");
    const attack = await Attack.deploy(vulnAddress);
    await attack.waitForDeployment();
    const attackAddress = await attack.getAddress();
    console.log("Attacker deployed at:", attackAddress);

    // 4. Balances BEFORE
    let vulnBalance = await ethers.provider.getBalance(vulnAddress);
    let attackBalance = await ethers.provider.getBalance(attackAddress);
    console.log("\n=== BEFORE ATTACK ===");
    console.log("Vulnerable:", ethers.formatEther(vulnBalance));
    console.log("Attacker:  ", ethers.formatEther(attackBalance));

    console.log("Waiting 5 seconds before attack...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 5. Execute attack
    const tx = await attack.attack({ value: ethers.parseEther("1"), gasLimit: 3000000 });
    await tx.wait();

    // 6. Balances AFTER
    vulnBalance = await ethers.provider.getBalance(vulnAddress);
    attackBalance = await ethers.provider.getBalance(attackAddress);
    console.log("\n=== AFTER ATTACK ===");
    console.log("Vulnerable:", ethers.formatEther(vulnBalance));
    console.log("Attacker:  ", ethers.formatEther(attackBalance));
}

main().catch(console.error);