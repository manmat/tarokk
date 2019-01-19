import cards
import pytest
import tarokk_errors as te

def test_tarokk():
    with pytest.raises(te.InternalError):
        c = cards.Tarokk(23)

def test_szin():
        a = cards.Szin(cards.Suite.pikk, cards.Val.lovas)
