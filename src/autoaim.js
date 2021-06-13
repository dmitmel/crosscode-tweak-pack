import * as core from './_core.js';

let module = new core.Module('autoaim');
let optIdEnable = module.addOption('enable', { type: 'CHECKBOX', init: false });

ig.ENTITY.Crosshair.inject({
  // Normally the `this._getThrowerPos` method is used to calculate where the
  // balls are thrown _from_ in almost screen coordinates, but we can repurpose
  // it to calculate where the balls should be thrown _at_ to hit an entity.
  _getThrowPosForEntity(outVec2, entity) {
    let realThrower = this.thrower;
    try {
      this.thrower = entity;
      return this._getThrowerPos(outVec2);
    } finally {
      this.thrower = realThrower;
    }
  },
});

// these two constants will come in handy later, see `focusNextEntity`
const ENTITY_FOCUS_DIRECTION = {
  FARTHER: 1,
  CLOSER: -1,
};

// buffer vectors for calculations
let vec2a = Vec2.create();
let vec2b = Vec2.create();

sc.PlayerCrossHairController.inject({
  focusedEntity: null,
  prevMousePos: Vec2.createC(-1, -1),

  updatePos(...args) {
    // gamepad mode is unsupported because I don't have one to test this code on
    if (this.gamepadMode) {
      this.parent(...args);
      return;
    }

    if (!sc.options.get(optIdEnable)) {
      this.focusedEntity = null;
      this.parent(...args);
      return;
    }

    let [crosshair] = args;

    // focus the next available entity if this combatant is e.g. dead
    if (this.focusedEntity != null && !this.shouldEntityBeFocused(this.focusedEntity)) {
      this.focusNextEntity(crosshair, ENTITY_FOCUS_DIRECTION.CLOSER);
    }

    let mouseX = sc.control.getMouseX();
    let mouseY = sc.control.getMouseY();
    if (
      this.focusedEntity != null &&
      // unfocus if the mouse has been moved
      (this.prevMousePos.x !== mouseX || this.prevMousePos.y !== mouseY)
    ) {
      this.focusedEntity = null;
    }
    Vec2.assignC(this.prevMousePos, mouseX, mouseY);

    // handle controls
    let pressedFocusCloser = ig.input.pressed('circle-left');
    let pressedFocusFarther = ig.input.pressed('circle-right');
    if (pressedFocusCloser) {
      this.focusNextEntity(crosshair, ENTITY_FOCUS_DIRECTION.CLOSER);
    }
    if (pressedFocusFarther) {
      this.focusNextEntity(crosshair, ENTITY_FOCUS_DIRECTION.FARTHER);
    }
    if ((pressedFocusCloser || pressedFocusFarther) && this.focusedEntity == null) {
      sc.BUTTON_SOUND.denied.play();
    }

    if (this.focusedEntity != null) {
      this.calculateCrosshairPos(crosshair);
    } else {
      this.parent(...args);
    }
  },

  focusNextEntity(crosshair, direction) {
    let throwerPos = crosshair._getThrowerPos(vec2a);

    function getSqrDistToEntity(entity) {
      let entityPos = crosshair._getThrowPosForEntity(vec2b, entity);
      return Vec2.squareDistance(throwerPos, entityPos);
    }

    let prevFocusedEntity = this.focusedEntity;
    let prevFocusedSqrDist =
      prevFocusedEntity != null ? getSqrDistToEntity(prevFocusedEntity) : null;
    this.focusedEntity = null;

    let closestNextEntitySqrDist = null;
    for (let entity of this.findFocusingCandidateEntities()) {
      if (entity === prevFocusedEntity) continue;

      let sqrDist = getSqrDistToEntity(entity);
      if (
        // multiplication by `dirFactor` effectively inverts the comparison
        // operator when it is negative, otherwise logically the expression
        // stays the same
        (prevFocusedSqrDist == null || sqrDist * direction > prevFocusedSqrDist * direction) &&
        (closestNextEntitySqrDist == null ||
          sqrDist * direction < closestNextEntitySqrDist * direction)
      ) {
        closestNextEntitySqrDist = sqrDist;

        this.focusedEntity = entity;
      }
    }
  },

  shouldEntityBeFocused(combatant) {
    return (
      !combatant.isDefeated() &&
      // `sc.ENEMY_AGGRESSION.TEMP_THREAT` exists, but to be honest I have no
      // idea what it is supposed to do
      combatant.aggression === sc.ENEMY_AGGRESSION.THREAT
    );
  },

  findFocusingCandidateEntities() {
    let allCombatants = sc.combat.activeCombatants[sc.COMBATANT_PARTY.ENEMY];
    let candidates = allCombatants.filter((enemy) => this.shouldEntityBeFocused(enemy));

    if (candidates.length === 0) {
      candidates = ig.game.shownEntities.filter(
        (entity) =>
          entity != null &&
          !entity._killed &&
          entity instanceof ig.ENTITY.Enemy &&
          ig.CollTools.isInScreen(entity.coll) &&
          this.shouldEntityBeFocused(entity),
      );
    }

    return candidates;
  },

  calculateCrosshairPos(crosshair) {
    let { thrower } = crosshair;
    let throwerPos = crosshair._getThrowerPos(vec2a);
    let entityPos = crosshair._getThrowPosForEntity(vec2b, this.focusedEntity);
    let entityVel = this.focusedEntity.coll.vel;

    let ballInfo = sc.PlayerConfig.getElementBall(
      thrower,
      thrower.model.currentElementMode,
      // NOTE: This causes glitches when the ball speed affects the crosshair
      // position too much, in which case it begins jumping back and forth
      // because the charged status is reset due to the movement. I hope this
      // isn't to much of a problem.
      crosshair.isThrowCharged(),
    );
    let ballSpeed = ballInfo.data.speed;

    let crosshairPos = crosshair.coll.pos;
    Vec2.assign(crosshairPos, entityPos);
    // perform entity movement prediction repeatedly to increase the precision
    for (let i = 0; i < 3; i++) {
      let t = Vec2.distance(throwerPos, crosshairPos) / ballSpeed;
      crosshairPos.x = entityPos.x + Math.round(entityVel.x) * t;
      crosshairPos.y = entityPos.y + Math.round(entityVel.y) * t;
    }
  },
});
