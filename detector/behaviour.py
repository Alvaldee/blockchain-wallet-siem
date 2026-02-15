import time

BURST_THRESHOLD = 5  # number of tx
TIME_WINDOW = 60     # seconds

def detect_burst_activity(transactions):
    """
    transactions: list of tx dicts sorted by timestamp
    """
    if len(transactions) < BURST_THRESHOLD:
        return False

    first = transactions[0]["timestamp"]
    last = transactions[-1]["timestamp"]

    if (last - first) <= TIME_WINDOW:
        return True

    return False
