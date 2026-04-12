import { network } from "hardhat";

async function main() {
    const { ethers } = await network.connect();
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
}

main().catch(console.error);