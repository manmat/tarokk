export enum Suite {
  Clubs = "club",
  Spades = "spade",
  Hearts = "heart",
  Diamonds = "diamond",
  Tarock = "tarock"
}

export class Card {
  private _suite: Suite;
  private _rank: number;

  get suite(): Suite {
    return this._suite;
  }

  get rank(): number {
    return this._rank;
  }

  get key(): string {
    return `${this.suite}_${this.rank}`;
  }

  constructor(suite: Suite, rank: number) {
    this._suite = suite;
    this._rank = rank;
  }

  public makeAssetName(): string {
    return `src/games/tarock/assets/cards/${this._suite}_${this._rank}.jpg`;
  }

  public isHonor(): boolean {
    return this._suite === Suite.Tarock && [1, 21, 22].indexOf(this._rank) >= 0;
  }
}
