import {
    ComboValue,
    FixedValue,
    MultiplierValue,
    processValueFromString,
    StatValue,
    Value
} from "./values";
import {Stat} from "./stats";
import {Level} from "./schema";
import {Ability, Feat, Item, MeleeAttack, RangedAttack, Stats} from "./objects";

type ProficiencyGroups = "ability_save" | "skill" | "weapon" | "armour" | "equipment" | "expertise"

export class Facts {
    private readonly data: { [key: string]: Value };
    readonly levels: { [key: string]: number };
    readonly stats: Stats;

    readonly proficiencies: {
        "ability_save": { [k: string]: string }
        "skill": { [k: string]: string }
        "expertise": { [k: string]: string }
        "weapon": { [k: string]: string }
        "armour": { [k: string]: string }
        "equipment": { [k: string]: string }
    };

    private hp: ComboValue = new ComboValue();
    private readonly hitDice: ComboValue = new ComboValue();

    readonly notes: { [k: string]: string };

    toggles: Feat[];
    inventory: Item[];
    attacks: (MeleeAttack | RangedAttack)[];
    abilities: Ability[];

    constructor(notes: { [k: string]: string }) {
        this.inventory = [];
        this.toggles = [];
        this.abilities = [];
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
            "expertise": {},
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
        this.hitDice.values.push(processValueFromString(level.hit_die, reason));
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
            .reduce((total, classLevels) => total + classLevels, 0);
    }

    get proficiency_bonus(): number {
        return 2 + Math.floor((this.character_level - 1) / 4);
    }

    get hit_points(): Value {
        return new ComboValue(this.hp, new MultiplierValue(new FixedValue(this.character_level, "Character Levels"), new StatValue(Stat.con, "Constitution Modifier"), "Con modifier HP"));
    }
}
