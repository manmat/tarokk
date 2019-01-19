import cards
import tarokk_errors
from random import shuffle

class Deck():

    def __init__(self):
        self.deck = []
        for i in range(1, 23):
            self.deck.append(cards.Tarokk(i))
        for v in cards.Val:
            for s in cards.Suite:
                self.deck.append(cards.Szin(s, v))
        shuffle(self.deck)

    def __str__(self):
        return str(self.deck)

    def __repr__(self):
        return str(self.deck)

    def draw_card(self):
        return self.deck.pop()

    def draw_cards(self, num):
        cs = []
        for i in range(num):
            cs.append(self.deck.pop())
        return cs
