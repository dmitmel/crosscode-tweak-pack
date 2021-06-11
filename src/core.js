if (sc.twk == null) sc.twk = {};

let optionsHeaderAdded = false;

export function addModule(name, config) {
  let result = {
    name,
    config,
    realOptionIds: {},
  };

  if (config.options != null) {
    for (let [optName, optDef] of Object.entries(config.options)) {
      let rawOptName = `twk.${name}.${optName}`;
      let rawOptDef = {
        type: optDef.type,
        cat: sc.OPTION_CATEGORY.GENERAL,
        init: optDef.type,
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
