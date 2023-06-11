import {AbstractThingSource, Character as CharacterSchema, DamageType} from "./schema";
import {Ability, Feat, Item, MeleeAttack, RangedAttack} from "./objects";
import {Facts} from "./facts";
import {Stat} from "./stats";
import {render} from "./render";
import {processValueFromString, Value} from "./values";

async function run(): Promise<void> {
    const response = await fetch("./character.json");
    const data: CharacterSchema = await response.json();
    const state = new CharacterState(data.name);
    const facts = buildFacts(data, state);

    Object.defineProperty(window, "facts", {value: facts});
    render(data.name, facts, data.info, state);
}

export class CharacterState {
    private readonly character: string;
    readonly items: { [item: string]: boolean }
    readonly feats: { [feat: string]: boolean }

    constructor(character: string) {
        this.character = character;

        const state = window.localStorage.getItem(cyrb53(character));
        const data = JSON.parse(state || "{}");

        this.items = data.items || {};
        this.feats = data.feats || {};
    }

    equip(item: Item, equipped: boolean): void {
        this.items[item.name] = equipped;
        this._write_state();
    }

    equipped(item: Item): boolean {
        if (item.count === 0) {
            return false;
        }
        if (!item.equippable) {
            return true;
        }

        if (!(item.name in this.items)) {
            this.items[item.name] = false;
        }

        return this.items[item.name] || false;
    }

    enable(feat: Feat, enabled: boolean): void {
        this.feats[feat.name] = enabled;
        this._write_state();
    }

    enabled(feat: Feat): boolean {
        if (!feat.equippable) {
            return true;
        }

        if (!(feat.name in this.feats)) {
            this.feats[feat.name] = false;
        }

        return this.feats[feat.name] || false;
    }

    _write_state() {
        window.localStorage.setItem(
            cyrb53(this.character),
            JSON.stringify({
                "items": this.items,
                "feats": this.feats,
            })
        );
    }
}

function cyrb53(str: string, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for(let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1  = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2  = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(10);
}

function loadFactsFromSource(facts: Facts, source: AbstractThingSource, reason: string): void
{
    for (const {type, target} of source.proficiencies || []) {
        facts.add_proficiency(type, target, reason)
    }

    for (const [stat, value] of Object.entries(source.stats || {})) {
        facts.add_stat(stat as Stat, value, reason)
    }

    for (const [fact, fact_value] of Object.entries(source.facts || {})) {
        facts.set(fact, fact_value.toString(), reason);
    }

    for (const attack of source.attacks || []) {

        const damage =
            Object.fromEntries(
                Object.entries(attack.damage || {})
                    .map(([type, amount]) => [type, processValueFromString(amount, type)])
            ) as { [k in DamageType]: Value };

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

        if (attack.range) {
            facts.attacks.push(new RangedAttack(
                attack.name,
                reason,
                attack.description || "",
                attack.proficiency,
                processValueFromString(attack.range[0], attack.name),
                processValueFromString(attack.range[1], attack.name),
                processValueFromString(attack.attack_bonuses, attack.name),
                damage
            ))
        }
    }

    for (const ability of source.abilities || []) {
        const save = ability.save;
        if (save) {
            // @ts-ignore
            save.dc = processValueFromString(save.dc, ability.name);
        }
        const rolls = Object.fromEntries(
            Object.entries(ability.dice_rolls || {})
                .map(([name, roll]) => [name, processValueFromString(roll, name)])
        );

        facts.abilities.push(new Ability(
            ability.name,
            reason,
            ability.description || "",
            ability.link || "",
            ability.range ? [processValueFromString(ability.range[0], ability.name), processValueFromString(ability.range[1], ability.name)] : null,
            // @ts-ignore
            save,
            rolls,
        ))
    }
}

function buildFacts(character: CharacterSchema, state: CharacterState): Facts {
    const facts: Facts = new Facts(character.backstory);

    for (const feat of character.feats) {
        const feature = new Feat(feat.name, feat.description, feat.link, feat.equippable);
        feature.equipped = state.enabled(feature);

        if (feature.equippable) {
            facts.toggles.push(feature);
        }

        if (feature.equipped) {
            loadFactsFromSource(facts, feat, feat.name);
        }
    }

    for (const level of character.levels) {
        facts.add_level(level);
        loadFactsFromSource(facts, level, level.class + " lvl. " + level.level);
    }

    for (const item of character.items) {
        const i = new Item(
            item.name,
            item.description,
            item.link,
            item.count || 1,
            item.value.toString(),
            item.weight,
            !!(item.attacks || item.abilities),
        );

        i.equipped = state.equipped(i);
        facts.inventory.push(i);

        if (i.equipped) {
            loadFactsFromSource(facts, item, item.name);
        }
    }

    return facts;
}

document.addEventListener(
    "readystatechange",
    () => document.readyState === "complete" && run()
);
