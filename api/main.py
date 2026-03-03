from detector.engine import Rule, DetectionEngine
from detector.security_rules import high_value_rule, risky_wallet_rule

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

tx = {
    "hash": "0x123",
    "from": "0xA",
    "to": "0xScamWallet123...",
    "value": "25"
}

result = engine.evaluate(tx)

print(result)