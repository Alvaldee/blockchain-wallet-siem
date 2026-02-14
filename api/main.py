from detector.rules import evaluate_transaction

result = evaluate_transaction(tx)

print(result["risk_score"])
print(result["alerts"])
