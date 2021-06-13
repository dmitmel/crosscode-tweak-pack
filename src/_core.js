if (sc.twk == null) sc.twk = {};

let optionsHeaderAdded = false;
let optionsControlsHeaderAdded = false;

export const modules = new Map();

export class Module {
  constructor(name) {
    if (modules.has(name)) {
      throw new Error('A module with the same name has already been registered!');
    }
    modules.set(name);

    this.name = name;
    this.realOptionIds = new Map();
  }

  addOption(optName, optDef) {
    let rawOptName = this.getRawOptionName(optName);
    let rawOptDef = {
      type: optDef.type,
      cat: sc.OPTION_CATEGORY.GENERAL,
      init: optDef.init,
      restart: optDef.restart,
    };

    if (!optionsHeaderAdded) {
      rawOptDef.hasDivider = true;
      rawOptDef.header = 'tweak-pack-mod';
      optionsHeaderAdded = true;
    }

    sc.OPTIONS_DEFINITION[rawOptName] = rawOptDef;
    this.realOptionIds.set(optName, rawOptName);
    return rawOptName;
  }

  addControlOption(optName, optDef) {
    let rawKeyName = this.getRawOptionName(optName);
    let rawOptName = `keys-${rawKeyName}`;
    let rawOptDef = {
      type: 'CONTROLS',
      cat: sc.OPTION_CATEGORY.CONTROLS,
      init: optDef.init,
      restart: optDef.restart,
    };

    if (!optionsControlsHeaderAdded) {
      rawOptDef.hasDivider = true;
      rawOptDef.header = 'tweak-pack-mod';
      optionsControlsHeaderAdded = true;
    }

    sc.OPTIONS_DEFINITION[rawOptName] = rawOptDef;
    this.realOptionIds.set(optName, rawOptName);
    return rawKeyName;
  }

  getRawOptionName(optName) {
    return `twk.${this.name}.${optName}`;
  }
}
