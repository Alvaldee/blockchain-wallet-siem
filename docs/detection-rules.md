# Wallet SIEM — Detection Rules (Stage 1)

This document defines the initial rule-based detection logic used in Stage 1
(detection and alerting only) of the Wallet SIEM project.

---

## 1. Rule Design Principles

### 1.1 Behavioral, Not Signature-Based
Rules focus on *how* automated drainage attacks behave rather than on static
indicators such as known attacker addresses.

### 1.2 Correlated Signals Over Single Events
No single rule is sufficient to classify an attack. Risk is determined by
multiple correlated signals across transactions.

### 1.3 Explainability
Each rule must be explainable in one sentence and clearly justify why the
behavior is suspicious.

---

## 2. Rule Categories

- **Velocity & Burst** — speed and frequency anomalies
- **Novelty** — first-time or previously unseen behavior
- **Permission Abuse** — misuse of ERC-20 approvals
- **Correlation & Sequencing** — suspicious action ordering
- **Contextual Risk** — external or structural risk factors

---

## 3. Detection Rules

### R1 — Transaction Burst
**Condition**
- Three or more outgoing transactions within 60 seconds

**Rationale**
- Automated drainers prioritize speed and batch execution

**Signal Type**
- Automation indicator

**Weight**
- 20 (Medium)

---

### R2 — High-Value Transfer to New Recipient
**Condition**
- Recipient address has no prior interaction history
- Transfer value exceeds a configurable percentage of historical balance

**Rationale**
- Drainers typically exfiltrate funds to fresh addresses

**Signal Type**
- Fund exfiltration attempt

**Weight**
- 30 (High)

---

### R3 — Unlimited Approval to New Spender
**Condition**
- ERC-20 approval with allowance set to maximum value
- Spender address has no prior interaction history

**Rationale**
- Unlimited approvals are a common precursor to automated drains

**Signal Type**
- Privilege escalation

**Weight**
- 35 (High)

---

### R4 — Approval Followed by TransferFrom
**Condition**
- ERC-20 approval followed by `transferFrom`
- Occurs within a short time window

**Rationale**
- Indicates automated exploitation of granted permissions

**Signal Type**
- Active drain in progress

**Weight**
- 40 (Critical)

---

### R5 — Multi-Token Sweep
**Condition**
- Two or more different tokens transferred
- Same destination address
- Occurs within a short time window

**Rationale**
- Manual users rarely sweep multiple tokens programmatically

**Signal Type**
- Drain script behavior

**Weight**
- 30 (High)

---

### R6 — First-Ever Contract Interaction
**Condition**
- Wallet has no historical contract interactions prior to this transaction

**Rationale**
- Compromised wallets often begin draining immediately upon first use

**Signal Type**
- Novel execution risk

**Weight**
- 15 (Low–Medium)

---

### R7 — Sudden Behavioral Change
**Condition**
- Significant deviation from historical wallet behavior
  - Time of activity
  - Transaction frequency
  - Token usage

**Rationale**
- Account takeover often results in abrupt behavior changes

**Signal Type**
- Account compromise indicator

**Weight**
- 25 (Medium)

---

### R8 — Gas Urgency Spike
**Condition**
- Gas price significantly higher than the wallet’s historical average

**Rationale**
- Automated drainers are willing to overpay for execution speed

**Signal Type**
- Automation indicator

**Weight**
- 10 (Low–Medium)

---

### R9 — Interaction With Upgradeable or Proxy Contract
**Condition**
- Target contract is upgradeable or uses a proxy pattern

**Rationale**
- Upgradeable contracts present increased risk surfaces

**Signal Type**
- Contextual risk

**Weight**
- 10 (Low)

---

### R10 — Known Malicious Address (Optional)
**Condition**
- Counterparty address appears in a threat intelligence feed

**Rationale**
- Provides high-confidence malicious signal

**Signal Type**
- Known bad infrastructure

**Weight**
- 50 (Critical)

---

## 4. Risk Scoring Model

Risk scores are calculated by summing the weights of all triggered rules.
Scores are capped at 100.

### Severity Bands

| Score Range | Severity |
|------------|----------|
| 0–29       | Low      |
| 30–59      | Medium   |
| 60–79      | High     |
| 80–100     | Critical |

---

## 5. Alert Structure

Alerts must be explainable and actionable.

**Alert Output Includes**
- Triggered rule IDs
- Short explanation for each rule
- Aggregate risk score
- Severity level
- Timestamp

### Example Alert

Triggered Rules:
- R3: Unlimited approval to new spender
- R4: Approval followed by transferFrom
- R1: Transaction burst

Severity: Critical (92 / 100)

---

## 6. Explicit Non-Rules

The following behaviors are intentionally not flagged to reduce noise:
- Single low-value transfers
- Known DeFi protocol approvals
- Long-term recurring or habitual payments

---

## 7. Future Extensions

- Dynamic rule weighting
- Machine-learning-based anomaly detection
- Cross-wallet correlation
- On-chain enforcement via account abstraction
