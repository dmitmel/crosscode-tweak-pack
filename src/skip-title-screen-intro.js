import * as core from './_core.js';

let module = new core.Module('skip-title-screen-intro');
let optIdEnable = module.addOption('enable', { type: 'CHECKBOX', init: false });

sc.TitleScreenGui.inject({
  init(...args) {
    this.parent(...args);
    if (sc.options.get(optIdEnable)) {
      this.introGui.timeLine = [{ time: 0, end: true }];
      this.bgGui.parallax.addLoadListener({
        onLoadableComplete: () => {
          let { timeLine } = this.bgGui;
          let idx = timeLine.findIndex((item) => item.time > 0);
          if (idx < 0) idx = timeLine.length;
          timeLine.splice(idx, 0, { time: 0, goto: 'INTRO_SKIP_NOSOUND' });
        },
      });
      this.removeChildGui(this.startGui);
      this.startGui = {
        show: () => {
          ig.interact.removeEntry(this.screenInteract);
          this.buttons.show();
        },
        hide: () => {},
      };
    }
  },
});
