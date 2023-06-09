"use strict";

import { Val, StatVal, ProfVal, DiceVal, ComboVal } from "./val.js";

export const stats = {
  str: "strength",
  dex: "dexterity",
  con: "constitution",
  int: "intelligence",
  wis: "wisdom",
  cha: "charisma",
};

export const skills = {
  acrobatics: "dex",
  "animal handling": "wis",
  arcana: "int",
  athletics: "str",
  deception: "cha",
  history: "int",
  insight: "wis",
  intimidation: "cha",
  investigation: "int",
  medicine: "wis",
  nature: "int",
  perception: "wis",
  performance: "cha",
  persuasion: "cha",
  religion: "int",
  "sleight of hand": "dex",
  stealth: "dex",
  survival: "wis",
};

export class Feature {
  constructor(name, dice, description, reason) {
    this.name = name;
    this.dice = dice;
    this.description = description;
    this.reason = reason;
  }
}

export class Weapon {
  constructor(name, type, proficient, effectiveRange, maxRange, mods, damage, notes) {
    this.name = name;
    this.type = type;
    this.effectiveRange = effectiveRange;
    this.maxRange = maxRange;
    this.proficient = proficient;
    this._mods = mods;
    this._damage = damage;
    this.notes = notes || "";
  }

  get mods() {
    if (!this.proficient) {
      return this._mods;
    }

    return new ComboVal(this._mods, new ProfVal("weapon proficiency"));
  }

  get damage() {
    return new ComboVal(this._damage, this._mods);
  }
}

export class Character {
  constructor(
    name,
    info,
    levels,
    stats,
    facts,
    saves,
    skills,
    proficiencies,
    features,
    weapons,
    notes,
    inventory,
  ) {
    this.name = name;
    this.info = info;
    this.levels = levels;
    this.stats = stats;
    this.facts = facts;
    this.saves = saves;
    this.skills = skills;
    this.proficiencies = proficiencies;
    this.features = features;
    this.weapons = weapons;
    this.notes = notes;
    this.inventory = inventory;
  }

  get level() {
    return Object.values(this.levels).reduce((a, b) => a + b, 0);
  }

  get proficiency() {
    const level = this.level;

    return new Val(1 + Math.ceil(level / 4), "from " + level + " total levels");
  }

  stat(name) {
    return this.stats[name];
  }

  fact(name) {
    return this.facts[name];
  }

  stat_mod(name) {
    if (!(name in stats)) {
      console.error("Invalid stat", name);
      return new Val(0, "unknown stat " + name);
    }

    const stat = this.stat(name);

    return new Val(
      Math.floor((stat.val - 10) / 2),
      "from " + stats[name] + " stat of " + stat.val
    );
  }

  stat_save(name) {
    if (!(name in this.saves)) {
      return this.stat_mod(name);
    }

    return new ComboVal(this.stat_mod(name), this.saves[name]);
  }

  skill(name) {
    if (!(name in skills)) {
      return new Val(0, "Unknown skill " + name);
    }

    const stat = skills[name];
    const vals = [new StatVal(stat, "")];

    if (name in this.skills) {
      vals.push(this.skills[name]);
    }

    return new ComboVal(...vals);
  }
}
