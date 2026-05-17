import { network } from "hardhat";
import fs from "fs";
import { fileURLToPath } from "url";

function updateConfig(configPath, entry) {
    const config = fs.existsSync(configPath)
        ? JSON.parse(fs.readFileSync(configPath, "utf8"))
        : { contracts: [] };
    if (!Array.isArray(config.contracts)) config.contracts = [];
    const idx = config.contracts.findIndex(c => c.type === entry.type);
    if (idx >= 0) config.contracts[idx] = entry;
    else config.contracts.push(entry);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

async function main() {
    const { ethers } = await network.connect();
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);

    const VulnerableBank = await ethers.getContractFactory("VulnerableBank");
    const bank = await VulnerableBank.deploy();
    await bank.waitForDeployment();
    const bankAddress = await bank.getAddress();
    console.log("VulnerableBank deployed at:", bankAddress);

    await bank.deposit({ value: ethers.parseEther("5") });
    console.log("Funded VulnerableBank with 5 ETH");

    const configPath = fileURLToPath(new URL("../bot/config.json", import.meta.url));
    updateConfig(configPath, { address: bankAddress, type: "overflow", name: "VulnerableBank" });
    console.log("Saved to bot/config.json");

    const balance = await ethers.provider.getBalance(bankAddress);
    console.log("VulnerableBank balance:", ethers.formatEther(balance), "ETH");
    console.log("\n✅ Ready. Run scripts/attackOverflow.js to exploit.");
}

main().catch(console.error);
