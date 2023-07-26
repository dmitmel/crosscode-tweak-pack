import * as core from './_core.js';

let module = new core.Module('right-mouse-rebind');

sc.RIGHT_MOUSE_REBIND = {
    NORMAL: 0, // Default game behavior
    MELEE: 1, // Replace dash/guard with melee
    DASH: 2, // Dash only on right mouse button
    GUARD: 3 // Guard only on right mouse button
};

let myOptionKey = module.getRawOptionName('right-mouse');
let myOptionDef = {
    type: 'OBJECT_SLIDER',
    data: sc.RIGHT_MOUSE_REBIND,
    init: sc.RIGHT_MOUSE_REBIND.NORMAL,
    cat: sc.OPTION_CATEGORY.GENERAL,
    fill: true
};

sc.OPTIONS_DEFINITION[myOptionKey] = myOptionDef;

// Rebind mouse2 (left mouse button)
sc.CrossCode.inject({
    update() {
        this.parent()
        var opt = sc.options.get(myOptionKey);

        if (opt == sc.RIGHT_MOUSE_REBIND.MELEE){
            ig.input.bind(ig.KEY.MOUSE2,"melee");
        }
        else if (opt == sc.RIGHT_MOUSE_REBIND.GUARD){
            ig.input.bind(ig.KEY.MOUSE2,"guard");
        }
        else{ // Covers if NORMAL or DASH is selected
            ig.input.bind(ig.KEY.MOUSE2,"dash"); // This is what the game defaults to
        }

    }
});

// If right mouse button is set to dashing only, remove the ability to guard using dash buttons
// By default, performing a dash will also guard if standing still
sc.Control.inject({
    guarding() {
        var opt = sc.options.get(myOptionKey);
        if (opt == sc.RIGHT_MOUSE_REBIND.DASH){ // ig.input.state("dash") has been removed from default logic
            return this.autoControl ? this.autoControl.get("guarding") :
                (ig.input.state("guard") || ig.gamepad.isButtonDown(ig.BUTTONS.FACE1) || ig.gamepad.isButtonDown(this._getDashButton())) && !ig.interact.isBlocked()
        }
        else { // This logic is the default game logic
            return this.autoControl ? this.autoControl.get("guarding") :
                (ig.input.state("dash") || ig.input.state("guard") || ig.gamepad.isButtonDown(ig.BUTTONS.FACE1) || ig.gamepad.isButtonDown(this._getDashButton())) && !ig.interact.isBlocked()
        } 
    }
});
