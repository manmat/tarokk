import { Deck } from "./../data/deck";
import { GameState } from "./../data/gamestate";
import { TypedEvent, Listener, Disposable } from "./../utils/typedEvent";
import { Card } from "../data/card";
import { GameController } from "./gameController";
import { Bidding } from "../data/gamestate";

export class ToyController implements GameController {
  private readonly _gameUpdated: TypedEvent<GameState>;
  private gameState: GameState;
  private deck = new Deck().shuffled();

  constructor() {
    this._gameUpdated = new TypedEvent<GameState>();
    this.gameState = {
      phase: {
        kind: "pre-game",
        firstPlayer: "me"
      },
      state: {
        positions: {
          right: "enemy1",
          top: "enemy2",
          left: "enemy3",
          bottom: "me"
        },
        players: [
          { name: "me" },
          { name: "enemy1" },
          { name: "enemy2" },
          { name: "enemy3" }
        ],
        handCounts: { me: 9, enemy1: 9, enemy2: 9, enemy3: 9 },
        currentPlayer: "me",
        myTeam: "unknown",
        hand: this.deck.cards.slice(0, 9),
        dealer: "me",
        exchanged: []
      }
    };

    window["toyController"] = this;
  }

  startGame(): void {
    this.updateState(state => {
      state.state.currentPlayer = "me";
      state.phase = {
        kind: "bidding",
        bids: [],
        isLastBid: false
      };
      return state;
    });
  }

  updateState(fn: (state: GameState) => GameState): void {
    this.gameState = fn(this.gameState);
    this._gameUpdated.emit(this.gameState);
  }

  playCard(card: Card): Promise<boolean> {
    return null;
  }

  async bid(bid: number): Promise<boolean> {
    const gs = this.gameState.phase as Bidding;
    gs.bids.push(bid);
    this.gameState.state.currentPlayer = this.nextPlayer();
    this._gameUpdated.emit(this.gameState);
    return true;
  }

  async exchange(cards: Card[]): Promise<boolean> {
    this.gameState.state.exchanged.push({player: "me", count: cards.length});
    
    for (let i = this.gameState.state.hand.length - 1; i >= 0; --i) {
      if (cards.indexOf(this.gameState.state.hand[i]) >= 0) {
        this.gameState.state.hand.splice(i, 1);
      }
    }

    this._gameUpdated.emit(this.gameState);
    return true;
  }

  endExchange(exchanges: { player: string, count: number}[]) {
    this.gameState.state.exchanged.push(...exchanges);
    this.gameState.phase = {
      kind: "figures",
      figures: []
    };
    this._gameUpdated.emit(this.gameState);
  }

  onGameUpdated(eventListener: Listener<GameState>): Disposable {
    return this._gameUpdated.on(eventListener);
  }

  endBidding(player: string, draws: { [key: string]: number }) {
    const meDraws = draws["me"];
    this.gameState.state.hand.push(...this.deck.cards.slice(10, 10 + meDraws));

    Object.keys(draws).forEach(player => {
      this.gameState.state.handCounts[player] += draws[player];      
    });
    this.gameState.phase = { kind: "exchanging", player: player };
    this._gameUpdated.emit(this.gameState);
  }

  private nextPlayer(): string {
    const positions = ["right", "top", "left", "bottom"];
    const a = {};
    for (let i = 0; i < positions.length; ++i) {
      a[positions[i]] = positions[(i + 1) % positions.length];
    }

    const currentPosition = Object.keys(this.gameState.state.positions).find(
      idx =>
        this.gameState.state.positions[idx] ===
        this.gameState.state.currentPlayer
    );

    const nextPosition = a[currentPosition];
    return this.gameState.state.positions[nextPosition];
  }
}
