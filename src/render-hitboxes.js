import * as core from './_core.js';

let module = new core.Module('render-hitboxes');
let optIdEnable = module.addOption('enable', { type: 'CHECKBOX', init: false });

// see <https://github.com/CCDirectLink/crosscode-re-docs/blob/master/renderer.md>

const COLL_BOUNDS_PADDING = 0;
let collMinX = 0;
let collMinY = 0;
let collMaxX = 0;
let collMaxY = 0;

let tmpVec2 = Vec2.create();
function initCollBounds() {
  let pos = ig.system.getZoomMinOffset(tmpVec2);
  collMinX = pos.x + ig.game.screen.x;
  collMinY = pos.y + ig.game.screen.y;
  collMaxX = collMinX + ig.system.width / ig.system.zoom;
  collMaxY = collMinY + ig.system.height / ig.system.zoom;
}

// prettier-ignore
function collEntryIsVisible(px, py, pz, sx, sy, sz) {
  return (
    (px      + sx + COLL_BOUNDS_PADDING > collMinX) &&
    (px           - COLL_BOUNDS_PADDING < collMaxX) &&
    (py - pz + sy + COLL_BOUNDS_PADDING > collMinY) &&
    (py - pz - sz - COLL_BOUNDS_PADDING < collMaxY)
  );
}

let v000 = Vec2.create();
let v001 = Vec2.create();
let v010 = Vec2.create();
let v011 = Vec2.create();
let v100 = Vec2.create();
let v101 = Vec2.create();
let v110 = Vec2.create();
let v111 = Vec2.create();

function mapPos3ToScreenPos2(outVec2, x, y, z) {
  ig.system.getScreenFromMapPos(outVec2, x, y - z);
  outVec2.x = ig.system.getDrawPos(outVec2.x);
  outVec2.y = ig.system.getDrawPos(outVec2.y);
}

sc.twk.HitboxRendererMod = ig.GameAddon.extend({
  init() {
    this.parent('HitboxRendererMod');
  },

  postDrawOrder: 100,
  onPostDraw() {
    if (!sc.options.get(optIdEnable)) {
      return;
    }

    initCollBounds();

    let ctx = ig.system.context;
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'red';
    ctx.globalAlpha = 0.75;

    let allEntities = ig.game.shownEntities;
    for (let i = 0, len = allEntities.length; i < len; i++) {
      let entity = allEntities[i];
      if (entity == null || entity._killed) continue;

      let { pos, size, alwaysRender } = entity.coll;
      let px = pos.x;
      let py = pos.y;
      let pz = pos.z;
      let sx = size.x;
      let sy = size.y;
      let sz = size.z;

      if (!collEntryIsVisible(px, py, pz, sx, sy, sz) && !alwaysRender) {
        continue;
      }

      //
      // ^ z
      // |
      // o--> x
      // |
      // v y
      //
      // v001----v101
      // |          |
      // |          |
      // |          |
      // |          |
      // v011----v111
      //
      //
      //
      // v000----v100
      // |          |
      // |          |
      // |          |
      // |          |
      // v010----v110
      //

      // prettier-ignore
      {
        mapPos3ToScreenPos2(v000, px     , py     , pz     );
        mapPos3ToScreenPos2(v100, px + sx, py     , pz     );
        mapPos3ToScreenPos2(v010, px     , py + sy, pz     );
        mapPos3ToScreenPos2(v110, px + sx, py + sy, pz     );
        mapPos3ToScreenPos2(v001, px     , py     , pz + sz);
        mapPos3ToScreenPos2(v101, px + sx, py     , pz + sz);
        mapPos3ToScreenPos2(v011, px     , py + sy, pz + sz);
        mapPos3ToScreenPos2(v111, px + sx, py + sy, pz + sz);
      }

      ctx.beginPath();

      // bottom face
      ctx.moveTo(v000.x, v000.y);
      ctx.lineTo(v100.x, v100.y);
      ctx.lineTo(v110.x, v110.y);
      ctx.lineTo(v010.x, v010.y);
      ctx.closePath();

      // top face
      ctx.moveTo(v001.x, v001.y);
      ctx.lineTo(v101.x, v101.y);
      ctx.lineTo(v111.x, v111.y);
      ctx.lineTo(v011.x, v011.y);
      ctx.closePath();

      // front left edge
      ctx.moveTo(v011.x, v011.y);
      ctx.lineTo(v010.x, v010.y);
      // front right edge
      ctx.moveTo(v111.x, v111.y);
      ctx.lineTo(v110.x, v110.y);

      ctx.stroke();
    }

    ctx.restore();
  },
});

ig.addGameAddon(() => new sc.twk.HitboxRendererMod());
