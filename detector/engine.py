class Rule:
    def __init__(self, rule_id, description, weight, check_function):
        self.rule_id = rule_id
        self.description = description
        self.weight = weight
        self.check = check_function


class DetectionEngine:
    def __init__(self):
        self.rules = []

    def register_rule(self, rule):
        self.rules.append(rule)

    def evaluate(self, tx):
        total_score = 0
        triggered_rules = []

        for rule in self.rules:
            if rule.check(tx):
                total_score += rule.weight
                triggered_rules.append({
                    "rule_id": rule.rule_id,
                    "description": rule.description,
                    "weight": rule.weight
                })

        return {
            "risk_score": total_score,
            "triggers": triggered_rules
        }
