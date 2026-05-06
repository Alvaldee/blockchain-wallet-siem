import { ethers } from "ethers";

const alertedTx = new Set();
const WITHDRAW_TOPIC = ethers.id("Withdraw(address,uint256)");

export async function handleTransaction(tx, receipt, trackedContracts) {
    try {
        console.log(`\n🔍 Analyzing TX: ${tx.hash}`);
        console.log(`   Direct call to: ${tx.to}`);
        console.log(`   Status: ${receipt.status === 1 ? "Success" : "Failed"}`);
        console.log(`   Total logs: ${receipt.logs.length}`);

        // Count Withdraw events per address, but only from tracked contracts.
        // Filtering by log.address is essential: in a reentrancy attack the outer
        // tx.to is the attacker contract, so we cannot rely on tx.to for filtering.
        const withdrawalsByAddress = new Map();

        for (const log of receipt.logs) {
            if (!trackedContracts.has(log.address.toLowerCase())) continue;
            if (log.topics[0] !== WITHDRAW_TOPIC) continue;

            const withdrawer = ethers.getAddress("0x" + log.topics[1].slice(-40));
            const count = (withdrawalsByAddress.get(withdrawer) || 0) + 1;
            withdrawalsByAddress.set(withdrawer, count);
            console.log(`   📤 Withdraw from ${withdrawer} (count this tx: ${count})`);
        }

        if (withdrawalsByAddress.size === 0) {
            console.log(`   ℹ️  No Withdraw events from tracked contracts`);
            return;
        }

        for (const [address, count] of withdrawalsByAddress.entries()) {
            if (count >= 2 && !alertedTx.has(tx.hash)) {
                alertedTx.add(tx.hash);

                const finding = {
                    name: "REENTRANCY ATTACK DETECTED",
                    description: `${address} called withdraw ${count} times in one transaction`,
                    severity: "HIGH",
                    txHash: tx.hash,
                    attackEntryPoint: tx.to,
                    withdrawer: address,
                    withdrawCount: count,
                    timestamp: new Date().toISOString(),
                };

                console.log("\n" + "=".repeat(70));
                console.log("🚨 " + finding.name);
                console.log(JSON.stringify(finding, null, 2));
                console.log("=".repeat(70) + "\n");
                break;
            }
        }
    } catch (error) {
        console.error("❌ Error in handleTransaction:", error.message);
    }
}
