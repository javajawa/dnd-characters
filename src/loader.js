async function run() {
    const response = await fetch("./character.json");
    const data = await response.json();
}
document.addEventListener("readystatechange", () => document.readyState === "complete" && run());
export {};
//# sourceMappingURL=loader.js.map