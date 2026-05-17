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

    // Save to config (preserve other contract entries)
    const configPath = fileURLToPath(new URL("../bot/config.json", import.meta.url));
    const config = fs.existsSync(configPath)
        ? JSON.parse(fs.readFileSync(configPath, "utf8"))
        : { contracts: [] };
    if (!Array.isArray(config.contracts)) config.contracts = [];
    const idx = config.contracts.findIndex(c => c.type === "reentrancy");
    const entry = { address: vulnAddress, type: "reentrancy", name: "Vulnerable" };
    if (idx >= 0) config.contracts[idx] = entry;
    else config.contracts.push(entry);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log("Saved address to bot/config.json");

    const balance = await ethers.provider.getBalance(vulnAddress);
    console.log("Vulnerable balance:", ethers.formatEther(balance), "ETH");
    console.log("\n✅ Ready. Start the bot, then run scripts/attack.js");
}

main().catch(console.error);
