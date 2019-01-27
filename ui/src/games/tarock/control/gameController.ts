import { TypedEvent, Listener, Disposable } from "./../utils/typedEvent";
import { GameState } from "./../data/gamestate";
import { Card } from "../data/card";

export interface GameController {
  playCard(card: Card): Promise<boolean>;
  onGameUpdated(eventListener: Listener<GameState>): Disposable;
  bid(bid: number): Promise<boolean>;
  exchange(cards: Card[]): Promise<boolean>;
}
