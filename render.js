"use strict";

import { elemGenerator } from "https://javajawa.github.io/elems.js/elems.js";
import { Val, StatVal, ComboVal } from "./val.js";
import { stats, skills } from "./character.js";

const [
  h2,
  section,
  p,
  dl,
  dt,
  dd,
  div,
  abbr,
  span,
  summary,
  details,
  table,
  thead,
  tbody,
  tr,
  th,
  td,
] = [
  "h2",
  "section",
  "p",
  "dl",
  "dt",
  "dd",
  "div",
  "abbr",
  "span",
  "summary",
  "details",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
].map((x) => elemGenerator(x));

function value(val) {
  if (!(val instanceof Val)) {
    val = new Val(val, "[unknown reasons]");
  }

  if (!(val instanceof ComboVal)) {
    val = new ComboVal(val);
  }

  return [val.val, { title: val.reason }];
}

export function render() {
  document.getElementById("left").appendChild(
    section(
      { id: "identity" },
      h2(character.name),
      div(
        { id: "levels" },
        Object.entries(character.levels)
          .map(([clazz, lvl]) => "Lvl. " + lvl + " " + clazz)
          .join(", ")
      ),
      dl(
        Object.entries(character.info).map(([key, value]) => [
          dt(key),
          dd(value),
        ])
      )
    )
  );
  document.getElementById("left").appendChild(
    section(
      { id: "skills" },
      dl(
        Object.keys(skills)
          .map((skill) => [skill, character.skill(skill)])
          .map(([name, skill]) => [dt(name), dd(value(skill))])
      ),
      character.features.map((feature) =>
        details(
          summary(feature.name, { title: feature.reason }),
          p({ style: "font-style: italic" }, feature.reason),
          p(feature.description)
        )
      )
    )
  );
  document.getElementById("right").appendChild(
    section(
      { id: "statblock" },
      div(
        span("Profiency"),
        abbr({ class: "stat leather" }, value(character.profiency))
      ),
      div(
        span("Max HP"),
        abbr({ class: "stat leather" }, value(character.hit_points))
      ),
      div(
        span("Armour Class"),
        abbr({ class: "stat leather" }, value(character.armour_class))
      ),
      Object.entries(stats)
        .map(([stat, name]) => [
          name,
          character.stat(stat),
          character.stat_mod(stat),
          character.stat_save(stat),
        ])
        .map(([name, stat, mod, save]) =>
          div(
            span(name),
            abbr(
              value(stat),
              { class: "stat leather" },
              abbr(value(mod), { class: "stat left leather" }),
              abbr(value(save), { class: "stat right leather" })
            )
          )
        ),
      table(
        thead(tr(th("Weapon"), th("Attack"), th("Damage Roll"), th("Notes"))),
        tbody(
          character.weapons.map((weapon) =>
            tr(
              { class: "leather" },
              td(weapon.name),
              td("+", value(weapon.mods)),
              td(value(weapon.damage), " [" + weapon.type + "]"),
              td(weapon.notes)
            )
          )
        )
      )
    )
  );
  document.getElementById("right").appendChild(
    section(
      { id: "notes" },
      character.notes.map((feature) =>
        details(
          summary(feature.name, { title: feature.reason }),
          p({ style: "font-style: italic" }, feature.reason),
          p(feature.description)
        )
      )
    )
  );
}
