# Wallet SIEM — Threat Model (Stage 1)

## 1. System Overview
Wallet SIEM is a detection-and-alerting system designed to identify automated fund drainage attacks by analyzing wallet transaction behavior in near real time.
Stage 1 is read-only and non-custodial:
- No transaction blocking
- No signing
- No private key access

The system monitors wallet activity, applies behavioral detection rules, and raises explainable security alerts when anomalous patterns are detected.

## 2. Assets to Protect
- Asset	Description
- User funds	Native tokens and ERC-20 balances
- User trust	Avoiding false positives / alert fatigue
- Wallet integrity	Preventing silent, automated drains
- Alert accuracy	Alerts must be explainable and actionable

## 3. Threat Actors
## 3.1 Automated Drainers
- Scripted bots
- Malware-controlled wallets
- Known drainer infrastructure
- Fast, repetitive execution patterns

## 3.2 Opportunistic Attackers
Manual but rapid fund exfiltration
Uses prebuilt scripts
Relies on user confusion / panic

## 3.3 Non-goals
The system does not attempt to protect against:
User intentionally signing malicious transactions
Social engineering where user fully consents
Protocol-level exploits

## 4. Attack Scenarios (In Scope)
## 4.1 Scripted Fund Drain
Attacker gains wallet access
Executes approval(s)
Transfers funds across tokens
Completes drain within seconds
Key characteristics
High transaction burst
New recipient address
Approval → transfer sequence
No prior history

## 4.2 Approval Abuse
Unlimited ERC-20 approval
Spender is new or untrusted
Followed by transferFrom

## 4.3 Sweeping Behavior
Same destination address
Multiple tokens
Short time window

## 4.4 Anomalous Usage Pattern
First contract interaction
New chain usage
Unusual time-of-day activity
Gas urgency spikes

## 5. Detection Strategy
## 5.1 Core Philosophy
“Possession of a private key does not equal user intent.”
The system assumes attackers:
Optimize for speed
Use automation
Reuse infrastructure
Avoid delays and friction
Detection is therefore behavioral, not signature-based.

## 5.2 Signals Collected
Transaction Signals
Method selectors
Token approvals
Recipient novelty
Value relative to historical balance
Transaction frequency
Behavioral Signals
Burst execution
First-time actions
Sequence correlation (approve → transfer)

## 6. Detection Rules (Initial Set)
Rule ID	Description
R1	≥3 outgoing tx within 60s
R2	New recipient + large value
R3	Unlimited approval to new spender
R4	Approval followed by transferFrom
R5	Multiple tokens to same address
R6	First-ever contract interaction
R7	Sudden chain or token change
R8	Gas price anomaly
R9	Contract with upgradeable proxy
R10	Known malicious address (optional)

Each rule contributes to a risk score, not a binary decision.

## 7. Alerting Model
Alerts must be:
Explainable
Actionable
Low noise
Example Alert
High Risk Wallet Activity Detected
Reasons:
New spender approved with unlimited allowance
5 transactions in 42 seconds
First interaction with contract
Risk Score: 91 / 100

## 8. Limitations (Explicit)
No on-chain enforcement (Stage 1)
Cannot prevent blind signing
Cannot stop transactions already mined
Detection only as good as rule coverage
These are acceptable trade-offs for a read-only MVP.

## 9. Future Extensions
Account Abstraction enforcement
Transaction delays for high-risk actions
MetaMask Snap integration
ML-based anomaly detection
Cross-wallet correlation

## 10. Success Criteria
Stage 1 is considered successful if:
Automated drain patterns are detected reliably
Alerts are understandable without blockchain expertise
False positives are minimized
The system is easily extensible