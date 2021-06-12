import * as core from './_core.js';

let module = new core.Module('player-position-marker');
let optIdEnable = module.addOption('enable', { type: 'CHECKBOX', init: false });

const ICON = { x: 280, y: 436, w: 10, h: 9 };

sc.MapCurrentRoomWrapper.inject({
  updateDrawables(renderer) {
    this.parent(renderer);

    if (!sc.options.get(optIdEnable)) return;

    let player = ig.game.playerEntity;
    let x = player.coll.pos.x * (this.hook.size.x / ig.game.size.x);
    let y = player.coll.pos.y * (this.hook.size.y / ig.game.size.y);

    renderer.addGfx(
      this.gfx,
      Math.round(x - ICON.w / 2),
      Math.round(y - ICON.h / 2),
      ICON.x,
      ICON.y,
      ICON.w,
      ICON.h,
    );
  },
});
