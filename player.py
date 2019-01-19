import tarokk_errors as te
import cards

class Hand:

    def __init__(self):
        self.cards = []

    def add_card(self, card):
        if not isinstance(card, cards.Card):
            raise te.InternalError("Can't add that to a hand: " + str(card))
        self.cards.append(card)

    def play_card(self, card):
        if not card in self.cards:
            raise te.InternalError("No such card in hand:" + str(card))
        self.cards.remove(card)

    def __str__(self):
        return str(self.cards)

    def __repr__(self):
        return str(self.cards)

    def __eq__(self, other):
        return self.cards == other.cards

class Player:

    def __init__(self):
        self.hand = Hand()

    def add_cards(self, cs):
        for c in cs:
            self.hand.add_card(c)

    def __str__(self):
        return str(self.hand)
