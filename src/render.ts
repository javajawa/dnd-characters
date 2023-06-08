"use strict";

import {elemGenerator} from "./elems";
import {Facts} from "./facts";
import {Info} from "./schema";
import {Skill, skills, Stat, stats} from "./stats";
import {ComboValue, DiceValue, SkillValue, Value} from "./values";

const h2 = elemGenerator("h2");
const section = elemGenerator("section");
const p = elemGenerator("p");
const dl = elemGenerator("dl");
const dt = elemGenerator("dt");
const dd = elemGenerator("dd");
const div = elemGenerator("div");
const abbr = elemGenerator("abbr");
const span = elemGenerator("span");
const summary = elemGenerator("summary");
const details = elemGenerator("details");
const table = elemGenerator("table");
const tbody = elemGenerator("tbody");
const tr = elemGenerator("tr");
const td = elemGenerator("td");
const hr = elemGenerator("hr");
const img = elemGenerator("img");
const a = elemGenerator("a");


function value(val: Value, facts: Facts): [string, { title: string }] {
    if (val.can_resolve_with_facts()) {
        return [val.resolve_with_facts(facts).toString(10), {"title": val.reason(facts)}];
    } else {
        console.log(val);
    }

    return [val.representation(facts), {"title": val.reason(facts)}]
}

function stat_block(facts: Facts) {
    return section(
        {id: "statblock"},
        p(
            Object.entries(stats).map(([stat, name]) =>
                div(
                    span(name),
                    abbr(
                        value(facts.stats[stat as Stat] as ComboValue, facts),
                        {class: "stat leather"},
                        abbr(facts.modifier(stat as Stat).toString(10), {class: "stat left leather"}),
                        abbr(facts.save(stat as Stat).toString(10), {class: "stat right leather"})
                    )
                )
            ),
        ),
        p(
            div(
                span("Max HP"),
                abbr({class: "stat leather"}, value(facts.hit_points, facts))
            ),
            facts.keys.map(fact => div(
                span(fact.replace(/_/g, " ")),
                abbr({class: "stat leather"}, value(facts.get(fact), facts))
            )),
        ),
        table(
            tbody(
                facts.attacks.map((attack) =>
                    tr(
                        {class: "leather"},
                        td(attack.description ? details(summary(attack.name), attack.description) : attack.name),
                        td(value(attack.reach, facts), "ft"),
                        td(value(attack.attack_roll(facts), facts)),
                        td(value(attack.damage, facts)),
                    )
                )
            )
        )
    );
}

function info_block(name: string, facts: Facts, info: Info) {
    return section(
        {id: "identity"},
        h2(name),
        div(
            {id: "levels"},
            Object.entries(facts.levels)
                .map(([clazz, lvl]) => "Lvl. " + lvl + " " + clazz)
                .join(", ")
        ),
        dl(
            Object.entries(info).map(([key, value]) => [
                dt(key),
                value instanceof Array ? value.map(x => dd(x)) : dd(value),
            ])
        )
    );
}

function skills_block(facts: Facts) {
    return section(
        {id: "skills"},
        details(
            {"open": true},
            summary("Skills"),
            dl(
                Object.keys(skills).map(skill => [
                    dt(skill),
                    dd(value(new SkillValue(skill as Skill, facts), facts)),
                ])
            ),
        ),
        details(
            summary("Weapons"),
            dl(Object.entries(facts.proficiencies.weapon).map(([a, b]) => dt(a, {"title": b}))),
        ),
        details(
            summary("Armour"),
            dl(Object.entries(facts.proficiencies.armour).map(([a, b]) => dt(a, {"title": b}))),
        ),
        details(
            summary("Tools"),
            dl(Object.entries(facts.proficiencies.equipment).map(([a, b]) => dt(a, {"title": b}))),
        ),
    );
}

function story_block(facts: Facts) {
    return section(
        {id: "notes"},
        Object.entries(facts.notes).map(([title, text]) => {
            const block = details();
            block.innerHTML = text;
            block.prepend(summary(title));
            return block;
        })
    )
}

export function render(name: string, facts: Facts, info: Info) {
    const left_panel = document.getElementById("left");
    const right_panel = document.getElementById("right");

    if (!left_panel) {
        throw new Error("Missing left panel");
    }
    if (!right_panel) {
        throw new Error("Missing left panel");
    }

    left_panel.appendChild(info_block(name, facts, info));
    left_panel.appendChild(skills_block(facts));

    right_panel.appendChild(stat_block(facts));
    right_panel.appendChild(story_block(facts));

    // table(
    //             tbody(
    //                 character.weapons.map((weapon) =>
    //                     tr(
    //                         {class: "leather"},
    //                         td(weapon.name),
    //                         td(weapon.effectiveRange ? [span(value(weapon.effectiveRange)), "/", span(value(weapon.maxRange))] : ""),
    //                         td("+", value(weapon.mods)),
    //                         td(value(weapon.damage), " [" + weapon.type + "]"),
    //                         td(weapon.notes)
    //                     )
    //                 )
    //             )
    //         )
    //     )
    // );
    // document.getElementById("right").appendChild(
    //     section(
    //         {id: "notes"},
    //         character.features.map((feature) =>
    //             details(
    //                 summary(feature.name, {title: feature.reason}, feature.dice ? span(" (", value(feature.dice), ")") : null),
    //                 p({style: "font-style: italic"}, feature.reason),
    //                 p(feature.description)
    //             )
    //         ),
    //         hr(),
    //         character.notes.map((feature) =>
    //             details(
    //                 summary(feature.name, {title: feature.reason}),
    //                 p({style: "font-style: italic"}, feature.reason),
    //                 p(feature.description.split(/(https:\/\/[^ \n]+)/).map(c => /^https:\/\//.test(c) ? img({"src": c}) : c))
    //             )
    //         ),
    //     )
    // );
    // document.getElementById("right").appendChild(
    //     section(
    //         {id: "inventory"},
    //
    //         character.inventory.map(item => item.split("|")).map(([name, link]) => a(name, {
    //             "href": link || "#",
    //             "target": "_blank",
    //             "style": "transform: rotate(" + (10 * (Math.random() - 0.5)) + "deg)"
    //         }))
    //     )
    // );
}
