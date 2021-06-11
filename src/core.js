if (sc.twk == null) sc.twk = {};

let optionsHeaderAdded = false;

export const modules = new Map();

export function addModule(name, config) {
  if (modules.has(name)) {
    throw new Error('A module with the same name has already been registered!');
  }

  let result = {
    name,
    config,
    realOptionIds: {},
  };
  modules.set(name, result);

  if (config.options != null) {
    for (let [optName, optDef] of Object.entries(config.options)) {
      let rawOptName = `twk.${name}.${optName}`;
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
      result.realOptionIds[optName] = rawOptName;
    }
  }

  return result;
}
