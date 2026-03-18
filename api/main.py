import requests
from config import RPC_URL
from ingest import get_transaction
from detector.engine import Rule, DetectionEngine
from detector.security_rules import (high_value_rule, risky_wallet_rule, rapid_drain_rule)
from api.simulate import simulate_wallet_activity

engine = DetectionEngine()

engine.register_rule(
    Rule(
        rule_id="TX001",
        description="High value transfer",
        weight=50,
        check_function=high_value_rule
    )
)

engine.register_rule(
    Rule(
        rule_id="TX002",
        description="Interaction with flagged wallet",
        weight=80,
        check_function=risky_wallet_rule
    )
)

engine.register_rule(
    Rule(
        rule_id="TX003",
        description="Rapid drain behavior",
        weight=100,
        check_function=rapid_drain_rule
    )
)

def get_severity(score):
    if score >= 300:
        return "CRITICAL"
    elif score >= 150:
        return "HIGH"
    elif score > 0:
        return "MEDIUM"
    return "LOW"

transactions = simulate_wallet_activity()

history = []
wallet_risk_score = 0
flagged_transactions = []

for tx in transactions:
    result = engine.evaluate(tx, history)

    if result["risk_score"] > 0:
        flagged_transactions.append({
            "hash": tx["hash"],
            "triggers": result["triggers"]
        })

    wallet_risk_score += result["risk_score"]
    history.append(tx)
    severity = get_severity(wallet_risk_score)

# 🧾 Output report
print("\n=== Wallet Drain Simulation Report ===")
print(f"Wallet: 0xUser")
print(f"Total Transactions Analyzed: {len(transactions)}")
print(f"Total Risk Score: {wallet_risk_score}\n")
print(f"Severity: {severity}\n")

for tx in flagged_transactions:
    print(f"⚠️ TX {tx['hash']} flagged:")
    for t in tx["triggers"]:
        print(f" - {t['description']} (+{t['weight']})")