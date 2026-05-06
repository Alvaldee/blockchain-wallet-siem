import { network } from "hardhat";
import fs from "fs";
import { fileURLToPath } from "url";

async function main() {
    const { ethers } = await network.connect();
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);

    const Vulnerable = await ethers.getContractFactory("Vulnerable");
    const vulnerable = await Vulnerable.deploy();
    await vulnerable.waitForDeployment();
    const vulnAddress = await vulnerable.getAddress();
    console.log("Vulnerable deployed at:", vulnAddress);

    // Fund with 10 ETH so multiple attacks can be run
    await vulnerable.deposit({ value: ethers.parseEther("10") });
    console.log("Funded Vulnerable with 10 ETH");

    // Save to config so the bot and attack script can read it
    const configPath = fileURLToPath(new URL("../bot/config.json", import.meta.url));
    fs.writeFileSync(configPath, JSON.stringify({ contracts: [vulnAddress] }, null, 2));
    console.log("Saved address to bot/config.json");

    const balance = await ethers.provider.getBalance(vulnAddress);
    console.log("Vulnerable balance:", ethers.formatEther(balance), "ETH");
    console.log("\n✅ Ready. Start the bot, then run scripts/attack.js");
}

main().catch(console.error);
