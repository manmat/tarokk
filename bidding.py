import tarokk_errors as te

def bid(state, amount):

    #Can only bid between 4 and 0 (4 means 3 and 0 means pass)
    if amount > 4 or amount < 0:
        state["status"] = "forbidden"
        return state

    previous_bids = state["bids"]

    #Can't bid is already passed
    if len(previous_bids) >= 4 and previous_bids[len(previous_bids) - 4] == 0 and amount != 0:
        state["status"] = "forbidden"
        return state

    #Can't bid higher
    max_bid = max(previous_bids)
    bids_without_zero = list(filter(lambda x: x != 0, previous_bids))
    min_bid = 0
    if len(bids_without_zero) > 0:
        min_bid = bids_without_zero[-1]
    if max_bid > 0 and amount > min_bid:
        state["status"] = "forbidden"
        return state

    #Check "tartom"
    this_round_bids = previous_bids
    while len(this_round_bids) >= 4:
        this_round_bids = this_round_bids[4:]
    if sum(this_round_bids) != 0 and amount == min_bid:
        state["status"] = "forbidden"
        return state

    return state
    
