import pytest
import tarokk_errors as te
import bidding

def test_bid():
    state = {"bids": [0,0,0,0,1]}
    state = bidding.bid(state, 1)
    assert state["status"] == "forbidden"
