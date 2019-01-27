import { Card, Suite } from "./card";
import ArrayUitls = Phaser.Utils.Array;

export class Deck {
  private _cards: Card[];

  constructor(cards: Card[] = Deck.generateDeck()) {
    this._cards = cards;
  }

  public shuffled(): Deck {
    return new Deck(ArrayUitls.Shuffle(this._cards));
  }

  get cards(): Card[] {
    return this._cards;
  }

  static generateDeck(): Card[] {
    let cards: Card[] = [];
    for (var i = 0; i < 22; ++i) {
      cards.push(new Card(Suite.Tarock, i + 1));
    }
    for (let suite of [
      Suite.Clubs,
      Suite.Diamonds,
      Suite.Hearts,
      Suite.Spades
    ]) {
      for (var i = 0; i < 5; ++i) {
        cards.push(new Card(suite, i + 1));
      }
    }
    return cards;
  }
}
