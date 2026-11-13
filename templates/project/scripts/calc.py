#!/usr/bin/env python3
"""All the arithmetic of the video lives here, with its assumptions named. Output: src/story/numbers.json
Rewrite this file for each topic. The example below is the tontine vs bank video.

Tontine model (illustrative): 12 members, $100 a month, the winner of each round bids a fixed $8.
Members who have not yet received the pot pay 100 - 8; members who have already received it pay 100.
The winner of round k pays nothing that round.
"""
import json

MEMBERS, SHARE, BID = 12, 100, 8
BANK_RATE, TAX = 0.04, 0.06  # assumed 12-month USD deposit rate, inside the May 2026 range of 2.25-4.80%; withholding tax on resident interest
LOSS_MONTH = 7  # the organizer disappears before this round


def member(k):
    """Round k winner: (total paid, total received)."""
    paid = (k - 1) * (SHARE - BID) + (MEMBERS - k) * SHARE
    received = (k - 1) * SHARE + (MEMBERS - k) * (SHARE - BID)
    return paid, received


last_paid, last_got = member(MEMBERS)
first_paid, first_got = member(1)
assert sum(member(k)[1] - member(k)[0] for k in range(1, MEMBERS + 1)) == 0, 'a tontine is zero-sum'
live = SHARE - BID
deposits = MEMBERS - 1
month_weights = sum(range(1, deposits + 1))  # deposit 1 earns for 11 months, deposit 11 for 1 month
bank_gross = live * BANK_RATE * month_weights / 12
bank_net = bank_gross * (1 - TAX)
lost = (LOSS_MONTH - 1) * live

out = {
    'members': MEMBERS, 'share': SHARE, 'bid': BID, 'live': live, 'pot_full': MEMBERS * SHARE,
    'last_paid': last_paid, 'last_got': last_got, 'last_gain': last_got - last_paid,
    'first_got': first_got, 'first_paid': first_paid, 'first_cost': first_paid - first_got,
    'bank_rate_pct': round(BANK_RATE * 100), 'tax_pct': round(TAX * 100), 'bank_net': round(bank_net),
    'times': round((last_got - last_paid) / bank_net, 1), 'times_floor': int((last_got - last_paid) // bank_net),
    'loss_month': LOSS_MONTH, 'months_paid_before_loss': LOSS_MONTH - 1, 'lost': lost,
    'allow': [1, 2, 3, 4, 5, 6, 12],
}
json.dump(out, open('src/story/numbers.json', 'w', encoding='utf-8'), indent=1)
print(json.dumps(out, indent=1))
