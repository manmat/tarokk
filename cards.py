import tarokk_errors as te
from aenum import Enum

class Card:

    def __init__(self):
        raise te.InternalError("Don't create an empty card!")

    def is_tarokk(self):
        if isinstance(self, Tarokk):
            return True
        return False

    def is_szin(self):
        if isinstance(self, Szin):
            return True
        return False

    def __eq__(self, other):
        if self.is_tarokk() and other.is_tarokk() and self.num == other.num:
            return True
        if self.is_szin() and other.is_szin() and self.val == other.val and self.suite == other.suite:
            return True
        return False

    def __ne__(self, other):
        if self.__eq__(other):
            return False
        return True

    def __str__(self):
        if self.is_tarokk():
            return str(self.num)
        return self.suite.name + " " + self.val.name

    def __repr__(self):
        if self.is_tarokk():
            return str(self.num)
        return self.suite.name + " " + self.val.name

class Tarokk(Card):

    def __init__(self, num):
        if num < 1 or num > 22:
            raise te.InternalError("No such tarokk value!")
        self.num = num

    def __str__(self):
        return str(self.num)

    def __repr__(self):
        return str(self.num)

class Suite(Enum):
    treff = 1
    kor = 2
    pikk = 3
    karo = 4

class Val(Enum):
    asz = 1
    bubi = 2
    lovas = 3
    dama = 4
    kiraly = 5

class Szin(Card):

    def __init__(self, suite, val):
        if not isinstance(suite, Suite):
            raise te.InternalError("Not a valid suite: " + str(suite))
        if not isinstance(val, Val):
            raise te.InternalError("Not a valid value for szin: " + str(val))
        self.val = val
        self.suite = suite

    def __str__(self):
        return self.suite.name + " " + self.val.name

    def __repr__(self):
        return self.suite.name + " " + self.val.name

