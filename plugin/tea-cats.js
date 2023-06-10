function injectPageScript(url) {
    const s = document.createElement('script');
    s.src = url;
    s.onload = () => s.remove();
    (document.head || document.documentElement).appendChild(s);
}

document.addEventListener("roll", e => {
    console.log("Sending message", e.detail.roll);
    console.log(chrome.extension.sendMessage({roll: e.detail.roll}));
});
