/**
 * @author       Digitsensitive <digit.sensitivee@gmail.com>
 * @copyright    2018 Digitsensitive
 * @description  Snake: Game
 * @license      Digitsensitive
 */

/// <reference path="../../phaser.d.ts"/>

import "phaser";
import { Card, Suite } from "./data/card";
import { BoardScene, BoardConfig } from './scenes/board';
import { ToyController } from "./control/toyController";
import { LanguageConfig } from "./language/languages";

const config: GameConfig = {
  title: "Tarock",
  version: "1.1",
  width: window.innerWidth * window.devicePixelRatio,
  height: window.innerHeight * window.devicePixelRatio,
  zoom: 1,
  type: Phaser.AUTO,
  parent: "game",
  input: {
    keyboard: true,
    mouse: true,
    touch: true,
    gamepad: false
  },
  backgroundColor: "#000000",
  render: { pixelArt: true, antialias: true, autoResize: false }
};

const tarockConfig: BoardConfig = {
  controller: new ToyController(),
  languageConfig: new LanguageConfig()
}

export class Game extends Phaser.Game {
  constructor(config: GameConfig) {
    super(config);

    // const ctrl = new ToyController();
    // (this.scene.getScene("game-board") as BoardScene).gameController = ctrl;
    // setTimeout(
    //   () =>
    //     ctrl.updateState({
    //       caller: 0,
    //       trick: [new Card(Suite.Clubs, 3)],
    //       myHand: [],
    //       handCounts: [0, 0, 0]
    //     }),
    //   3000
    // );

  }

  start() {
    super.start();
    this.scene.add('game-board', BoardScene, true, tarockConfig);
  }
}

window.addEventListener("load", () => {
  var game = new Game(config);
});
