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
    }

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
    if (tempDisabled) {
        chrome.browserAction.setIcon({path: {
            "19": "images/blocker-temp-disabled-19.png",
            "38": "images/blocker-temp-disabled-38.png"
        }});
    } else if (!settings.get('enabled')) {
        chrome.browserAction.setIcon({path: {
            "19": "images/blocker-disabled-19.png",
            "38": "images/blocker-disabled-38.png"
        }});
    } else {
        chrome.browserAction.setIcon({path: {
            "19": "images/blocker-19.png",
            "38": "images/blocker-38.png"
        }});
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
    if (settings.get('enabled') && settings.get('click_action') === 'temporary') {
        tempDisable(tab.id);
    } else {
        permDisable();
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
    tabUrls[tab.id] = url;
    if (url && doBlock(url)) {
        chrome.tabs.insertCSS(tabId, {code: "img{visibility: hidden !important;}", runAt: "document_start"});	    
    }
});

chrome.tabs.query({}, tabs => tabs.forEach(tab => tabUrls[tab.id] = tab.url));