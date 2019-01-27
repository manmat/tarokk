import { Deck } from './deck';
import { Bidding, Exchanging } from './gamestate';
import { Player } from './player';
import { Card, Suite } from "./card";

export type PlayerPosition = "right" | "top" | "left" | "bottom";

export interface StateData {
  readonly positions: { [K in PlayerPosition]: string }
  readonly players: Player[];
  readonly hand: Card[];
  readonly handCounts: { [key: string]: number };
  currentPlayer: string;
  myTeam: "enemy" | "friend" | "unknown";
  readonly dealer: string;
  readonly exchanged: { player: string, count: number }[];
}

export interface PreGame {
  readonly kind: "pre-game";
  readonly firstPlayer: string;
}

export interface Bidding {
  readonly kind: "bidding";
  readonly bids: (number | null)[];
  readonly isLastBid: boolean;
}

export interface Exchanging {
  readonly kind: "exchanging";
  readonly player: string;
}

export interface PartnerCalling {
  readonly kind: "partner-calling";
  readonly validPartners: Suite.Tarock[];
}

export interface Figures {
  readonly kind: "figures";
  readonly figures: Figure[][]
}

export interface Main {
  readonly kind: "main";
  readonly onTable: (Card | null)[];
  readonly tricks: { [key: string]: Card[][] } 
}

export interface Waiting {
  readonly kind: "waiting";
}

export type Phase = 
  | PreGame
  | Bidding
  | Exchanging
  | PartnerCalling
  | Figures
  | Main
  | Waiting

export interface GameState {
  phase: Phase;
  state: StateData;
}

export namespace GameState {
  // export const initialState: GameState = {
  //   phase: {
  //     kind: "pre-game",
  //     firstPlayer: null
  //   },
  //   state: {
  //     positions: { right: "a", top: "b", left: "c", bottom: "me" },
  //     players: [ { name: "me" }, { name: "a" }, { name: "b" }, { name: "c" }],
  //     hand: new Deck().shuffled().cards.slice(0, 9),
  //     handCounts: { "me": 9, "a": 9, "b": 9, "c": 9 },
  //     currentPlayer: "me",
  //     myTeam: "unknown"
  //   }
  // }
}