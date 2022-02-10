import * as core from './_core.js';

let module = new core.Module('skip-title-screen-intro');
let optIdEnable = module.addOption('enable', { type: 'CHECKBOX', init: false });

sc.TitleScreenGui.inject({
  init(...args) {
    this.parent(...args);
    if (!sc.options.get(optIdEnable)) return;

    this.removeChildGui(this.introGui);
    this.introGui = {
      callback: this.introGui.callback,
      start() {
        requestAnimationFrame(() => {
          this.callback(ig.SEQUENCE_MSG.ENDED);
        });
      },
    };
  },
});
