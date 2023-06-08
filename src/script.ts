import {AbstractThingSource, Character as CharacterSchema} from "./schema";
import {Feat, Item} from "./objects";
import {Feat as IFeat, Item as IItem} from "./schema";
import {Facts, MeleeAttack} from "./facts";
import {Stat} from "./stats";
import {render} from "./render";
import {ComboValue, processValueFromString} from "./values";

async function run(): Promise<void> {
    const response = await fetch("./character.json");
    const data: CharacterSchema = await response.json();

    const facts = buildFacts(data, new CharacterState());

    Object.defineProperty(window, "facts", {value: facts});
    render(data.name, facts, data.info);
}

class CharacterState {
    readonly items: { [item: string]: boolean }
    readonly feats: { [feat: string]: boolean }

    constructor() {
        this.items = {};
        this.feats = {};
    }

    equip(item: Item | IItem, equipped: boolean): void {
        this.items[item.name] = equipped;
    }

    equipped(item: Item | IItem): boolean {
        if (item.count === 0) {
            return false;
        }

        if (item.name in this.items) {
            this.items[item.name] = false;
        }

        return this.items[item.name] || false;
    }

    enable(feat: Feat | IFeat, enabled: boolean): void {
        this.feats[feat.name] = enabled;
    }

    enabled(feat: Feat | IFeat): boolean {
        if (!feat.equippable) {
            return true;
        }

        if (feat.name in this.feats) {
            this.feats[feat.name] = false;
        }

        return this.feats[feat.name] || false;
    }
}

function loadFactsFromSource(facts: Facts, source: AbstractThingSource, reason: string): void
{
    for (let {type, target} of source.proficiencies || []) {
        facts.add_proficiency(type, target, reason)
    }

    for (let [stat, value] of Object.entries(source.stats || {})) {
        facts.add_stat(stat as Stat, value, reason)
    }

    for (let [fact, fact_value] of Object.entries(source.facts || {})) {
        facts.set(fact, fact_value.toString(), reason);
    }

    for (let attack of source.attacks || []) {
        console.log(attack);

        const damage = new ComboValue(
            ...Object.entries(attack.damage || {}).map(([type, amount]) => processValueFromString(amount, type)),
            processValueFromString(attack.damage_bonuses || "0", "bonuses")
        );

        if (attack.reach) {
            facts.attacks.push(new MeleeAttack(
                attack.name,
                reason,
                attack.description || "",
                attack.proficiency,
                processValueFromString(attack.reach, attack.name),
                processValueFromString(attack.attack_bonuses, attack.name),
                damage
            ))
        }
    }
}

function buildFacts(character: CharacterSchema, state: CharacterState): Facts {
    let facts: Facts = new Facts(character.backstory);

    for (let feature of character.feats) {
        if (!state.enabled(feature)) {
            continue;
        }

        loadFactsFromSource(facts, feature, feature.name);
    }

    for (let level of character.levels) {
        facts.add_level(level);
        loadFactsFromSource(facts, level, level.class + " lvl. " + level.level);
    }

    for (let item of character.items) {
        if (!state.equipped(item)) {
            continue;
        }

        const reason = item.name;

        for (let [stat, value] of Object.entries(item.stats || {})) {
            facts.add_stat(stat as Stat, value, reason)
        }

        for (let [fact, fact_value] of Object.entries(item.facts || {})) {
            facts.set(fact, fact_value.toString(), reason);
        }
    }

    return facts;
}

document.addEventListener(
    "readystatechange",
    () => document.readyState === "complete" && run()
);
