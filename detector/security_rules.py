HIGH_VALUE_THRESHOLD = 10
RISKY_WALLETS = {"0xScamWallet123..."}

def high_value_rule(tx):
    return float(tx["value"]) > HIGH_VALUE_THRESHOLD

def risky_wallet_rule(tx):
    return tx["to"] in RISKY_WALLETS