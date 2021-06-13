export default class {
  constructor(mod) {
    this.mod = mod;
  }

  postload() {
    if (sc.twk == null) sc.twk = {};
    sc.twk.mod = this.mod;

    let title = null;

    if (this.mod.manifest != null) {
      let titleMaybeLocalized = this.mod.manifest.title;
      title =
        typeof titleMaybeLocalized === 'object' && titleMaybeLocalized != null
          ? titleMaybeLocalized.en_US
          : titleMaybeLocalized;
    } else if (this.mod.displayName != null) {
      title = this.mod.displayName;
    }

    if (title != null && typeof title === 'string' && title.length > 0) {
      sc.twk.modName = title;
    } else {
      sc.twk.modName = this.mod.id;
    }
  }
}
