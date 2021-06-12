if (sc.twk == null) sc.twk = {};

let optionsHeaderAdded = false;

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
    let rawOptName = `twk.${this.name}.${optName}`;
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
}
