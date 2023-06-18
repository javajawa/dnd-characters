import {Value} from "./values";
import {Proficiency, Skill, Stat, Stats} from "./stats";

export type FactBlock = { [k: string]: string }
export type DamageType =
    "bludgeoning"
    | "piercing"
    | "slashing"
    | "acid"
    | "cold"
    | "fire"
    | "force"
    | "lightning"
    | "necrotic"
    | "poison"
    | "psychic"
    | "radiant"
    | "thunder"


export interface Character {
    name: string
    info: Info
    feats: Feat[]
    levels: Level[]
    items: Item[]
    "quest-lines"?: {
        open?: string[]
        active?: string[]
        complete?: string[]
    }
    worries?: string[]
    backstory: { [k: string]: string }
}

export interface Info {
    race?: string
    size?: "Small" | "Medium" | "Large"
    arg?: number
    height?: string
    weight?: string
    languages?: string[]
    appearance?: string
}

export interface AbstractThingSource {
    name: string
    description: string
    link: string

    stats?: Stats
    proficiencies?: Proficiency[]
    resources?: Resource[]
    facts?: FactBlock

    attacks?: Attack[]
    abilities?: Ability[]
}

export interface Level extends AbstractThingSource {
    class: string
    level: number
    hit_die: string
    hit_points: number
}

export interface Feat extends AbstractThingSource {
    equippable: boolean
}

export interface Item extends AbstractThingSource {
    weight: number
    count: number
    value: number | string
}

interface Resource {
    name: string
    description?: string
    pool: Value
    regain: {
        amount: Value
        every: "round" | "short rest" | "long rest" | "dawn"
    }
}

export interface Attack {
    name: string
    description: string
    proficiency: string

    resources?: { [k: string]: string }
    reach?: string
    range?: [string, string]

    attack_bonuses: string
    damage: { [k in DamageType]?: string }

    save?: {
        stat: Stat
        skill?: Skill
        dc: string
    }

    status?: {
        name: string
        length: string
        description?: string
    }[]
}

export interface Ability {
    name: string
    description: string
    link?: string

    range?: [string, string]
    resources?: { [k: string]: string }
    dice_rolls?: { [k: string]: string }

    save?: {
        stat: Stat
        skill?: Skill
        dc: string
    }

    status?: {
        name: string
        length: string
        description?: string
    }[]
}