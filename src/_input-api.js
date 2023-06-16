export function injectInputApi() {
    // This library is based on the work done by 20kdc in his RaptureUI mod:
    // https://github.com/20kdc/decrossfuscator/blob/b5c4250aade5bf8d41b12ec7c346d49ba107b2a9/mods/raptureui/keybinding.js
    //
    // This mod is needed basically because the developers use a local variable
    // (named `KEY_OPTION_MAP` in 0.7.0) which contains an object that maps strings
    // (obtained from the keys of the `sc.OPTIONS_DEFINITION`) without the `keys-`
    // prefix to the same strings with the said prefix. Why would they do that?
    // Hell if I know! Could they implement key rebinding without this conversion
    // table? Absolutely. In fact, this is precisely what I've done here. I copied
    // the original implementations, but removed references to `KEY_OPTION_MAP` and
    // rewrote the functions accordingly.
    //
    // Unfortunately there is no way to cunningly inject something to leak a
    // reference to that variable, so I had to copy copyrighted code, which
    // definitely not the best solution, but compared to another variant it gives
    // much more flexibility. The other way to accomplish rebinding of modded input
    // keys is to define a setter for `OPTIONS_DEFINITION` sometime in postload
    // because the module `game.feature.model.options-model`, which populates
    // `KEY_OPTION_MAP` and contains definitions of (unsurprisingly)
    // `sc.OptionModel`, `sc.KeyBinder` and so on, transitively depends on
    // `dom.ready`, therefore by the time of `postload` it wouldn't have been
    // executed. This can be done with the following snippet:
    //
    // ```javascript
    // Object.defineProperty(sc, 'OPTIONS_DEFINITION', {
    //   configurable: true,
    //   get() {
    //     return undefined;
    //   },
    //   set(value) {
    //     addCustomOptionsTo(sc.OPTIONS_DEFINITION);
    //     delete sc.OPTIONS_DEFINITION;
    //     sc.OPTIONS_DEFINITION = value;
    //   },
    // });
    // ```
    //
    // This is a viable approach, however, 20kdc expressed concerns about this
    // killing JIT and as I said above I traded the flexibility for not copying
    // original code, so there.
    //
    // Another point I'd like to bring up is that the original implementation is
    // broken and contains bugs. For example, it is possible to unbind primary keys
    // (contrary to what UI in `sc.KeyBinderGui` implies): if you want to unbind
    // key K1 of binding B1, you simply have to unbind alternative key K2 of the
    // binding B2 and bind K1 to that. _I could fix that_. But, this is a library
    // mod, and fixing that felt intrusive in the context of a library. So, apart
    // from necessary edits, very minor refactors and code deduplications I didn't
    // change anything significant.

    // ig.module('input-api')
    // .requires('game.feature.model.options-model')
    // .defines(() => {
    // `sc.KEY_BLACK_LIST` contains keys which cannot be bound using graphical
    // interface (i.e. `sc.KeyBinderGui`). Really it contains functional keys
    // F1-F12 and the control key. The reason for blacklisting functional keys
    // is explainable - they are already internally used for the following
    // actions:
    //
    // - [F7 ] opening the typo editor
    // - [F8 ] taking screenshots (which can't be saved, trololo)
    // - [F10] importing/exporting savestrings
    // - [F11] switching to the fullscreen mode
    //
    // Unfortunately it is not clear to me what did control forget there. The
    // jetpack mod makes use of it, so I remove it from the blacklist here.
    delete sc.KEY_BLACK_LIST[ig.KEY.CTRL];

    sc.KeyBinder.inject({
        // the loop which populates `KEY_OPTION_MAP` was moved directly here
        initBindings() {
            for (let optionId in sc.OPTIONS_DEFINITION) {
                let optionDef = sc.OPTIONS_DEFINITION[optionId];
                if (optionDef.type !== 'CONTROLS' || !optionId.startsWith('keys-')) {
                    continue;
                }

                let action = optionId.slice(5);
                let { key1, key2 } = sc.options.values[optionId];
                if (key1 != null) {
                    ig.input.bind(key1, action);
                    sc.fontsystem.changeKeyCodeIcon(action, key1);
                }
                if (key2 != null) {
                    ig.input.bind(key2, action);
                }
            }

            this.updateGamepadIcons();
        },

        changeBinding(optionId, key, isAlternative, unbind) {
            let optionValue = sc.options.values[optionId];
            sc.options.hasChanged = true;

            // this assignment accessed `KEY_OPTION_MAP` to get the option value
            // instead of directly reusing a variable directly
            let oldKey = isAlternative ? optionValue.key2 : optionValue.key1;
            // this condition seems to handle situations when `oldKey` is
            // `undefined` or `null` correctly as well
            if (ig.input.bindings[oldKey] != null) ig.input.unbind(oldKey);

            if (isAlternative && unbind) {
                optionValue.key2 = undefined;
                return;
            }

            let action = optionId.slice(5);
            let conflictingAction = ig.input.bindings[key];

            ig.input.bind(key, action);
            sc.fontsystem.changeKeyCodeIcon(action, key);

            if (conflictingAction != null) {
                // this assignment used to access `KEY_OPTION_MAP` to get the option
                // ID of the conflicting action
                let conflictingOption =
                    sc.options.values[`keys-${conflictingAction}`];

                if (conflictingOption.key1 === key) {
                    conflictingOption.key1 = oldKey;
                } else if (conflictingOption.key2 === key) {
                    conflictingOption.key2 = oldKey;
                } else {
                    // this error message isn't present in the original code, I got this
                    // idea from 20kdc's implementation
                    console.error(
                        'input-api: unable to find the conflicting key binding. report ASAP!',
                    );
                }

                ig.input.bind(oldKey, conflictingAction);
                sc.fontsystem.changeKeyCodeIcon(conflictingAction, oldKey);
                sc.options.dispatchKeySwappedEvent();
            }

            if (isAlternative) optionValue.key2 = key;
            else optionValue.key1 = key;
        },
    });
    // });
}