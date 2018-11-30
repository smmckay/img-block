/*
    Copyright (C) 2016  Steve McKay

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

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
    };

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
    };

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

