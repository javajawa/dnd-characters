const chat = document.getElementById("textchat-input");
const txt = chat.getElementsByTagName("textarea")[0];
const btn = chat.getElementsByTagName("button")[0];


chrome.extension.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log(request);

        if (!request.roll) {
            return false;
        }

        const old_text = txt.value;

        txt.value = request.roll.toString();
        btn.click();
        txt.value = old_text;

        return false;
    }
);
