let optionsHeaderAdded = new Set();

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

    this._addHeaderToOptionDefinition(rawOptDef);

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

    this._addHeaderToOptionDefinition(rawOptDef);

    sc.OPTIONS_DEFINITION[rawOptName] = rawOptDef;
    this.realOptionIds.set(optName, rawOptName);
    return rawKeyName;
  }

  getRawOptionName(optName) {
    return `twk.${this.name}.${optName}`;
  }

  _addHeaderToOptionDefinition(optDef) {
    if (!optionsHeaderAdded.has(optDef.cat)) {
      optDef.hasDivider = true;
      optDef.header = 'tweak-pack-mod';
      optionsHeaderAdded.add(optDef.cat);
    }
    return optDef;
  }
}

export function isModLoaded(id) {
  let { modloader, versions } = window;
  if (modloader != null && modloader.loadedMods != null) {
    return modloader.loadedMods.has(id);
  } else if (versions != null) {
    return versions.hasOwnProperty(id);
  } else {
    return false;
  }
}

{
  let { modloader } = window;
  if (!(modloader != null && modloader.version != null && modloader.version.major >= 3)) {
    if (!isModLoaded('input-api')) {
      console.error(
        `[${sc.twk.modName}] input-api is also required for the pack to work. Download it from: https://github.com/CCDirectLink/input-api`,
      );
    }
  }
}
