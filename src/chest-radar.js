import * as core from './_core.js';

let module = new core.Module('chest-radar');
let optIdEnable = module.addOption('enable', { type: 'CHECKBOX', init: false });

const ICON = { x: 64, y: 288, w: 8, h: 8 };

sc.MapCurrentRoomWrapper.inject({
  updateDrawables(renderer) {
    this.parent(renderer);

    if (!sc.options.get(optIdEnable)) return;

    let allEntities = ig.game.shownEntities;
    for (let i = 0, len = allEntities.length; i < len; i++) {
      let entity = allEntities[i];
      if (entity == null || entity._killed) continue;

      if (entity instanceof ig.ENTITY.Chest && !entity.isOpen) {
        let x = entity.coll.pos.x * (this.hook.size.x / ig.game.size.x);
        let y = entity.coll.pos.y * (this.hook.size.y / ig.game.size.y);

        renderer.addGfx(
          this.gfx,
          Math.round(x - ICON.w / 2),
          Math.round(y - ICON.h / 2),
          ICON.x,
          ICON.y,
          ICON.w,
          ICON.h,
        );
      }
    }
  },
});
