import pytest
import tarokk_errors as te
import player
import cards

def test_hand():
    h = player.Hand()
    h.add_card(cards.Tarokk(13))
    h.play_card(cards.Tarokk(13))
    assert h == player.Hand()

def test_error():
    with pytest.raises(te.InternalError):
        h = player.Hand()
        h.add_card(1)
