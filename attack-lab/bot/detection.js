import { ethers } from "ethers";
import { sendDiscordAlert } from "../alerts/discordAlert.js";
import { esClient } from "../logs/esClient.js";

const alertedTx = new Set();

// Persistent deposit tracker for overflow detection: `contractAddr:userAddr` → total wei deposited
const depositTracker = new Map();

const TOPICS = {
    Withdraw:     ethers.id("Withdraw(address,uint256)"),
    Deposit:      ethers.id("Deposit(address,uint256)"),
    Transfer:     ethers.id("Transfer(address,address,uint256)"),
    VaultDrained: ethers.id("VaultDrained(address,uint256)"),
};

function decodeAddress(topic) {
    return ethers.getAddress("0x" + topic.slice(-40));
}

function decodeUint256(data) {
    return BigInt(data);
}

async function fireAlert(finding) {
    console.log("\n" + "=".repeat(70));
    console.log("🚨 " + finding.name);
    console.log(JSON.stringify(finding, null, 2));
    console.log("=".repeat(70) + "\n");

    await sendDiscordAlert(finding);

    try {
        await esClient.index({
            index: "siem-alerts",
            document: { ...finding, "@timestamp": finding.timestamp },
        });
        console.log("✅ Indexed to Elasticsearch (siem-alerts)");
    } catch (err) {
        console.error("❌ Elasticsearch index failed:", err.message);
    }
}

export async function handleTransaction(tx, receipt, contractMap) {
    try {
        console.log(`\n🔍 Analyzing TX: ${tx.hash}`);
        console.log(`   Direct call to: ${tx.to}`);
        console.log(`   Status: ${receipt.status === 1 ? "Success" : "Failed"}`);

        // ── Reentrancy: count Withdraw events per address ──────────────────────
        const withdrawCounts = new Map(); // address → count (for reentrancy contracts)

        // ── Overflow: collect withdrawals that exceed deposited amount ──────────
        const overflowAlerts = [];

        // ── Access Control: collect unauthorised VaultDrained events ───────────
        const accessControlAlerts = [];

        for (const log of receipt.logs) {
            const contractInfo = contractMap.get(log.address.toLowerCase());
            if (!contractInfo) continue;

            const topic = log.topics[0];

            if (contractInfo.type === "reentrancy") {
                if (topic === TOPICS.Withdraw) {
                    const user = decodeAddress(log.topics[1]);
                    withdrawCounts.set(user, (withdrawCounts.get(user) || 0) + 1);
                    console.log(`   📤 [reentrancy] Withdraw from ${user} (count: ${withdrawCounts.get(user)})`);
                }
            }

            if (contractInfo.type === "overflow") {
                const contractAddr = log.address.toLowerCase();

                if (topic === TOPICS.Deposit) {
                    const user = decodeAddress(log.topics[1]);
                    const amount = decodeUint256(log.data);
                    const key = `${contractAddr}:${user.toLowerCase()}`;
                    depositTracker.set(key, (depositTracker.get(key) || 0n) + amount);
                    console.log(`   💰 [overflow] Deposit from ${user}: ${amount} wei (tracked: ${depositTracker.get(key)})`);
                }

                // Primary overflow signal: Transfer where amount > known balance.
                // This fires even when the bank is empty, because the underflow
                // is visible in the Transfer args regardless of available ETH.
                if (topic === TOPICS.Transfer) {
                    const from = decodeAddress(log.topics[1]);
                    const amount = decodeUint256(log.data);
                    const key = `${contractAddr}:${from.toLowerCase()}`;
                    const knownBalance = depositTracker.get(key) || 0n;
                    console.log(`   🔄 [overflow] Transfer from ${from}: ${amount} wei (known balance: ${knownBalance})`);
                    if (amount > knownBalance) {
                        overflowAlerts.push({ user: from, amount, totalDeposited: knownBalance, contractAddr: log.address });
                    }
                }

                if (topic === TOPICS.Withdraw) {
                    const user = decodeAddress(log.topics[1]);
                    const amount = decodeUint256(log.data);
                    const key = `${contractAddr}:${user.toLowerCase()}`;
                    const knownBalance = depositTracker.get(key) || 0n;
                    console.log(`   📤 [overflow] Withdraw from ${user}: ${amount} wei (tracked: ${knownBalance})`);
                    depositTracker.set(key, amount > knownBalance ? 0n : knownBalance - amount);
                }
            }

            if (contractInfo.type === "accessControl") {
                if (topic === TOPICS.VaultDrained) {
                    const caller = decodeAddress(log.topics[1]);
                    const amount = decodeUint256(log.data);
                    console.log(`   🔑 [accessControl] VaultDrained by ${caller}`);

                    if (caller.toLowerCase() !== contractInfo.owner.toLowerCase()) {
                        accessControlAlerts.push({ caller, amount, owner: contractInfo.owner, contractAddr: log.address });
                    }
                }
            }
        }

        // ── Fire alerts ─────────────────────────────────────────────────────────

        if (alertedTx.has(tx.hash)) return;

        for (const [address, count] of withdrawCounts.entries()) {
            if (count >= 2) {
                alertedTx.add(tx.hash);
                await fireAlert({
                    name: "REENTRANCY ATTACK DETECTED",
                    description: `${address} called withdraw ${count} times in one transaction`,
                    severity: "HIGH",
                    txHash: tx.hash,
                    attackEntryPoint: tx.to,
                    withdrawer: address,
                    withdrawCount: count,
                    timestamp: new Date().toISOString(),
                });
                return;
            }
        }

        for (const a of overflowAlerts) {
            alertedTx.add(tx.hash);
            await fireAlert({
                name: "INTEGER OVERFLOW ATTACK DETECTED",
                description: `${a.user} withdrew ${a.amount} wei but only deposited ${a.totalDeposited} wei`,
                severity: "HIGH",
                txHash: tx.hash,
                attackEntryPoint: tx.to,
                withdrawer: a.user,
                withdrawCount: 1,
                withdrawAmount: a.amount.toString(),
                totalDeposited: a.totalDeposited.toString(),
                contract: a.contractAddr,
                timestamp: new Date().toISOString(),
            });
            return;
        }

        for (const a of accessControlAlerts) {
            alertedTx.add(tx.hash);
            await fireAlert({
                name: "ACCESS CONTROL VIOLATION DETECTED",
                description: `${a.caller} called drainVault() without being the owner (${a.owner})`,
                severity: "CRITICAL",
                txHash: tx.hash,
                attackEntryPoint: tx.to,
                withdrawer: a.caller,
                withdrawCount: 1,
                unauthorizedCaller: a.caller,
                expectedOwner: a.owner,
                amountDrained: ethers.formatEther(a.amount) + " ETH",
                contract: a.contractAddr,
                timestamp: new Date().toISOString(),
            });
            return;
        }

    } catch (error) {
        console.error("❌ Error in handleTransaction:", error.message);
    }
}
