import * as core from './_core.js';

let module = new core.Module('assist-scale-enemy-hp');

// TODO: Figure out how to update the health values for all enemy types if the
// option gets changed mid-game.

// Finer steps, unfortunately, break the handle of the slider (they make it too
// short to fit the percentage text).
sc.ASSIST_SCALE_ENEMY_HP = {
  LOW5: 0.5,
  LOW4: 0.6,
  LOW3: 0.7,
  LOW2: 0.8,
  LOW1: 0.9,
  NORM: 1,
};

let myOptionKey = module.getRawOptionName('factor');
let myOptionGroup = 'combat';
let myOptionDef = {
  type: 'OBJECT_SLIDER',
  data: sc.ASSIST_SCALE_ENEMY_HP,
  init: sc.ASSIST_SCALE_ENEMY_HP.NORM,
  cat: sc.OPTION_CATEGORY.ASSISTS,
  fill: true,
  showPercentage: true,
};

{
  // Here I inject my option at the end of the group related to enemy attacks
  // (damage factor and attack frequency) in the "Assists" tab. The logic is a
  // little bit wonky, but it gets the job done.

  let newOptionsDefinition = {};
  let currentGroup = null;
  let foundOptionInjectionPlace = false;

  for (let [otherOptionKey, otherOptionDef] of Object.entries(sc.OPTIONS_DEFINITION)) {
    if (otherOptionDef.cat === myOptionDef.cat) {
      let nextGroup = otherOptionDef.header;
      if (nextGroup != null) {
        if (currentGroup === myOptionGroup && nextGroup !== myOptionGroup) {
          newOptionsDefinition[myOptionKey] = myOptionDef;
          foundOptionInjectionPlace = true;
        }
        currentGroup = nextGroup;
      }
    }

    newOptionsDefinition[otherOptionKey] = otherOptionDef;
  }

  if (!foundOptionInjectionPlace) {
    // Give up and just put the option somewhere.
    newOptionsDefinition[myOptionKey] = myOptionDef;
  }
  sc.OPTIONS_DEFINITION = newOptionsDefinition;
}

sc.twk.ScaleEnemyHpMod = ig.GameAddon.extend({
  factor: 0,
  ignoredEnemyIds: null,

  init() {
    this.parent('ScaleEnemyHpAddon');

    // Save the scale factor to prevent bugs when the user changes it mid-game,
    // but only the params of enemies whose types haven't been loaded so far
    // are updated. Better just tell the user explicitly to restart the game.
    this.factor = sc.options.get(myOptionKey);

    // prettier-ignore
    this.ignoredEnemyIds = new Set([
      'boss.cargo-crab', 'boss.cargo-crab-extra', 'enemies.turret-rhombus', 'boss.hedgehag-king',
      'enemies.hedgehog-boss', 'enemies.frobbit-miniboss-gallant', 'enemies.frobbit-miniboss-femme',
      'enemies.gray-frobbit', 'enemies.snowman-jungle-1', 'enemies.snowman-jungle-2',
      'enemies.snowman-xmas', 'enemies.snowman-sand', 'enemies.meerkat-special-command-1',
      'enemies.turret-arid-boss', 'enemies.megamoth', 'enemies.jungle-sloth-black',
      'enemies.boss-samurai', 'boss.glitch-boss', 'enemies.sandworm-boss', 'enemies.jungle-ape',
      'enemies.jungle-shockboss', 'boss.whale', 'enemies.jungle-waveboss', 'enemies.panda-alt',
      'boss.scorpion-boss', 'enemies.turret-large', 'enemies.guards', 'enemies.guard-mustache',
      'enemies.pillar-large', 'enemies.jungle-fish-boss', 'enemies.goat-father', 'npc.designer',
      'enemies.sandshark-special', 'enemies.sandshark-ghost', 'boss.fish-mega-gear',
      'enemies.henry', 'henry-prop', 'enemies.panda-alt', 'enemies.penguin-rapper',
      'boss.scorpion-boss', 'enemies.jungle-shockcat-black', 'boss.snow-megatank',
      'enemies.snow-megatank-orb', 'enemies.spider-alt', 'boss.elephant', 'enemies.elboss-core',
      'boss.driller', 'enemies.default-bot', 'enemies.icewall', 'enemies.aircon', 'enemies.oven',
      'enemies.turret-baki-mortar-1', 'enemies.dummy', 'enemies.target-bot-2',
    ]);

    for (let [enemyId, enemy] of Object.entries(ig.database.get('enemies'))) {
      if (!this.ignoredEnemyIds.has(enemyId)) {
        this.patchEnemyParams(enemy.params);
      }
    }
  },

  patchEnemyParams(params) {
    if (params != null && params.hp != null) {
      // NOTE: Fractional values break some `sc.NumerGui`s.
      params.hp = Math.round(params.hp * this.factor);
    }
  },
});

sc.GameModel.inject({
  isAssistMode() {
    // A non-strict comparison is used for consistency with the base game
    // implementation.
    return this.parent() || sc.twk.scaleEnemyHpMod.factor != 1;
  },
});

sc.EnemyType.inject({
  onload(data) {
    let mod = sc.twk.scaleEnemyHpMod;
    if (!mod.ignoredEnemyIds.has(this.path) && data != null) {
      mod.patchEnemyParams(data.params);
      if (data.elementModes != null) {
        for (let params of Object.values(data.elementModes)) {
          mod.patchEnemyParams(params);
        }
      }
    }

    return this.parent(data);
  },
});

ig.addGameAddon(() => {
  let addon = new sc.twk.ScaleEnemyHpMod();
  sc.twk.scaleEnemyHpMod = addon;
  return addon;
});
