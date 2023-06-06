import { Value } from "./values";

// FIXME: Update this
export type Feat = AbstractThingSource

// FIXME: Update this
export type Level = AbstractThingSource

export interface Item extends AbstractThingSource {
  weight: number
  count: number
  value: number
}

type FactBlock = { [k:string]: Value }
type Stat = "str" | "dex" | "con" | "wis" | "int" | "cha"
type DamageType = "bludgeoning" | "piercing" | "slashing" | "acid" | "cold" | "fire" | "force" | "lightning" | "necrotic" | "poison" | "psychic" | "radiant" | "thunder"

export interface Stats {
  str: Value
  dex: Value
  con: Value
  int: Value
  wis: Value
  cha: Value
}

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

interface AbstractThingSource {
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

interface Proficiency {
  type: "weapon" | "armour" | "equipment" | "skill" | "ability_save"
  target: string
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

  resources?: { [k: string]: Value }
  reach?: Value
  range?: [Value, Value]

  attack_bonuses: Value
  damage: { [k in DamageType]?: Value }
  damage_bonuses: Value

  save?: {
    stat: Stat
    skill?: string
    dc: Value
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
  resources?: { [k: string]: Value }
  dice_rolls?: { [k: string]: Value }
  save?: {
    stat: Stat
    skill?: string
    dc: Value
  }
  status?: {
    name: string
    length: string
    description?: string
  }[]
  range?: [Value, Value]
}