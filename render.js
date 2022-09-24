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
  hr,
  img,
  a,
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
  "hr",
  "img",
  "a",
].map((x) => elemGenerator(x));

function value(val) {
  if (!(val instanceof Val)) {
	let reason = "[unknown reasons]";
	if ((typeof val === 'string') && val.includes("(")) {
      [val, reason] = val.split("(");
	  reason = reason.replace(")", "");
	}
    return [val, { "title": reason }];
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
      details(
      	{"open": true},
        summary("Skills"),
	    dl(
		  Object.keys(skills)
		    .map((skill) => [skill, character.skill(skill)])
			.map(([name, skill]) => [
				dt(name, {"class": skill in character.skills ? "proficient" : "", "title": skill.reason}),
				dd(value(skill))
			])
	    ),
	  ),
      details(
      	summary("Weapons"),
      	dl(Object.entries(character.proficiencies.weapons).map(([a, b]) => dt(a, {"title": b}))),
      ),
	  details(
      	summary("Armour"),
      	dl(Object.entries(character.proficiencies.armour).map(([a, b]) => dt(a, {"title": b}))),
      ),
      details(
      	summary("Tools"),
      	dl(Object.entries(character.proficiencies.tools).map(([a, b]) => dt(a, {"title": b}))),
      ),
    )
  );
  document.getElementById("right").appendChild(
    section(
      { id: "statblock" },
      p(
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
      ), p(
      div(
        span("Proficiency"),
        abbr({ class: "stat leather" }, value(character.proficiency))
      ),
      Object.keys(character.facts)
        .map(fact => div(
          span(fact),
          abbr({ class: "stat leather" }, value(character.fact(fact)))
      )),
      ),
      table(
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
      character.features.map((feature) =>
        details(
          summary(feature.name, { title: feature.reason }, feature.dice ? span(" (", value(feature.dice), ")") : null),
          p({ style: "font-style: italic" }, feature.reason),
          p(feature.description)
        )
      ),
      hr(),
      character.notes.map((feature) =>
        details(
          summary(feature.name, { title: feature.reason }),
          p({ style: "font-style: italic" }, feature.reason),
          p(feature.description.split(/(https:\/\/[^ \n]+)/).map(c => /^https:\/\//.test(c) ? img({"src": c}) : c))
        )
      ),
    )
  );
  document.getElementById("right").appendChild(
    section(
      { id: "inventory" },

      character.inventory.map(item => item.split("|")).map(([name, link]) => a(name, {"href": link || "#", "target": "_blank", "style": "transform: rotate(" + (10*(Math.random()-0.5)) + "deg)"}))
    )
  );
}
