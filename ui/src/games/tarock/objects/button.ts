export class ActivableButton extends Phaser.GameObjects.Group {
  readonly button: Phaser.GameObjects.Rectangle;
  readonly text: Phaser.GameObjects.Text;

  private isActive;
  private _onClick: () => void;
  private _isDrawn: boolean;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    txt: string
  ) {
    const btn = new Phaser.GameObjects.Rectangle(scene, x, y, width, height);
    const textInside = new Phaser.GameObjects.Text(
      scene,
      x,
      y,
      txt,
      {
        fill: "#ffffff",
        align: "center",
        boundsAlignH: "center",
        boundsAlignV: "middle"
      }
    );
    const bounds = textInside.getBounds();
    textInside.x -= bounds.width / 2;
    textInside.y -= bounds.height / 2;

    super(scene, [btn, textInside]);

    this.button = btn;
    this.text = textInside;
    this._isDrawn = false;

    this.button.setInteractive().on("pointerup", () => {
      if (!this.isActive || !this._onClick) {
        return;
      }

      this._onClick();
    });
  }

  setActive(): this {
    this.button.setFillStyle(0xff0000);
    this.button.input.cursor = "pointer";
    this.isActive = true;
    return this;
  }

  setInactive(): this {
    this.button.setFillStyle(0xbbbbbb);
    this.button.input.cursor = "default";
    this.isActive = false;
    return this;
  }

  toggleActive(): this {
    if (this.isActive) {
      return this.setInactive();
    }
    return this.setActive();
  }

  onClick(callback: () => void): this {
    this._onClick = callback;
    return this;
  }

  add(): this {
    this.scene.add.existing(this.button);
    this.scene.add.existing(this.text);
    this._isDrawn = true;
    return this;
  }

  get isDrawn(): boolean {
    return this._isDrawn;
  }

}
