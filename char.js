"use strict";

import { Val, MulVal, StatVal, ProfVal, DiceVal, ComboVal } from "./val.js";
import { stats, skills, Character, Feature, Weapon } from "./character.js";
import { render } from "./render.js";

const regexp_comment = /(.+)\((.+)\)/;
const regexp_var = /{([a-z]+)}/;
const regexp_mul = /([0-9]+)\*(.*)/;
const regexp_dice = /[0-9]+d[0-9]+/;

function parseVal(string, levels) {
  string = string.toString();
  if (string.includes("+")) {
    return new ComboVal(...string.split("+").map((x) => parseVal(x, levels)));
  }

  let comment = "";

  if (regexp_comment.test(string)) {
    let foo = regexp_comment.exec(string);
    string = foo[1];
    comment = foo[2];
  }

  comment = comment.trim();
  string = string.trim();

  if (string in stats) {
    return new StatVal(string, comment);
  }

  while (regexp_var.test(string)) {
    string = string.replace(regexp_var, (_, x) => levels[x]);
  }

  if (regexp_mul.test(string)) {
    let foo = regexp_mul.exec(string);
    return new MulVal(foo[1], parseVal(foo[2], levels), comment);
  }

  if (regexp_dice.test(string)) {
    return new DiceVal(string, comment);
  }

  return new Val(parseInt(string, 10), comment);
}

Object.prototype.map = function (func) {
  return Object.keys(this).reduce((acc, key) => {
    acc[key] = func(this[key]);
    return acc;
  }, {});
};

fetch("character.json")
  .then((r) => r.json())
  .then((r) => {
    const name = r.name;
    const info = r.info;

    const levels = r.levels;
    const hit_points = parseVal(r.hit_points, levels);
    const hit_dice = new ComboVal(
      ...r.hit_dice.map((x) => parseVal(x, levels))
    );
    const armour_class = parseVal(r.armour_class, levels);

    const stats = r.stats.map((x) => parseVal(x, levels));
    const saves = r.saves.map((x) => new ProfVal(x));
    const skills = r.skills.map((x) => new ProfVal(x));

    const features = r.features.map(
      (feature) =>
        new Feature(feature.name, feature.description, feature.source)
    );
    const backstory = Object.entries(r.backstory).map(
      ([key, value]) => new Feature(key, value, "")
    );

    const weapons = r.weapons.map(
      (weapon) =>
        new Weapon(
          weapon.name,
          Object.keys(weapon.damage).join("/"),
          weapon.proficient,
          parseVal(weapon.enchantment),
          Object.entries(weapon.damage).map(([type, damage]) =>
            parseVal(damage + "(" + type + ")", levels)
          ),
          weapon.notes
        )
    );

    window.character = new Character(
      name,
      info,
      levels,
      hit_points,
      // hit_dice,
      armour_class,
      stats,
      saves,
      skills,
      features,
      weapons,
      backstory
    );

    render();
  });
