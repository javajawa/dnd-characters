"use strict";

import {elemGenerator} from "./elems";
import {Facts} from "./facts";
import {Info} from "./schema";
import {Skill, skills, Stat, stats} from "./stats";
import {ComboValue, DiceValue, SkillValue, Value} from "./values";
import {CharacterState} from "./script";
import {Ability, MeleeAttack, RangedAttack} from "./objects";

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
const a = elemGenerator("a");
const label = elemGenerator("label");
const input = elemGenerator("input");
const main = elemGenerator("main");

function value(val: Value, facts: Facts): [string, { title: string }] {
    return [val.can_resolve_with_facts(facts) ? val.resolve_with_facts(facts).toString(10) : val.representation(facts), {"title": val.reason(facts)}];
}

function request_roll(roll: string) {
    const e = new CustomEvent("roll", {detail: {roll: roll}});
    document.dispatchEvent(e);
}

function simple_roll(char_name: string, roll_name: string, value: ComboValue, facts: Facts): void {
    const modifier = value.values
        .filter(v => v.can_resolve_with_facts(facts))
        .map(v => v.resolve_with_facts(facts))
        .reduce((total, value) => total + value, 0);

    const roll_def = value.to_roll20(facts);

    // @ts-ignore
    request_roll(
        `&{template:simple} {{charname=${char_name}}} {{rname=${roll_name}}} {{always=1}} {{mod=${modifier}}} {{r1=[[${roll_def}]]}} {{r2=[[${roll_def}]]}}`
    );

    // const attack = "&{template:atk} {{charname=Light}} {{always=1}} {{mod=+8}} {{rname=Quarterstaff (1h)}} {{rnamec=Quarterstaff (1h)}} {{r1=[[1d20cs>20 + 5[DEX] + 3[PROF]]]}} 1d20cs>20 + 5[DEX] + 3[PROF]]]}} {{r2=[[1d20cs>20 + 5[DEX] + 3[PROF]]]}} 1d20cs>20 + 5[DEX] + 3[PROF]]]}}"
    // const damage = "&{template:dmg} {{charname=Light}} {{always=1}} {{damage=1}} {{dmg1=[[1d6 + 6]]}} {{dmg1flag=1}} {{dmg1type=Bludgeoning}} {{dmg2=[[1d6]]}} {{dmg2flag=1}} {{dmg2type=Force}}"
}

function stat_block(facts: Facts, state: CharacterState) {
    return section(
        main(
            {id: "stat_block"},
            p(
                Object.entries(stats).map(([stat, name]) =>
                    div(
                        {"class": "roundel"},
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
                    {"class": "roundel"},
                    span("Max HP"),
                    abbr({class: "stat leather"}, value(facts.hit_points, facts))
                ),
                facts.keys.filter(fact => !fact.startsWith("_")).map(fact => div(
                    {"class": "roundel"},
                    span(fact.replace(/_/g, " ")),
                    abbr({class: "stat leather"}, value(facts.get(fact), facts))
                )),
            ),
        ),

        tabSet({
            "Items":
                table(
                    tbody(
                        facts.inventory.filter(x => x.count > 0 && x.equippable).map(item =>
                            tr(
                                {class: "leather"},
                                td(
                                    label(
                                        {"for": item.name, "title": item.description},
                                        input({
                                            "type": "checkbox", "id": item.name, "checked": state.equipped(item),
                                            "change": e => state.equip(item, (e.target as HTMLInputElement).checked)
                                        }),
                                        a({"href": item.link, "target": "_blank"}, item.name),
                                    ),
                                ),
                            ),
                        ),
                        facts.toggles.map(feature =>
                            tr(
                                {class: "leather", "title": feature.description},
                                td(
                                    label(
                                        {"for": feature.name, "title": feature.description},
                                        input({
                                            "type": "checkbox", "id": feature.name, "checked": state.enabled(feature),
                                            "change": e => state.enable(feature, (e.target as HTMLInputElement).checked)
                                        }),
                                        a({"href": feature.link, "target": "_blank"}, feature.name),
                                    ),
                                ),
                            ),
                        ),
                    ),
                ),
            "Attacks":
                table(
                    tbody(
                        facts.attacks.sort(
                            (a, b) => {
                                if (a instanceof MeleeAttack && b instanceof RangedAttack) {
                                    return -1;
                                }
                                if (b instanceof MeleeAttack && a instanceof RangedAttack) {
                                    return 1;
                                }
                                if (a instanceof RangedAttack && b instanceof RangedAttack) {
                                    const diff = b.standard_range.resolve_with_facts(facts) - a.standard_range.resolve_with_facts(facts);
                                    if (diff !== 0) {
                                        return diff;
                                    }
                                }
                                if (a instanceof MeleeAttack && b instanceof MeleeAttack) {
                                    const diff = b.reach.resolve_with_facts(facts) - a.reach.resolve_with_facts(facts);
                                    if (diff !== 0) {
                                        return diff;
                                    }
                                }

                                return b.damage.expected(facts) - a.damage.expected(facts);
                            }
                        ).map((attack) =>
                            tr(
                                {class: "leather"},
                                td(
                                    {"title": attack.description},
                                    attack.description || attack.save ? details(summary(attack.name), attack.description) : attack.name
                                ),
                                td(attack instanceof MeleeAttack ?
                                    span(value(attack.reach, facts)) :
                                    [span(value(attack.standard_range, facts)), "/", span(value(attack.max_range, facts))],
                                    "ft"
                                ),
                                td(value(attack.attack_roll(facts), facts)),
                                td(value(attack.damage, facts), " (mean: ", attack.damage.expected(facts).toString(10), ")"),
                            )
                        )
                    )
                ),
            "Abilities":
                facts.abilities.sort((a, b) => {
                    return (a.from + a.name).localeCompare(b.from + b.name);
                }).map(ability => details(
                    {"class": "leather"},
                    summary(
                        ability.from,
                        " – ",
                        a({href: ability.link, target: "_blank"}, ability.name)
                    ),
                    saves_and_rolls(ability, facts),
                    ...html_to_element(ability.description),
                )),
        })
    );
}

function saves_and_rolls(thing: MeleeAttack|RangedAttack|Ability, facts: Facts) {
    let foo = Object.entries(thing.dice_rolls || {}).map(([name, roll]) =>
        p("Roll for ", name, ": ", value(roll, facts))
    )

    if (thing.save) {
        foo.unshift(p(
            "Save: ",
            thing.save.skill ? thing.save.skill + " (" + thing.save.stat + ")" : thing.save.stat,
            " dc ", value(thing.save.dc, facts),
            " modifier ", facts.modifier(thing.save.skill || thing.save.stat).toString(10)
        ));
    }

    return foo;
}

function tabSet(tabs: { [name: string]: Element | Element[] }): Element {
    const name = "tab-group-" + Math.random();

    return main(
        {"class": "tabs"},
        Object.entries(tabs).map(([title, element], index) => div(
            {"class": "tab"},
                input({"type": "radio", "name": name, "id": title, checked: index === 0}),
                label({"for": title, "style": "left: " + ((index * 90)+30) + "px"}, title),
            div({"class": "content"}, element, span({"style": "clear: both"}))
        ))
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
                    dd(
                        value(new SkillValue(skill as Skill, facts), facts),
                        {"click": _ => simple_roll(
                            "Light",
                                skill,
                                new ComboValue(new DiceValue(1, 20, ""), new SkillValue(skill as Skill, facts)),
                                facts
                        )}
                    ),
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

function html_to_element(html: string): NodeList {
    const block = details();
    block.innerHTML = html;

    return block.childNodes;
}

function story_block(facts: Facts) {
    return section(
        {id: "notes"},
        Object.entries(facts.notes).map(([title, text]) =>
            details(summary(title), ...html_to_element(text))
        )
    )
}

export function render(name: string, facts: Facts, info: Info, state: CharacterState) {
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

    right_panel.appendChild(stat_block(facts, state));
    right_panel.appendChild(story_block(facts));

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
