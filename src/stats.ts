export enum Stat {
    str = "str",
    dex = "dex",
    con = "con",
    wis = "wis",
    int = "int",
    cha = "cha",
}

export enum Skill {
    acrobatics = "acrobatics",
    animal_handling = "animal handling",
    arcana = "arcana",
    athletics = "athletics",

    deception = "deception",
    history = "history",
    insight = "insight",
    intimidation = "intimidation",
    investigation = "investigation",
    herbalism = "herbalism",

    medicine = "medicine",
    nature = "nature",
    perception = "perception",
    performance = "performance",
    persuasion = "persuasion",

    religion = "religion",
    sleight_of_hand = "sleight of hand",
    stealth = "stealth",
    survival = "survival",

}


export type Stats = { [stat in Stat]: number };

export const stats: { [stat in Stat]: string } = {
    [Stat.str]: "strength",
    [Stat.dex]: "dexterity",
    [Stat.con]: "constitution",
    [Stat.int]: "intelligence",
    [Stat.wis]: "wisdom",
    [Stat.cha]: "charisma",
};

export const skills: { [skill in Skill]: Stat } = {
    [Skill.acrobatics]: Stat.dex,
    [Skill.animal_handling]: Stat.wis,
    [Skill.arcana]: Stat.int,
    [Skill.athletics]: Stat.str,
    [Skill.deception]: Stat.cha,
    [Skill.herbalism]: Stat.int,
    [Skill.history]: Stat.int,
    [Skill.insight]: Stat.wis,
    [Skill.intimidation]: Stat.cha,
    [Skill.investigation]: Stat.int,
    [Skill.medicine]: Stat.wis,
    [Skill.nature]: Stat.int,
    [Skill.perception]: Stat.wis,
    [Skill.performance]: Stat.cha,
    [Skill.persuasion]: Stat.cha,
    [Skill.religion]: Stat.int,
    [Skill.sleight_of_hand]: Stat.dex,
    [Skill.stealth]: Stat.dex,
    [Skill.survival]: Stat.wis,
};

export interface Proficiency {
    type: "weapon" | "armour" | "equipment" | "skill" | "ability_save"
    target: string
}