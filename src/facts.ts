import {
    ComboValue, DiceValue,
    FixedValue,
    MultiplierValue,
    processValueFromString,
    ProficiencyValue,
    Value
} from "./values";
import {Skill, skills, Stat} from "./stats";
import {Level} from "./schema";
import {Stats} from "./objects";

type ProficiencyGroups = "ability_save" | "skill" | "weapon" | "armour" | "equipment"

export class MeleeAttack {
    name: string
    from: string
    description: string
    proficiency: string

    reach: Value
    attack: Value
    damage: Value

    save?: {
        stat: Stat
        skill?: Skill
        dc: Value
    }

    status?: {
        name: string
        length: string
        description?: string
    }[]

    constructor(name: string, from: string, description: string, proficiency: string, reach: Value, attack: Value, damage: Value) {
        this.name = name;
        this.from = from;
        this.description = description;
        this.proficiency = proficiency;
        this.reach = reach;
        this.attack = attack;
        this.damage = damage;
    }

    attack_roll(facts: Facts): Value {
        if (!(this.proficiency in facts.proficiencies.weapon)) {
            return this.attack;
        }

        return new ComboValue(new DiceValue(1, 20, "Attack Die"), this.attack, new ProficiencyValue("Proficient with " + this.proficiency));
    }
}

// export interface Ability {
//   name: string
//   description: string
//   link?: string
//
//   range?: [Value, Value]
//   resources?: { [k: string]: Value }
//   dice_rolls?: { [k: string]: Value }
//
//   save?: {
//     stat: Stat
//     skill?: Skill
//     dc: Value
//   }
//
//   status?: {
//     name: string
//     length: string
//     description?: string
//   }[]
// }

export class Facts {
    private readonly data: { [key: string]: Value }
    readonly levels: { [key: string]: number }
    readonly stats: Stats

    readonly proficiencies: {
        "ability_save": { [k: string]: string }
        "skill": { [k: string]: string }
        "weapon": { [k: string]: string }
        "armour": { [k: string]: string }
        "equipment": { [k: string]: string }
    }

    private hp: ComboValue = new ComboValue()
    private readonly hit_dice: ComboValue = new ComboValue()

    readonly notes: { [k: string]: string }

    attacks: (MeleeAttack)[]

    constructor(notes: { [k: string]: string }) {
        this.data = {};
        this.levels = {};
        this.notes = notes;
        this.stats = new Stats();
        this.attacks = [];
        this.proficiencies = {
            "ability_save": {},
            "skill": {},
            "weapon": {},
            "armour": {},
            "equipment": {},
        };
    }

    get(key: string): Value {
        const level = this.levels[key];

        if (level) {
            return new FixedValue(level, key + " level " + level);
        }

        return this.data[key] || new FixedValue(0, "Unknown Fact");
    }

    get keys(): string[] {
        return Object.keys(this.data);
    }

    set(key: string, data: string, reason: string): void {
        this.data[key] = processValueFromString(data, reason, this.data[key]);
    }

    add_level(level: Level): void {
        const reason = level.class + " level " + level.level;

        this.levels[level.class] = Math.max(level.level, this.levels[level.class] || 0);
        this.hp.values.push(new FixedValue(level.hit_points, reason));
        this.hit_dice.values.push(processValueFromString(level.hit_die, reason));
    }

    add_proficiency(type: ProficiencyGroups, target: string, reason: string): void {
        this.proficiencies[type][target] = reason;
    }

    add_stat(stat: Stat, value: number, reason: string): void {
        const val = new FixedValue(value, reason);

        switch (stat) {
            case "str":
                this.stats.str.values.push(val);
                break;
            case "dex":
                this.stats.dex.values.push(val);
                break;
            case "con":
                this.stats.con.values.push(val);
                break;
            case "wis":
                this.stats.wis.values.push(val);
                break;
            case "int":
                this.stats.int.values.push(val);
                break;
            case "cha":
                this.stats.cha.values.push(val);
                break;
        }
    }

    get character_level(): number {
        return Object.values(this.levels)
            .reduce((total, class_levels) => total + class_levels, 0);
    }

    get proficiency_bonus(): number {
        return 2 + Math.floor((this.character_level - 1) / 4);
    }

    modifier(skill: Stat | Skill): number {
        if (skill in Stat) {
            const stat = this.stats[skill as Stat].roll(this);

            return Math.floor((stat - 10) / 2);
        }

        if (skill in Skill) {
            const stat = skills[skill as Skill];
            const modifier = this.modifier(stat);

            if (skill in this.proficiencies.skill) {
                return modifier + this.proficiency_bonus;
            }

            return modifier;
        }

        return 0;
    }

    save(stat: Stat): number {
        const modifier = this.modifier(stat);

        if (stat in this.proficiencies.ability_save) {
            return modifier + this.proficiency_bonus;
        }

        return modifier;
    }

    get hit_points(): Value {
        return new ComboValue(this.hp, new MultiplierValue(new FixedValue(this.character_level, "Character Levels"), new FixedValue(this.modifier(Stat.con), "Constitution Modifier"), "Con modifier HP"));
    }
}
