"use strict";

import {elemGenerator} from "./elems";
import {Facts} from "./facts";
import {DamageType, Info} from "./schema";
import {Skill, skills, Stat, stats} from "./stats";
import {ComboValue, DiceValue, SkillValue, StatSaveValue, StatValue, Value} from "./values";
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

function roll_string(value: ComboValue, facts: Facts): [number, string] {
    const modifier = value.values
        .filter(v => v.can_resolve_with_facts(facts))
        .map(v => v.resolve_with_facts(facts))
        .reduce((total, value) => total + value, 0);

    return [modifier, value.to_roll20(facts)];
}

function simple_roll(roll_name: string, _value: Value, facts: Facts): void {
    const value = new ComboValue(new DiceValue(1, 20, ""), _value);
    const [modifier, roll_def] = roll_string(value, facts);

    request_roll(
        `&{template:simple} {{rname=${roll_name}}} {{always=1}} {{mod=${modifier}}} {{r1=[[${roll_def}]]}} {{r2=[[${roll_def}]]}}`
    );
}

function attack_roll(weapon: string, attack: ComboValue, facts: Facts): void {
    const [modifier, roll_def] = roll_string(attack, facts);

    request_roll(
        `&{template:atk} {{rname=${weapon}}} {{always=1}} {{mod=${modifier}}} {{rname=${weapon}}} {{r1=[[${roll_def}]]}} {{r2=[[${roll_def}]]}}`
    );
}

function damage_roll(weapon: string, damage: { [k in DamageType]: Value}, facts: Facts): void {
    Object.entries(damage)
        .map(([type, v]) => [type, v instanceof ComboValue ? v : new ComboValue(v)] as [string, ComboValue])
        .filter(([_, damage]) => damage.expected(facts) > 0)
        .reduce(
        (acc, [type, value], idx) => {
            const j = idx % 2;
            const i = (idx - j) / 2;

            if (j === 0) {
                acc[i] = acc[i] || [[type, value], [null, null]];
            } else {
                // @ts-ignore
                acc[i][j] = [type, value];
            }

            return acc;
        },
        [] as [[string, ComboValue], [string|null, ComboValue|null]][]
    ).map(([[type_1, damage_1], [type_2, damage_2]]) => {
        request_roll(
            `&{template:dmg} {{rname=${weapon}}} {{damage=1}} ` +
            `{{dmg1flag=1}} {{dmg1type=${type_1}}} {{dmg1=[[${damage_1.to_roll20(facts)}]]}} ` +
            `${type_2 ? "{{dmg2flag= 1 : 0}}" : ""} {{dmg2type=${type_2 || "0"}}} {{dmg2=[[${damage_2?.to_roll20(facts) || "0"}]]}} `
        );
    })


}
function stat_block(facts: Facts, state: CharacterState) {
    return section(
        main(
            {id: "stat_block"},
            p(
                Object.entries(stats).map(([id, name]) => {
                    const stat = facts.stats[id as Stat];
                    const roll = new StatValue(id as Stat, "roll");
                    const save = new StatSaveValue(id as Stat, "save");

                    return div(
                        {"class": "roundel"},
                        span(name),
                        abbr(
                            value(stat, facts),
                            {class: "stat leather"},
                            abbr(
                                roll.resolve_with_facts(facts).toString(10),
                                {
                                    "class": "stat left leather",
                                    "click": _ => simple_roll(name + " check", roll, facts),
                                }
                            ),
                            abbr(
                                save.resolve_with_facts(facts).toString(10),
                                {
                                    "class": "stat right leather",
                                    "click": _ => simple_roll(name + " save", save, facts),
                                }
                            ),
                        )
                    )
                }),
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

                                return b.total_damage.expected(facts) - a.total_damage.expected(facts);
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
                                td(
                                    value(attack.attack_roll(facts), facts),
                                    {"click": _ => attack_roll(attack.name, attack.attack_roll(facts), facts)},
                                ),
                                td(
                                    value(attack.total_damage, facts),
                                    " (mean: ", attack.total_damage.expected(facts).toString(10), ")",
                                    {"click": _ => damage_roll(attack.name, attack.damage, facts)},
                                ),
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
        const save = thing.save.skill ? new SkillValue(thing.save.skill, facts) : new StatValue(thing.save.stat, "save");

        foo.unshift(p(
            "Save: ",
            thing.save.skill ? thing.save.skill + " (" + thing.save.stat + ")" : thing.save.stat,
            " dc ", value(thing.save.dc, facts),
            " modifier ", span(value(save, facts))
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
                        {"click": _ => simple_roll(skill, new SkillValue(skill as Skill, facts), facts)}
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
