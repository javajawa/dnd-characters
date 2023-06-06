import {Character} from "./schema";

async function run(): Promise<void> {
    const response = await fetch("./character.json");
    const data: Character = await response.json();
}

document.addEventListener(
    "readystatechange",
    () => document.readyState === "complete" && run()
);
