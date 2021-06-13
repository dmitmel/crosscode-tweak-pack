import * as core from './_core.js';

let module = new core.Module('open-map-menu-shortcut');
let keyId = module.addControlOption('key', { init: { key1: ig.KEY.M } });

sc.twk.MapMenuShortcutMod = ig.GameAddon.extend({
  init() {
    this.parent('MapMenuShortcutMod');
  },

  // sc.GlobalInput's order is actually 8999.
  postUpdateOrder:
    sc.GlobalInput.prototype.postUpdateOrder != null
      ? sc.GlobalInput.prototype.postUpdateOrder + 1
      : 9000,

  onPostUpdate() {
    if (ig.loading || sc.model.isPlayerControlBlocked()) return;

    if (ig.input.pressed(keyId)) {
      if (
        sc.model.isGame() &&
        sc.model.isMenu() &&
        sc.menu.currentMenu === sc.MENU_SUBMENU.MAP &&
        // check if the help screen or a dialog isn't opened, otherwise it will
        // block the screen after switching back to the game
        ig.interact.entries.last() === sc.menu.buttonInteract
      ) {
        this.closeMapMenu();
        sc.BUTTON_SOUND.back.play();
      } else if (
        sc.model.isGame() &&
        sc.model.isRunning() &&
        // check if the quick menu has been unlocked yet, the map menu becomes
        // available at the same moment
        sc.model.player.getCore(sc.PLAYER_CORE.QUICK_MENU)
      ) {
        let openedMapMenu = this.openMapMenu();
        sc.BUTTON_SOUND[openedMapMenu ? 'submit' : 'denied'].play();
      }
    }
  },

  openMapMenu() {
    // Check for the common conditions upfront, because opening and then
    // immediately closing the quick menu causes the element indicator in the
    // top left corner to jump, which is, of course, undesirable. Other
    // conditions may be present implicitly or added explicitely in the future,
    // but these two are the obvious ones I could find.
    if (!sc.model.isSaveAllowed() || sc.model.isTeleportBlocked()) return false;

    // User's actions required in order to open the map need to be carefully
    // emulated here instead of directly calling methods of `sc.model` and
    // `sc.menu` because of the model notifications sent during the intended
    // user interaction path (which trigger changes to the UI all over the
    // codebase) and potential (although unlikely) changes to the internals of
    // the methods I'm using here. Also, I chose to use the quick menu instead
    // of the main one because the main one is unlocked at the end of the
    // rhombus dungeon which is a bit later than the quick one and the map menu
    // in particular both become available.
    let enteredQuickMenu = sc.model.enterQuickMenu();
    if (!enteredQuickMenu) return false;
    // I wonder why this variable isn't set internally by `enteredQuickMenu`,
    // but I have to do this here because not doing that creates a very
    // annoying bug when the quick menu access method is set to "hold": the
    // quick menu becomes impossible to close by pressing shift and to close it
    // you have to open and close the map menu again manually.
    sc.quickmodel.activeState = true;

    let quickMenu = ig.gui.guiHooks.find(({ gui }) => gui instanceof sc.QuickMenu).gui;
    let quickRingMenu = quickMenu.ringmenu;
    let mapButton = quickRingMenu.map;
    if (!mapButton.active) {
      // some additional conditions may be present as noted above, so in the
      // case the button intended to be pressed by user is inactive we bail out
      // safely
      sc.quickmodel.activeState = false;
      sc.model.enterRunning();
      return false;
    }

    // And finally, press the "map" button!
    quickRingMenu.buttongroup._invokePressCallbacks(mapButton, /* fromMouse */ false);
    return true;
  },

  closeMapMenu() {
    // Let's exit the world map just in case, for the same reason as I emulate
    // user interactions in the `openMapMenu` function.
    if (sc.menu.mapWorldmapActive) sc.menu.exitWorldMap();

    sc.model.enterPrevSubState();
  },
});

ig.addGameAddon(() => {
  let addon = new sc.twk.MapMenuShortcutMod();
  sc.twk.mapMenuShortcutMod = addon;
  return addon;
});
