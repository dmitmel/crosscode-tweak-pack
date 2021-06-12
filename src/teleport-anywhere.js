import * as core from './_core.js';

let module = new core.Module('teleport-anywhere');
let optIdEnable = module.addOption('enable', { type: 'CHECKBOX', init: false });

// Well, this code turned out to not be as straight-forward as I anticipated

const LANG_NAMESPACE = 'sc.gui.menu.map-menu.teleport-anywhere';

sc.MapAreaContainer.inject({
  // See below
  mouseWasOverWhenDragged: false,

  // This method is invoked on every frame if the current GUI element contains
  // the mouse pointer position. mouseOver is true when the pointer is
  // **directly** above the element (i.e. under the cursor position there is no
  // overlapping element over this one), mouseClicked is true when the element
  // has just been "clicked", more precisely when the GUI interaction ("aim",
  // commonly the left mouse button) button has been unpressed (although
  // unfortunately I can't make much use of it here).
  // Interestingly enough, this method is indeed called even if using a gamepad,
  // but I have no idea if it works or a gamepad to test that myself.
  onMouseInteract(mouseOver, mouseClicked) {
    // This variable *does not* have the same meaning as sc.menu.mapWasDragged,
    // see below.
    let mapWasBeingDragged = sc.menu.mapDrag;

    // NOTE: You better not add any other conditions around the parent method
    // or findMap (which is called internally), the logic is spaghetti enough
    // as it is.
    this.parent(mouseOver, mouseClicked);

    // Okay, now the real injected logic begins. First I perform the same bunch
    // of checks upfront that can be seen inside the default implementation.
    // More checks could be added in the future game updates, but that's highly
    // unlikely.
    if (
      !(
        !ig.interact.isBlocked() &&
        !mouseClicked &&
        sc.map.getCurrentArea() != null &&
        this.buttongroup.isActive() &&
        !sc.menu.mapLoading &&
        // although the stamp menu check wasn't present in the 0.7.0 source code
        !sc.menu.mapStampMenu
      )
    ) {
      return;
    }

    let mouseWasOverWhenDragged = this.mouseWasOverWhenDragged;
    this.mouseWasOverWhenDragged = mouseOver;

    // Alright, now I try to replicate a button GUI element without there being
    // one (unlike for landmarks or stamps). The main issue here is that
    // mouseClicked has no meaning here: when mouseClicked is true the body of
    // the default onMouseInteract is simply skipped (as can be seen by the
    // first condition block above), but if I use that flag only in my method
    // I suddenly can't perform the "was being dragged" check (because
    // sc.menu.mapDrag just won't be changed, so I won't be able to detect the
    // change either).
    // It later turned out that Most of these conditions are sanity checks and
    // fail-safes, though I'd prefer to play safe.
    if (
      !(
        true && // trick my formatter (prettier)
        // The "mouse over" checks are needed because they aren't performed in
        // the default implementation correctly, so the global "hotkey" buttons
        // in the top row of the menu fall through and thus need to be filtered
        // out. For a reason I won't bother explaining, a second check needs to
        // be performed for the previous state of the mouse. Alright-alright.
        // The problem was that when a new interaction entry is pushed, which
        // in this instance happens when pressing the global "help" button,
        // right before that onMouseInteract is fired and the default
        // implementation detects a mouse down event and thinks that the user
        // began dragging the map, whereas in reality they've just clicked the
        // "help" button. However, due to the checks in the first `if` (notably
        // `ig.interact.isBlocked()`), sc.menu.mapDrag flag won't be reset
        // after the help menu is exited (and its interaction entry is removed),
        // but my code thinks that that was a click (because of the falling
        // edge detection below). **And so this awful hack is employed.**
        mouseWasOverWhenDragged &&
        mouseOver &&
        // Start processing the mouse interaction as a "click" on the falling
        // edge of map dragging so to speak. Basically check if the map was
        // being dragged, but isn't now, which happens immediately after the
        // GUI interaction button has been unpressed.
        mapWasBeingDragged &&
        !sc.menu.mapDrag &&
        // Don't handle clicks on the landmark and stamp buttons.
        sc.menu.mapMapFocus == null &&
        // this.hoverRoom is set by the findMap method, it contains a reference
        // to a sc.AreaRoomBounds of the map/room the cursor is currently
        // hovering over (or `null`). This is exactly what I need since it also
        // has the ID of the relevant map. Its data is normally used for
        // setting the text of sc.MapNameGui.
        this.hoverRoom != null
      )
    ) {
      return;
    }

    // The check for if this cheat is enabled at all is done a bit later on
    // (but before code with side-effects!) to avoid useless dictionary
    // lookups, as the onMouseInteract seems to be called on, like, every
    // frame.
    if (!sc.options.get(optIdEnable)) {
      return;
    }

    // This has to be the last check. In short, this is what the
    // onLandmarkPressed method does to not trigger button clicks after the map
    // has been dragged. Note that the sc.menu.mapWasDragged flag isn't reset
    // immediately, only in the button click handler. I basically follow the
    // same convention. This `if` doesn't conflict with the one in
    // onLandmarkPressed because sc.menu.mapMapFocus has already been checked.
    if (sc.menu.mapWasDragged) {
      sc.menu.mapWasDragged = false;
      return;
    }

    // All of the checks above effectively are checking if the map has been
    // clicked and a map room ("map map"?) was under the cursor.
    // Here you can basically see the main branch of onLandmarkPressed.

    let hoveredMapName = this.hoverRoom.text;
    let hoveredMapID = this.hoverRoom.name;
    // I'll admit I got carried away with formatting.
    let dialogText = [
      ig.lang.grammarReplace(ig.lang.get(`${LANG_NAMESPACE}.question`), hoveredMapName),
      ig.lang.grammarReplace(ig.lang.get(`${LANG_NAMESPACE}.map-id`), hoveredMapID),
    ].join('\n');
    sc.BUTTON_SOUND.submit.play();
    sc.Dialogs.showYesNoDialog(dialogText, sc.DIALOG_INFO_ICON.QUESTION, (dialogBtn) => {
      // sc.menu.mapDrag is unset in onLandmarkPressed, dunno why, I'll follow along...
      sc.menu.mapDrag = false;
      // `0` is the "Yes" button.
      if (dialogBtn.data === 0) {
        // Normally startTeleport receives the object in the `map` field of
        // sc.LandmarkGui, but only really uses the `path` field of that object.
        sc.map.startTeleport({ path: hoveredMapID });
      }
    });
  },
});
