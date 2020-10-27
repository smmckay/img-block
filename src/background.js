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

var currentTabId;
var tempDisabled = false;

var doBlock = (url, tabId) => {
    if (url.indexOf('http') != 0) {
        return false;
    }
    var domain = /:\/\/([^/]+)/.exec(url)[1];
    var tab_domain;
    if (tabUrls[tabId]) {
        tab_domain = /:\/\/([^/]+)/.exec(tabUrls[tabId])[1];
    } else {
        tab_domain = '';
    }

    var domain_in_list = list_name => {
        return settings.get(list_name).some(list_domain => {
            return domain.endsWith(list_domain) || tab_domain.endsWith(list_domain);
        });
    };

    if (domain_in_list('blacklist_domains')) {
        return true;
    }

    if (tempDisabled || !settings.get('enabled')) {
        return false;
    }

    if (domain_in_list('whitelist_domains')) {
        return false;
    }

    return true;
};

var updateIcon = () => {
	if (currentTabId === undefined){ return; } // this happens when the browser is first opened and the event listener that sets currentTabId isn't called
    var domain = /:\/\/([^/]+)/.exec(tabUrls[currentTabId])[1]; // this line is not original
    var list = settings.get("whitelist_domains"); // this line is not original
    // old: if (tempDisabled) {
    // new: if (tempDisabled || list.indexOf(domain) !== -1) {
    if (tempDisabled || list.indexOf(domain) !== -1) {
        chrome.browserAction.setIcon({
            path: {
                "16": "images/blocker-temp-disabled-16.png",
                "19": "images/blocker-temp-disabled-19.png",
                "32": "images/blocker-temp-disabled-32.png",
                "38": "images/blocker-temp-disabled-38.png",
                "64": "images/blocker-temp-disabled-64.png",
                "128": "images/blocker-temp-disabled-128.png"
            }
        });
    } else if (!settings.get('enabled')) {
        chrome.browserAction.setIcon({
            path: {
                "16": "images/blocker-disabled-16.png",
                "19": "images/blocker-disabled-19.png",
                "32": "images/blocker-disabled-32.png",
                "38": "images/blocker-disabled-38.png",
                "64": "images/blocker-disabled-64.png",
                "128": "images/blocker-disabled-128.png"
            }
        });
    } else {
        chrome.browserAction.setIcon({
            path: {
                "16": "images/blocker-16.png",
                "19": "images/blocker-19.png",
                "32": "images/blocker-32.png",
                "38": "images/blocker-38.png",
                "64": "images/blocker-64.png",
                "128": "images/blocker-128.png"
            }
        });
    }
};

var settingsChanged = () => {
    updateIcon();
    chrome.webRequest.handlerBehaviorChanged();
};
settings.addListener(settingsChanged);

var handle;
var tempDisable = tabId => {
    handle && clearTimeout(handle);
    if (!tempDisabled) {
        tempDisabled = true;
        handle = setTimeout(() => {
            tempDisabled = false;
            settingsChanged();
        }, settings.get('temporary_duration') * 1000);
    } else {
        tempDisabled = false;
    }
    settingsChanged();
    if (tempDisabled) {
        chrome.tabs.reload(tabId);
    }
};

var permDisable = () => {
    settings.set('enabled', !settings.get('enabled'));
};

chrome.browserAction.onClicked.addListener(tab => {
    /*if (settings.get('enabled') && settings.get('click_action') === 'temporary') {
        tempDisable(tab.id);
    } else {
        permDisable();
    }*/
    // Change left-click action from temporarily dissabling to togglign whitelist
	var domain = /:\/\/([^/]+)/.exec(tab.url)[1];
    var list = settings.get("whitelist_domains");
    if (!list.includes(domain)) {
        list = list.slice();
        list.push(domain);
        settings.set("whitelist_domains", list);
        chrome.tabs.reload(tab.id);
    }
    else {
		list = list.slice();
       	var index = list.indexOf(domain);
       	if (index === -1) { return; }
       	list.splice(index, 1);
        settings.set("whitelist_domains", list);
        chrome.tabs.reload(tab.id);
	}
});

chrome.contextMenus.create({
    title: chrome.i18n.getMessage("action_temp_disable"),
    contexts: ["all"],
    onclick: (info, tab) => { tempDisable(tab.id); }
});

chrome.contextMenus.create({
    title: chrome.i18n.getMessage("action_perm_disable"),
    contexts: ["all"],
    onclick: permDisable
});

chrome.contextMenus.create({
    type: "separator",
    contexts: ["all"]
});

chrome.contextMenus.create({
    id: "whitelist_domain",
    title: chrome.i18n.getMessage("action_whitelist_domain"),
    contexts: ["all"],
    onclick: (info, tab) => {
        var domain = /:\/\/([^/]+)/.exec(tab.url)[1];
        var list = settings.get("whitelist_domains");
        if (!list.includes(domain)) {
            list = list.slice();
            list.push(domain);
            settings.set("whitelist_domains", list);
            chrome.tabs.reload(tab.id);
        }
        else {
            list = list.slice();
            var index = list.indexOf(domain);
            if (index === -1) { return; }
            list.splice(index, 1);
            settings.set("whitelist_domains", list);
            chrome.tabs.reload(tab.id);
	}
    }
});

chrome.webRequest.onBeforeRequest.addListener(
    details => {
        if (details.url && doBlock(details.url, details.tabId)) {
            return {
                redirectUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=="
            };
        }
    },
    {
        urls: ["<all_urls>"],
        types: ["image", "object"]
    },
    ["blocking"]
);

var tabUrls = {};
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    var url = changeInfo.url ? changeInfo.url : tab.url;
    currentTabId = tab.id;
    tabUrls[tab.id] = url;
    if (url && doBlock(url)) {
        chrome.tabs.insertCSS(tabId, {code: "img{visibility: hidden !important;}", runAt: "document_start"});	    
    }
    updateIcon();
});

chrome.tabs.query({}, tabs => tabs.forEach(tab => tabUrls[tab.id] = tab.url));
