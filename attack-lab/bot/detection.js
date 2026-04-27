const txCounts = new Map();
const alertedTx = new Set();

export async function handleTransaction(tx, provider) {
    const receipt = await provider.getTransactionReceipt(tx.hash);

    let withdrawCount = 0;

    const withdrawTopic = ethers.id("Withdraw(address,uint256)");

    for (const log of receipt.logs) {
        if (log.topics[0] === withdrawTopic) {
            withdrawCount++;
        }
    }

    if (withdrawCount >= 2 && !alertedTx.has(tx.hash)) {
        alertedTx.add(tx.hash);

        const finding = {
            name: "Reentrancy Attack",
            description: "Multiple withdraws in same transaction",
            txHash: tx.hash,
            severity: "HIGH"
        };

        console.log(JSON.stringify(finding, null, 2));
    }
}