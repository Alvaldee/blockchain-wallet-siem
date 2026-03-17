HIGH_VALUE_THRESHOLD = 10
RISKY_WALLETS = {"0xScamWallet123..."}

def high_value_rule(tx):
    return float(tx["value"]) > HIGH_VALUE_THRESHOLD

def risky_wallet_rule(tx):
    return tx["to"] in RISKY_WALLETS

def rapid_drain_rule(tx, history):
    # Detect multiple high-value tx in short time
    recent = [t for t in history if t["from"] == tx["from"]]

    if len(recent) >= 2 and tx["value"] > 20:
        return True

    return False