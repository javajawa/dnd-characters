// noinspection JSDeprecatedSymbols,JSUnresolvedReference

chrome.runtime.onMessage.addListener(
    (message, sender, respond) => {
        console.log("extension got", sender.tab ? "from a content script:" + sender.tab.url : "from the extension");

        return chrome.tabs.query({"url": "*://app.roll20.net/editor/"}, tabs => {
            console.log("Tabs", tabs)

            if (tabs.length === 0) {
                console.log("Can not find a roll20 tab");
                return false;
            }

            console.log("Sending to", tabs[0]);
            chrome.tabs.sendMessage(tabs[0].id, message, {}, r => respond(r));
            return true;
        });
    }
)
