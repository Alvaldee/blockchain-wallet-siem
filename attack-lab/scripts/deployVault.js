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
    console.log("Deployer (owner):", deployer.address);

    const VulnerableVault = await ethers.getContractFactory("VulnerableVault");
    const vault = await VulnerableVault.deploy();
    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();
    console.log("VulnerableVault deployed at:", vaultAddress);
    console.log("Owner set to:", deployer.address);

    await vault.deposit({ value: ethers.parseEther("5") });
    console.log("Funded VulnerableVault with 5 ETH");

    const configPath = fileURLToPath(new URL("../bot/config.json", import.meta.url));
    updateConfig(configPath, {
        address: vaultAddress,
        type: "accessControl",
        name: "VulnerableVault",
        owner: deployer.address,
    });
    console.log("Saved to bot/config.json");

    const balance = await ethers.provider.getBalance(vaultAddress);
    console.log("VulnerableVault balance:", ethers.formatEther(balance), "ETH");
    console.log("\n✅ Ready. Run scripts/attackAccessControl.js to exploit.");
}

main().catch(console.error);
