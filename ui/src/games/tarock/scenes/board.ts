import { Bidding, Phase } from "./../data/gamestate";
import { LanguageConfig } from "./../language/languages";
import { Suite } from "../data/card";
import { GameController } from "./../control/gameController";
import { Card } from "../data/card";
import { Deck } from "../data/deck";
import { GameState, Main, StateData } from "../data/gamestate";
import { ActivableButton } from "../objects/button";
import { assertNever } from "../utils/utils";
import { ToyController } from "../control/toyController";

import Vector2 = Phaser.Math.Vector2;

export interface BoardConfig {
  languageConfig: LanguageConfig;
  controller: GameController;
}

export class BoardScene extends Phaser.Scene {
  private gameHeight: number;
  private gameWidth: number;
  private scaleRatio: number;

  private bezierGraphics: Phaser.GameObjects.Graphics;
  private bezierCurve: Phaser.Curves.CubicBezier;

  private gameState: GameState;
  private board: Phaser.GameObjects.Rectangle;

  private trickHolders: Phaser.Geom.Rectangle[] = [];
  private trickGraphics: Phaser.GameObjects.Graphics;

  private cardSize: { width: number; height: number };

  private _gameController: GameController;

  private myCardsInHand: Phaser.GameObjects.Group;

  private biddingButtons: ActivableButton[] = [];

  private lc: LanguageConfig;

  private thisPlayerId: string;

  private previousPhase: Phase;

  private markedForExchange: Card[] = [];

  private exchangeButton: ActivableButton;

  private cardDragStart: {
    x: number;
    y: number;
    rotation: number;
  } | null;

  constructor() {
    super({
      key: "game-board",
      active: false
    });
    this.thisPlayerId = "me";
  }

  preload(): void {
    let deck: Deck = new Deck();
    for (let card of deck.cards) {
      this.load.image(card.key, card.makeAssetName());
    }
    this.load.image("card_back", "src/games/tarock/assets/cards/card_back.jpg");
  }

  init(data: BoardConfig): void {
    this.gameController = data.controller;
    this.lc = data.languageConfig;

    this.scaleRatio = window.devicePixelRatio / 3.0;
    this.gameHeight = this.sys.canvas.height;
    this.gameWidth = this.sys.canvas.width;

    // this.gameState = GameState.initialState;
  }

  create(): void {
    const img = this.game.textures.get("card_back").source[0];
    this.cardSize = { width: img.width, height: img.height };

    this.myCardsInHand = this.add.group();
    this.bezierGraphics = this.add.graphics();

    // this.input.on("drag", (pointer, gameObject, x, y) => {
    //   if (!this.cardDragStart) {
    //     this.cardDragStart = {
    //       x: gameObject.x,
    //       y: gameObject.y,
    //       rotation: gameObject.rotation
    //     };
    //     gameObject.setRotation(0);
    //   }

    //   gameObject.x = x;
    //   gameObject.y = y;
    // });

    const asd = this.add.zone(this.centerX, this.centerY, 300, 300);
    asd.setDropZone(undefined, undefined);

    // this.input.on("drop", (pointer, gameObject, dropZone) => {
    //   gameObject.x = dropZone.getCenter().x;
    //   gameObject.y = dropZone.getCenter().y;
    //   this.children.bringToTop(gameObject);
    //   this.input.setDraggable(gameObject, false);
    //   this.cardDragStart = null;
    // });

    // this.input.on("dragend", (pointer, gameObject, dropped) => {
    //   if (!dropped) {
    //     gameObject.x = this.cardDragStart.x;
    //     gameObject.y = this.cardDragStart.y;
    //     gameObject.setRotation(this.cardDragStart.rotation);
    //     this.cardDragStart = null;
    //   }
    // });

    this.initBoard();
    // this.drawMainPhase(null, this.gameState.state);
    // this.drawTrick();
    // this.initHandCurve();
    // this.drawBezier();
    // this.drawHand();
    // this.drawEnemyCards();

    this.add
      .graphics()
      .lineStyle(4, 0x000000)
      .strokeRectShape(asd.getBounds());

    this.initBiddingButtons();
    // this.drawBiddingButtons();
    // this.drawEnemyCards();
    // this.drawTalon();
    this.drawPatrnerCallingControl(new Deck().cards.slice(0, 9));
  }

  private makeBiddingCb(bid: number | null): () => Promise<boolean> {
    return () => {
      return this._gameController.bid(bid);
    };
  }

  private initBiddingButtons() {
    this.biddingButtons = [
      new ActivableButton(
        this,
        this.gameWidth - 260,
        this.gameHeight - 180,
        100,
        40,
        this.lc.text.phase.bidding.three
      ).onClick(this.makeBiddingCb(3)),
      new ActivableButton(
        this,
        this.gameWidth - 150,
        this.gameHeight - 180,
        100,
        40,
        this.lc.text.phase.bidding.two
      ).onClick(this.makeBiddingCb(2)),
      new ActivableButton(
        this,
        this.gameWidth - 260,
        this.gameHeight - 130,
        100,
        40,
        this.lc.text.phase.bidding.one
      ).onClick(this.makeBiddingCb(1)),
      new ActivableButton(
        this,
        this.gameWidth - 150,
        this.gameHeight - 130,
        100,
        40,
        this.lc.text.phase.bidding.solo
      ).onClick(this.makeBiddingCb(0)),
      new ActivableButton(
        this,
        this.gameWidth - 195,
        this.gameHeight - 80,
        100,
        40,
        this.lc.text.phase.bidding.pass
      ).onClick(this.makeBiddingCb(null))
    ];
  }

  private drawBiddingButtons() {
    this.biddingButtons.forEach(button => {
      button.setInactive();
      if (!button.isDrawn) {
        button.add();
      }
    });
  }

  private removeBiddingButtons() {
    this.biddingButtons.forEach(button => {
      button.clear(true);
    });
  }

  private activateBiddingButtons(state: StateData, phase: Bidding) {
    if (state.currentPlayer !== "me") {
      return;
    }

    this.biddingButtons[4].setActive();

    this.biddingButtons.slice(0, 4).forEach((button, idx) => {
      if (state.currentPlayer !== "me") {
        button.setInactive();
        return;
      }

      if (!state.hand.some(card => card.isHonor())) {
        button.setInactive();
        return;
      }

      // TODO: additional checks on what bidding is enabled

      button.setActive();
    });
  }

  private drawExchangedCards(state: StateData, player: string) {
    const rotations = {
      bottom: 0,
      right: -Math.PI / 2,
      top: Math.PI,
      left: Math.PI / 2
    };

    const exchangeLeftHandPositions = {
      bottom: { x: (5 * this.gameWidth) / 16, y: (6 * this.gameHeight) / 8 },
      right: { x: (13 * this.gameWidth) / 16, y: (5 * this.gameHeight) / 8 },
      top: { x: (11 * this.gameWidth) / 16, y: (2 * this.gameHeight) / 8 },
      left: { x: (3 * this.gameWidth) / 16, y: (3 * this.gameHeight) / 8 }
    };

    const exchangeRightHandPositions = {
      bottom: { x: (11 * this.gameWidth) / 16, y: (6 * this.gameHeight) / 8 },
      right: { x: (13 * this.gameWidth) / 16, y: (3 * this.gameHeight) / 8 },
      top: { x: (5 * this.gameWidth) / 16, y: (2 * this.gameHeight) / 8 },
      left: { x: (3 * this.gameWidth) / 16, y: (5 * this.gameHeight) / 8 }
    };

    const playerPosition = Object.keys(state.positions).find(
      idx => state.positions[idx] === player
    );

    const dealerPosition = Object.keys(state.positions).find(
      idx => state.positions[idx] === state.dealer
    );

    const playerExchanged = state.exchanged.filter(
      exch => exch.player === player
    );
    if (playerExchanged.length > 0) {
      const playerCardCount = playerExchanged[0].count;
      this.drawExchangeCardsFor(
        rotations[playerPosition],
        exchangeLeftHandPositions[playerPosition],
        playerCardCount
      );
    }

    const othersCardCount = state.exchanged
      .filter(exch => exch.player !== player)
      .reduce((a, b) => a + b.count, 0);
    if (othersCardCount > 0) {
      this.drawExchangeCardsFor(
        rotations[dealerPosition],
        exchangeRightHandPositions[dealerPosition],
        othersCardCount
      );
    }
  }

  private drawExchangeCardsFor(
    rotation: number,
    center: { x: number; y: number },
    count: number
  ): void {
    const playerCenter = new Phaser.Curves.Line(
      new Vector2(
        center.x - Math.sin(rotation - Math.PI / 2) * count * 20,
        center.y - Math.cos(rotation - Math.PI / 2) * count * 20
      ),
      new Vector2(
        center.x + Math.sin(rotation - Math.PI / 2) * count * 20,
        center.y + Math.cos(rotation - Math.PI / 2) * count * 20
      )
    );

    this.drawOneEnemyHand(playerCenter, count, rotation);
  }

  private drawPatrnerCallingControl(validCards: Card[]) {
    const controlRect = this.add.rectangle(
      this.centerX,
      this.centerY,
      (3 * this.gameWidth) / 5,
      (3 * this.gameHeight) / 5,
      0x000000
    );
    const vec = controlRect.getCenter();

    const rightEnd = vec
      .clone()
      .add(
        new Phaser.Math.Vector2(
          (validCards.length / 2) * (this.cardSize.width + 10),
          0
        )
      );
    const leftEnd = vec
      .clone()
      .add(
        new Phaser.Math.Vector2(
          (-validCards.length / 2) * (this.cardSize.width + 10),
          0
        )
      );

    var line = new Phaser.Curves.Line(leftEnd, rightEnd);

    this.drawCardsOnLine(line, this.keysForCards(validCards), 0);
    const text = this.add.text(
      vec.x,
      vec.y - 2 * controlRect.height / 5,
      this.lc.text.phase.partnerCalling.callPartner,
      { fill: "#ffffff" }
    );

    const bounds = text.getBounds();
    text.x -= bounds.width / 2;
    text.y -= bounds.height / 2;

    const gfx = this.add
      .graphics()
      .lineStyle(4, 0x777777)
      .strokeRect(
        controlRect.x - 1 - controlRect.width / 2,
        controlRect.y - 1 - controlRect.height / 2,
        controlRect.width + 1,
        controlRect.height + 1
      );
  }

  private drawFromState(state: GameState): void {
    const phase = state.phase;
    switch (phase.kind) {
      case "pre-game":
        break;
      case "bidding":
        this.drawBiddingButtons();
        this.drawHand(state.state);
        this.drawEnemyCards(state.state);
        this.drawTalon();
        this.activateBiddingButtons(state.state, phase);
        break;
      case "exchanging":
        this.removeBiddingButtons();
        // this.removeTalon
        this.drawHand(state.state);
        this.drawEnemyCards(state.state);
        this.liftHandCardsOnHover(state.state);
        this.drawExchangedCards(state.state, phase.player);
        break;
      case "partner-calling":
        this.removeExchangeButton();

        break;
      case "figures":
        this.removeExchangeButton();
        // this.drawFigureButtons();
        break;
      case "main":
      case "waiting":
        break;
      default:
        return assertNever(phase);
    }
    this.previousPhase = state.phase;
  }

  private removeExchangeButton(): void {
    if (this.exchangeButton) {
      this.exchangeButton.clear(true);
      this.exchangeButton = null;
    }
  }

  private initBoard(): void {
    this.add
      .rectangle(0, 0, this.gameWidth, this.gameHeight, 0x61e85b, 0.3)
      .setOrigin(0, 0);
    this.board = this.add
      .rectangle(
        80,
        80,
        this.gameWidth - 160,
        this.gameHeight - 160,
        0xffffff,
        0.6
      )
      .setOrigin(0, 0);

    this.trickGraphics = this.add.graphics();
  }

  private drawTalon() {
    // TODO: clear talon

    const center = new Phaser.Curves.Line(
      new Vector2(this.centerX - 120, this.centerY),
      new Vector2(this.centerX + 120, this.centerY)
    );

    this.drawOneEnemyHand(center, 6, 0);
  }

  private computeHandCurve(cards: number): Phaser.Curves.CubicBezier {
    const distance = ((this.cardSize.width / 3.0) * cards) / 2.0;

    const start = new Vector2(
      this.gameWidth / 2 - distance,
      this.gameHeight - 100
    );
    const end = new Vector2(
      this.gameWidth / 2 + distance,
      this.gameHeight - 100
    );

    const c1 = new Vector2(
      this.gameWidth / 2 - distance + 50,
      this.gameHeight - 200
    );
    const c2 = new Vector2(
      this.gameWidth / 2 + distance - 50,
      this.gameHeight - 200
    );

    const bezier = new Phaser.Curves.CubicBezier(start, c1, c2, end);

    return bezier;
  }

  private drawMainPhase(phase: Main, state: StateData): void {
    // this.drawTrick(phase);
    // this.drawHand(state);
  }

  private drawBezier(curve: Phaser.Curves.CubicBezier): void {
    this.bezierGraphics.clear();
    this.bezierGraphics.lineStyle(4, 0x000000);
    curve.draw(this.bezierGraphics);
  }

  private drawHand(state: StateData): void {
    this.myCardsInHand.clear(true);

    const handBezier = this.computeHandCurve(state.hand.length);

    const length = handBezier.getLength();
    const distance = length / (state.hand.length - 1);

    const rotationDistance = 90 / (state.hand.length - 1);

    let i = 0;
    for (let p of handBezier.getDistancePoints(distance)) {
      if (i >= state.hand.length) {
        break;
      }

      const angle = Phaser.Math.DegToRad(-45 + i * rotationDistance);

      const cardInHand = this.add
        .image(p.x, p.y, state.hand[i++].key)
        .setRotation(angle)
        .setInteractive();
      this.myCardsInHand.add(cardInHand, true);
      this.input.setDraggable(cardInHand);
    }

    this.drawBezier(handBezier);
  }

  private isCardSelectedForExchange(state: StateData, index: number): boolean {
    return this.markedForExchange.indexOf(state.hand[index]) >= 0;
  }

  private drawEndExchangeButton(): void {
    if (this.exchangeButton) {
      return;
    }

    this.exchangeButton = new ActivableButton(
      this,
      this.gameWidth - 195,
      this.gameHeight - 130,
      100,
      40,
      this.lc.text.phase.exchanging.endExchange
    )
      .onClick(() => this._gameController.exchange(this.markedForExchange))
      .setInactive()
      .add();
  }

  private handleExchangeButtonActivation(cardsInHand: number): void {
    if (cardsInHand - this.markedForExchange.length === 9) {
      this.exchangeButton.setActive();
      return;
    }
    this.exchangeButton.setInactive();
  }

  private liftHandCardsOnHover(state: StateData) {
    if (
      state.exchanged.filter(exch => exch.player === this.thisPlayerId).length >
      0
    ) {
      this.removeExchangeButton();
      return;
    }

    this.drawEndExchangeButton();

    const maxExchangable = state.hand.length - 9;

    this.myCardsInHand.children.entries.forEach((cardInHand, idx) => {
      const card = cardInHand as Phaser.GameObjects.Image;

      cardInHand.on("pointerover", () => {
        if (this.markedForExchange.length === maxExchangable) {
          return;
        }
        if (this.isCardSelectedForExchange(state, idx)) {
          return;
        }

        const rot = card.rotation;
        card.x += Math.sin(rot) * 50;
        card.y -= Math.cos(rot) * 50;
      });

      cardInHand.on("pointerout", () => {
        if (this.markedForExchange.length === maxExchangable) {
          return;
        }
        if (this.isCardSelectedForExchange(state, idx)) {
          return;
        }

        const rot = card.rotation;
        card.x -= Math.sin(rot) * 50;
        card.y += Math.cos(rot) * 50;
      });

      cardInHand.on("pointerup", () => {
        const exchIdx = this.markedForExchange.indexOf(state.hand[idx]);
        if (exchIdx < 0) {
          if (this.markedForExchange.length === maxExchangable) {
            return;
          }

          this.markedForExchange.push(state.hand[idx]);
          this.handleExchangeButtonActivation(state.hand.length);
          return;
        }

        this.markedForExchange.splice(exchIdx, 1);
        this.handleExchangeButtonActivation(state.hand.length);
      });
    });
  }

  private drawCardsOnLine(
    line: Phaser.Curves.Line,
    cardKeys: string[],
    rotation: number
  ): void {
    const distance = line.getLength() / (cardKeys.length - 1);
    let i = 0;
    for (let p of line.getDistancePoints(distance)) {
      if (i >= cardKeys.length) {
        break;
      }
      this.add.image(p.x, p.y, cardKeys[i]).setRotation(rotation);
      i++;
    }
  }

  private keysForCards(cards: Card[]): string[] {
    return cards.map(c => c.key);
  }

  private drawOneEnemyHand(
    line: Phaser.Curves.Line,
    handCount: number,
    rotation: number
  ): void {
    this.drawCardsOnLine(
      line,
      new Array(handCount).map(_ => "card_back"),
      rotation
    );
  }

  private drawEnemyCards(state: StateData): void {
    // TODO: clear them first

    const rightSide = new Phaser.Curves.Line(
      new Vector2(this.gameWidth - 80, this.gameHeight / 2 - 200),
      new Vector2(this.gameWidth - 80, this.gameHeight / 2 + 200)
    );

    const top = new Phaser.Curves.Line(
      new Vector2(this.gameWidth / 2 + 200, 100),
      new Vector2(this.gameWidth / 2 - 200, 100)
    );

    const leftSide = new Phaser.Curves.Line(
      new Vector2(80, this.gameHeight / 2 + 200),
      new Vector2(80, this.gameHeight / 2 - 200)
    );

    this.drawOneEnemyHand(
      rightSide,
      state.handCounts[state.positions.right],
      Math.PI / -2
    );

    this.drawOneEnemyHand(top, state.handCounts[state.positions.top], Math.PI);

    this.drawOneEnemyHand(
      leftSide,
      state.handCounts[state.positions.left],
      Math.PI / 2
    );
  }

  private drawTrick(phase: Main): void {
    const padding = 20;
    this.trickHolders[2] = new Phaser.Geom.Rectangle(
      this.centerX - this.cardSize.width / 2,
      this.centerY - padding - this.cardSize.height - this.cardSize.width / 2,
      this.cardSize.width,
      this.cardSize.height
    );
    this.trickHolders[1] = new Phaser.Geom.Rectangle(
      this.centerX + this.cardSize.width / 2 + padding,
      this.centerY - this.cardSize.width / 2,
      this.cardSize.height,
      this.cardSize.width
    );
    this.trickHolders[0] = new Phaser.Geom.Rectangle(
      this.centerX - this.cardSize.width / 2,
      this.centerY + padding + this.cardSize.width / 2,
      this.cardSize.width,
      this.cardSize.height
    );
    this.trickHolders[3] = new Phaser.Geom.Rectangle(
      this.centerX - this.cardSize.height - this.cardSize.width / 2 - padding,
      this.centerY - this.cardSize.width / 2,
      this.cardSize.height,
      this.cardSize.width
    );

    this.trickGraphics.clear();
    this.trickGraphics.lineStyle(2, 0x000000);

    this.trickHolders.forEach(holder =>
      this.trickGraphics.strokeRectShape(holder)
    );
    phase.onTable.forEach((card, idx) => {
      if (card) {
        const angle = 2 * Math.PI - (idx * Math.PI) / 2;
        this.add
          .image(
            this.trickHolders[idx].centerX,
            this.trickHolders[idx].centerY,
            card.key
          )
          .setRotation(angle);
      }
    });
  }

  private get centerX() {
    return this.gameWidth / 2;
  }

  private get centerY() {
    return this.gameHeight / 2;
  }

  set gameController(controller: GameController) {
    this._gameController = controller;
    this._gameController.onGameUpdated(newState => {
      this.gameState = newState;
      this.drawFromState(newState);
    });
  }
}
