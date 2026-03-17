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

    def evaluate(self, tx, history=None):
        if history is None:
            history = []

        risk_score = 0
        triggered = []

        for rule in self.rules:
            try:
                result = rule.check(tx, history)
            except TypeError:
                result = rule.check(tx)

            if result:
                risk_score += rule.weight
                triggered.append({
                    "rule_id": rule.rule_id,
                    "description": rule.description,
                    "weight": rule.weight
                })

        return {
            "risk_score": risk_score,
            "triggers": triggered
        }