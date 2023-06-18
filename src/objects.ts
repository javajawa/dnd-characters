import {DamageType, Feat as IFeat, Item as IItem} from "./schema";
import {ComboValue, DiceValue, ProficiencyValue, Value} from "./values";
import {Skill, Stat} from "./stats";
import {Facts} from "./facts";

export class Item implements IItem {
    readonly name: string;
    readonly description: string;
    readonly link: string;

    readonly count: number;
    readonly value: number | string;
    readonly weight: number;

    readonly equippable: boolean;
    equipped: boolean;

    constructor(name: string, description: string, link: string, count: number, value: string, weight: number, equippable: boolean, equipped?: boolean) {
        this.name = name;
        this.description = description;
        this.link = link;
        this.count = count;
        this.value = value;
        this.weight = weight;
        this.equippable = equippable;
        this.equipped = equipped || false;
    }
}

export class Feat implements IFeat {
    readonly name: string;
    readonly description: string;
    readonly link: string;

    readonly equippable: boolean;
    equipped: boolean;

    constructor(name: string, description: string, link: string, equippable: boolean, equipped?: boolean) {
        this.name = name;
        this.description = description;
        this.link = link;
        this.equippable = equippable;
        this.equipped = equipped || false;
    }
}

export class Stats {
    readonly str: ComboValue;
    readonly dex: ComboValue;
    readonly con: ComboValue;
    readonly int: ComboValue;
    readonly wis: ComboValue;
    readonly cha: ComboValue;

    constructor() {
        this.str = new ComboValue();
        this.dex = new ComboValue();
        this.con = new ComboValue();
        this.int = new ComboValue();
        this.wis = new ComboValue();
        this.cha = new ComboValue();
    }
}

export class MeleeAttack {
    name: string;
    from: string;
    description: string;
    proficiency: string;

    reach: Value;
    attack: Value;
    damage: { [k in DamageType]: Value };

    dice_rolls: { [k: string]: Value } = {};

    save?: {
        stat: Stat
        skill?: Skill
        dc: Value
    };

    status?: {
        name: string
        length: string
        description?: string
    }[];

    constructor(name: string, from: string, description: string, proficiency: string, reach: Value, attack: Value, damage: { [k in DamageType]: Value }) {
        this.name = name;
        this.from = from;
        this.description = description;
        this.proficiency = proficiency;
        this.reach = reach;
        this.attack = attack;
        this.damage = damage;
    }

    attack_roll(facts: Facts): ComboValue {
        const attack = new ComboValue(new DiceValue(1, 20, "Attack Die"), this.attack);

        if (this.proficiency in facts.proficiencies.weapon) {
            attack.values.push(new ProficiencyValue("Proficient with " + this.proficiency));
        }

        return attack;
    }

    get total_damage(): Value {
        return new ComboValue(...Object.values(this.damage));
    }
}

export class RangedAttack {
    name: string;
    from: string;
    description: string;
    proficiency: string;

    standard_range: Value;
    max_range: Value;
    attack: Value;
    damage: { [k in DamageType]: Value };

    dice_rolls: { [k: string]: Value } = {};

    save?: {
        stat: Stat
        skill?: Skill
        dc: Value
    };

    status?: {
        name: string
        length: string
        description?: string
    }[];

    constructor(name: string, from: string, description: string, proficiency: string, standard_range: Value, max_range: Value, attack: Value, damage: { [k in DamageType]: Value }) {
        this.name = name;
        this.from = from;
        this.description = description;
        this.proficiency = proficiency;
        this.standard_range = standard_range;
        this.max_range = max_range;
        this.attack = attack;
        this.damage = damage;
    }

    attack_roll(facts: Facts): ComboValue {
        const attack = new ComboValue(new DiceValue(1, 20, "Attack Die"), this.attack);

        if (this.proficiency in facts.proficiencies.weapon) {
            attack.values.push(new ProficiencyValue("Proficient with " + this.proficiency));
        }

        return attack;
    }

    get total_damage(): Value {
        return new ComboValue(...Object.values(this.damage));
    }
}

export class Ability {
    name: string;
    from: string;
    description: string;
    link: string;

    range: [Value, Value] | null;

    dice_rolls: { [k: string]: Value };

    save: {
        stat: Stat
        skill?: Skill
        dc: Value
    } | null;

    status?: {
        name: string
        length: string
        description?: string
    }[];

    constructor(
        name: string, from: string, description: string, link: string,
        range: [Value, Value] | null,
        save: { stat: Stat, skill?: Skill, dc: Value } | null,
        rolls: { [k: string]: Value } | null
    ) {
        this.name = name;
        this.from = from;
        this.description = description;
        this.link = link;
        this.range = range;
        this.save = save;
        this.dice_rolls = rolls || {};
    }
}
