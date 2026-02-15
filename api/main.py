from detector.rules import evaluate_transaction
from detector.behaviour import detect_burst_activity

# pretend this came from your DB
wallet_history = [
    {"timestamp": 1700000000},
    {"timestamp": 1700000010},
    {"timestamp": 1700000020},
    {"timestamp": 1700000030},
    {"timestamp": 1700000040},
]

if detect_burst_activity(wallet_history):
    print("⚠ Burst activity detected")

result = evaluate_transaction(tx)

print(result["risk_score"])
print(result["alerts"])
