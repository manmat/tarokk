import player
import cards
import deck
import tarokk_errors

class Table():

    def __init__(self, ps):
        self.players = ps
        self.deck = deck.Deck()
        for p in self.players:
            p.add_cards(self.deck.draw_cards(9))

    def __str__(self):
        ret = ""
        for p in self.players:
            ret += str(p) + "\n"
        ret += str(self.deck)
        return ret

