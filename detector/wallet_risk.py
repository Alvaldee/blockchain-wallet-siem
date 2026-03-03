def aggregate_wallet_risk(transaction_results):
    total = 0
    for result in transaction_results:
        total += result["risk_score"]

    if total > 150:
        level = "CRITICAL"
    elif total > 80:
        level = "HIGH"
    elif total > 30:
        level = "MEDIUM"
    else:
        level = "LOW"

    return {
        "total_score": total,
        "risk_level": level
    }