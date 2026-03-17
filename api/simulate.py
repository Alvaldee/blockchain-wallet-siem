import time

def simulate_wallet_activity():
    normal_tx = [
        {"hash": "0x1", "from": "0xUser", "to": "0xFriend", "value": 1},
        {"hash": "0x2", "from": "0xUser", "to": "0xService", "value": 0.5},
    ]

    attack_tx = [
        {"hash": "0x3", "from": "0xUser", "to": "0xScamWallet123...", "value": 50},
        {"hash": "0x4", "from": "0xUser", "to": "0xScamWallet123...", "value": 75},
    ]

    return normal_tx + attack_tx