var settings = (() => {
    var loaded = false;
    var listeners = [];
    var knobs = {
        enabled: true,
        click_action: 'temporary',
        temporary_duration: 60,
        whitelist_domains: [],
        blacklist_domains: []
    };

    var callListener = listener => {
        listener.call(null, knobs);
    };

    var callListeners = () => {
        listeners.forEach(callListener);
    };

    var save = () => {
        chrome.storage.sync.set(knobs);
    };

    var get = (propName) => {
        return knobs[propName];
    }

    var set = (propName, propValue) => {
        if (!(propName in knobs) || typeof propValue === 'undefined') {
            return;
        }

        console.log(`old: ${knobs[propName]} new: ${propValue}`);
        if (JSON.stringify(knobs[propName]) !== JSON.stringify(propValue)) {
            knobs[propName] = propValue;
            save();
            callListeners();
        }
    }

    chrome.storage.onChanged.addListener(changes => {
        var handleUpdate = propName => {
            if (changes[propName] && JSON.stringify(knobs[propName]) != JSON.stringify(changes[propName].newValue)) {
                knobs[propName] = changes[propName].newValue;
                return true;
            }
            return false;
        };

        var anyChanged = handleUpdate('enabled') ||
            handleUpdate('click_action') ||
            handleUpdate('temporary_duration') ||
            handleUpdate('whitelist_domains') ||
            handleUpdate('blacklist_domains');

        if (anyChanged) {
            callListeners();
        }
    });

    chrome.storage.sync.get(knobs, items => {
        loaded = true;
        knobs = items;
        callListeners();
    });

    return {
        get,
        set,
        addListener: f => {
            listeners.push(f);

            if (loaded) {
                callListener(f);
            }
        }
    };
})();

