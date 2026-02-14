HIGH_VALUE_THRESHOLD = 10  # ETH (example)
RISKY_WALLETS = {
    "0xScamWallet123...",
    "0xBadActor456..."
}

def evaluate_transaction(tx):
    score = 0
    alerts = []

    # Rule 1: High value transfer
    if float(tx["value"]) > HIGH_VALUE_THRESHOLD:
        score += 50
        alerts.append("High value transfer")

    # Rule 2: Interaction with risky wallet
    if tx["to"] in RISKY_WALLETS:
        score += 70
        alerts.append("Interaction with flagged wallet")

    return {
        "risk_score": score,
        "alerts": alerts
    }
