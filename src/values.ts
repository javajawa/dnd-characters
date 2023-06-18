import {Facts} from "./facts";
import {Skill, skills, Stat} from "./stats";

export abstract class Value {
    abstract reason(facts: Facts): string

    abstract representation(facts: Facts): string

    abstract roll(facts: Facts): number

    abstract can_resolve_without_facts(): boolean

    abstract can_resolve_with_facts(facts: Facts): boolean

    abstract resolve_without_facts(): number

    abstract resolve_with_facts(facts: Facts): number

    abstract expected(facts: Facts): number
}

export abstract class NumericValue extends Value {
    override can_resolve_with_facts(_: Facts): boolean {
        return true;
    }
}

export class FixedValue extends NumericValue {
    readonly _value: number;
    readonly _reason: string;

    constructor(value: number, reason: string) {
        super();

        this._value = value;
        this._reason = reason;
    }

    override representation(_: Facts) {
        return this._value.toString(10);
    }

    override reason(_: Facts) {
        return this._reason;
    }

    override roll(_: Facts) {
        return this._value;
    }

    override expected(_: Facts) {
        return this._value;
    }

    override can_resolve_without_facts(): boolean {
        return true;
    }

    override resolve_with_facts(_: Facts): number {
        return this._value;
    }

    override resolve_without_facts(): number {
        return this._value;
    }
}

export class MultiplierValue extends Value {
    private readonly multiplier: Value;
    private readonly target: Value;
    private readonly _reason: string;

    constructor(mul: NumericValue, val: Value, reason: string) {
        super();

        this.target = val;
        this.multiplier = mul;
        this._reason = reason;
    }

    override representation(facts: Facts) {
        if (this.target instanceof ComboValue || this.target instanceof MultiOptionedValue) {
            return this.multiplier.representation(facts) + "×(" + this.target.representation(facts) + ")";
        } else {
            return this.multiplier.representation(facts) + "×" + this.target.representation(facts);
        }
    }

    override reason(facts: Facts) {
        return this._reason || "[" + this.multiplier.reason(facts) + "]×[" + this.target.reason(facts) + "]";
    }

    roll(facts: Facts) {
        return this.multiplier.resolve_with_facts(facts) * this.target.roll(facts);
    }

    override expected(facts: Facts) {
        return this.multiplier.expected(facts) * this.target.expected(facts);
    }

    override can_resolve_without_facts(): boolean {
        return this.multiplier.can_resolve_without_facts() && this.target.can_resolve_without_facts();
    }

    override can_resolve_with_facts(facts: Facts): boolean {
        return this.multiplier.can_resolve_with_facts(facts) && this.target.can_resolve_with_facts(facts);
    }

    override resolve_without_facts(): number {
        return this.multiplier.resolve_without_facts() * this.target.resolve_without_facts();
    }

    override resolve_with_facts(facts: Facts): number {
        return this.multiplier.resolve_with_facts(facts) * this.target.resolve_with_facts(facts);
    }
}

export class DiceValue extends Value {
    readonly count: number;
    readonly sides: number;
    readonly _reason: string;

    constructor(count: number, sides: number, reason: string) {
        super();

        this.count = count;
        this.sides = sides;
        this._reason = reason;
    }

    override roll(_: Facts) {
        let total = 0;

        for (let i = 0; i < this.count; ++i) {
            total += Math.floor(Math.random() * this.sides);
        }

        return total;
    }

    override expected(_: Facts) {
        return this.count * (this.sides + 1) / 2;
    }

    override reason(_: Facts): string {
        return this._reason;
    }

    override representation(_: Facts): string {
        return this.count + "d" + this.sides;
    }

    override can_resolve_without_facts(): boolean {
        return false;
    }

    override can_resolve_with_facts(_: Facts): boolean {
        return false;
    }

    resolve_with_facts(_: Facts): number {
        throw new Error("Can not resolve DiceValue to a fixed value");
    }

    resolve_without_facts(): number {
        throw new Error("Can not resolve DiceValue to a fixed value");
    }
}

type DiceGrouping = { [sides: number]: number };

function to_dice(value: Value, facts: Facts): DiceValue | null {
    if (value instanceof DiceValue) {
        return value;
    }
    if (value instanceof FactValue) {
        return to_dice(facts.get(value.fact), facts);
    }
    if (value instanceof AdditionalValue) {
        return to_dice(value.inner, facts);
    }
    if (value instanceof MultiOptionedValue) {
        const inner = value.simplify(facts);
        if (inner instanceof DiceValue) {
            return inner;
        }
    }
    return null;
}

export class ComboValue extends Value {
    readonly values: Value[];

    constructor(...values: Value[]) {
        super();

        if (values.length == 0) {
            this.values = [];
            return;
        }

        this.values = values.map((x) => (x instanceof ComboValue ? x.values : x)).flat();
    }

    override roll(facts: Facts) {
        return this.values.reduce((total, val) => total + val.roll(facts), 0);
    }

    override expected(facts: Facts) {
        return this.values.reduce((total, val) => total + val.expected(facts), 0);
    }

    override representation(facts: Facts) {
        const dice: DiceValue[] = this.values.map(x => to_dice(x, facts)).filter(x => x !== null) as DiceValue[];
        const statics: Value[] = this.values.filter(x => x.can_resolve_with_facts(facts));
        const other: Value[] = this.values.filter(x => !(to_dice(x, facts) || (x.can_resolve_with_facts(facts))));

        const static_part = statics.length ? statics.reduce((total, value) => total + value.resolve_with_facts(facts), 0).toString(10) : [];
        const grouped_dice: DiceValue[] = Object.entries(
            dice.reduce((totals: DiceGrouping, die) => {
                const sides = die.sides;
                totals[sides] = die.count + (totals[sides] || 0);
                return totals;
            }, {})
        ).sort(
            ([l_sides, _], [r_sides, _a]) => parseInt(r_sides, 10) - parseInt(l_sides, 10)
        ).map(
            ([sides, count]) =>
                new DiceValue(count, parseInt(sides), "")
        );

        return [...other.map(value => value.representation(facts)), grouped_dice.map(value => value.representation(facts)), static_part].flat().join(" + ");
    }

    override reason(facts: Facts) {
        const dice: Value[] = this.values.filter(x => to_dice(x, facts));
        const statics: Value[] = this.values.filter(x => x.can_resolve_with_facts(facts))
            .sort((a, b) => b.resolve_with_facts(facts) - a.resolve_with_facts(facts));
        const other: Value[] = this.values.filter(x => !(to_dice(x, facts) || (x.can_resolve_with_facts(facts))));

        return [...dice, ...statics, ...other].map(r => r.can_resolve_with_facts(facts) && r.resolve_with_facts(facts) === 0 ? "" : r.representation(facts) + " [" + r.reason(facts).replace(/\n/gm, " | ") + "]").filter(x => x).join("\n");
    }

    can_resolve_without_facts(): boolean {
        return this.values.every(v => v.can_resolve_without_facts());
    }

    can_resolve_with_facts(facts: Facts): boolean {
        return this.values.every(v => v.can_resolve_with_facts(facts));
    }

    resolve_without_facts(): number {
        return this.values.reduce((total, v) => total + v.resolve_without_facts(), 0);
    }

    resolve_with_facts(facts: Facts): number {
        return this.values.reduce((total, v) => total + v.resolve_with_facts(facts), 0);
    }

    to_roll20(facts: Facts): string {
        return this.values.filter(v => v.expected(facts) > 0).map(v => this._value_to_roll20(v, facts)).join(" + ");
    }

    private _value_to_roll20(v: Value, facts: Facts): string {
        if (v instanceof ComboValue) {
            return v.to_roll20(facts);
        }
        if (v instanceof DiceValue) {
            return v.representation(facts);
        }
        if (v instanceof StatValue) {
            return v.resolve_with_facts(facts).toString(10) + "[" + v.stat + "]";
        }
        if (v instanceof FactValue) {
            return (v.can_resolve_with_facts(facts) ? v.resolve_with_facts(facts).toString(10) : v.representation(facts)) + "[" + v.fact.replace(/_/g, " ").trim() + "]";
        }
        if (v instanceof ProficiencyValue) {
            return v.resolve_with_facts(facts).toString(10) + "[prof]";
        }
        if (v instanceof MultiOptionedValue) {
            if (!(v.simplify(facts) instanceof MultiOptionedValue)) {
                return this._value_to_roll20(v.simplify(facts), facts);
            }
        }

        return v.can_resolve_with_facts(facts) ? v.resolve_with_facts(facts).toString(10) : v.representation(facts);
    }
}

export class MultiOptionedValue extends Value {
    options: Value[];

    constructor(...values: Value[]) {
        super();

        this.options = values.map(v => v instanceof MultiOptionedValue ? v.options : v).flat();
    }

    override representation(facts: Facts): string {
        const target = this.simplify(facts);

        if (target !== this) {
            return target.representation(facts);
        }

        return this.options.map(x => x.representation(facts)).join(" or ");
    }

    override reason(facts: Facts): string {
        return this.options
            .sort((a, b) => b.expected(facts) - a.expected(facts))
            .map(x => x.representation(facts) + " [" + x.reason(facts).replace(/\n/mg, ", ") + "]")
            .join("\n");
    }

    override roll(_: Facts): number {
        return 0;
    }

    override expected(facts: Facts) {
        return Math.max(...this.options.map(x => x.expected(facts)));
    }

    override can_resolve_without_facts(): boolean {
        return this.options.every(v => v.can_resolve_without_facts());
    }

    override can_resolve_with_facts(facts: Facts): boolean {
        return this.options.every(v => v.can_resolve_with_facts(facts));
    }

    resolve_with_facts(facts: Facts): number {
        return Math.max(...this.options.map(x => x.resolve_with_facts(facts)));
    }

    resolve_without_facts(): number {
        return Math.max(...this.options.map(x => x.resolve_without_facts()));
    }

    simplify(facts: Facts): Value {
        if (this.options.length === 0) {
            return this;
        }

        if (this.can_resolve_with_facts(facts)) {
            return [...this.options].sort((a, b) => a.resolve_with_facts(facts) - b.resolve_with_facts(facts)).pop() || this;
        }

        const dice = this.options.map(s => to_dice(s, facts));

        if (dice.every(s => s instanceof DiceValue)) {
            return (dice as DiceValue[]).sort((a, b) => a.expected(facts) - b.expected(facts)).pop() || this;
        }

        return this;
    }
}

export class StatValue extends Value {
    readonly stat: Stat;
    readonly _reason: string;

    constructor(stat: Stat, reason: string) {
        super();

        this.stat = stat;
        this._reason = reason;
    }

    can_resolve_with_facts(facts: Facts): boolean {
        return facts.stats[this.stat].can_resolve_with_facts(facts);
    }

    can_resolve_without_facts(): boolean {
        return false;
    }

    representation(facts: Facts): string {
        return this.resolve_with_facts(facts).toString();
    }

    reason(_: Facts): string {
        return "[" + this.stat + "] " + this._reason;
    }

    resolve_with_facts(facts: Facts): number {
        const stat = facts.stats[this.stat].resolve_with_facts(facts);

        return Math.floor((stat - 10) / 2);
    }

    resolve_without_facts(): number {
        return 0;
    }

    roll(facts: Facts): number {
        return this.resolve_with_facts(facts);
    }

    expected(facts: Facts): number {
        return this.resolve_with_facts(facts);
    }
}

export class StatSaveValue extends StatValue {
    override resolve_with_facts(facts: Facts): number {
        const modifier = super.resolve_with_facts(facts);

        if (this.stat in facts.proficiencies.ability_save) {
            return modifier + facts.proficiency_bonus;
        }

        return modifier;
    }

}

export class SkillValue extends ComboValue {
    constructor(skill: Skill, facts: Facts) {
        const components: Value[] = [new StatValue(skills[skill], "Stat for " + skill)];

        if (skill in facts.proficiencies.skill) {
            components.push(new ProficiencyValue(facts.proficiencies.skill[skill] || ""));
        }

        super(...components);
    }

}

export class ProficiencyValue extends Value {
    readonly _reason: string;

    constructor(reason: string) {
        super();

        this._reason = reason;
    }

    can_resolve_with_facts(_: Facts): boolean {
        return true;
    }

    can_resolve_without_facts(): boolean {
        return false;
    }

    representation(facts: Facts): string {
        return this.resolve_with_facts(facts).toString(10);
    }

    reason(_: Facts): string {
        return "[prof] " + this._reason;
    }

    resolve_with_facts(facts: Facts): number {
        return facts.proficiency_bonus;
    }

    resolve_without_facts(): number {
        return 0;
    }

    roll(facts: Facts): number {
        return facts.proficiency_bonus;
    }

    expected(facts: Facts): number {
        return this.roll(facts);
    }
}

export class FactValue extends Value {
    readonly fact: string;
    readonly _reason: string;

    constructor(fact: string, reason: string) {
        super();

        this.fact = fact;
        this._reason = reason;
    }

    can_resolve_with_facts(facts: Facts): boolean {
        return facts.get(this.fact).can_resolve_with_facts(facts);
    }

    can_resolve_without_facts(): boolean {
        return false;
    }

    representation(facts: Facts): string {
        return facts.get(this.fact).representation(facts);
    }

    reason(_: Facts): string {
        return "[" + this.fact.replace("_", " ").trim() + "] " + this._reason;
    }

    resolve_with_facts(facts: Facts): number {
        return facts.get(this.fact).resolve_with_facts(facts);
    }

    resolve_without_facts(): number {
        return 0;
    }

    roll(facts: Facts): number {
        return facts.get(this.fact).roll(facts);
    }

    expected(facts: Facts): number {
        return facts.get(this.fact).expected(facts);
    }
}

class AdditionalValue implements Value {
    readonly inner: Value;

    constructor(value: Value) {
        this.inner = value;
    }

    can_resolve_with_facts(facts: Facts): boolean {
        return this.inner.can_resolve_with_facts(facts);
    }

    can_resolve_without_facts(): boolean {
        return this.inner.can_resolve_without_facts();
    }

    expected(facts: Facts): number {
        return this.inner.expected(facts);
    }

    reason(facts: Facts): string {
        return this.inner.reason(facts);
    }

    representation(facts: Facts): string {
        return this.inner.representation(facts);
    }

    resolve_with_facts(facts: Facts): number {
        return this.inner.resolve_with_facts(facts);
    }

    resolve_without_facts(): number {
        return this.inner.resolve_without_facts();
    }

    roll(facts: Facts): number {
        return this.inner.roll(facts);
    }
}

const regexp_dice = /^([0-9]*)d([0-9]+)$/;
const regexp_mul = /^([0-9]+)\*(\[?[^\]]+]?)$/;
const regexp_fact = /^\{([a-zA-Z_ ]+)}$/;
const regexp_comment = /^(.+)\((.+)\)$/;

function parseValueString(input: string, reason: string): Value {
    if (input.includes(" + ")) {
        return new ComboValue(
            ...input.split("+").map(v => processValueFromString(v, reason))
        );
    }

    if (input.includes("|")) {
        return new MultiOptionedValue(
            ...input.split("|").map(v => processValueFromString(v, reason))
        );
    }

    if (regexp_comment.test(input)) {
        [, input, reason] = regexp_comment.exec(input) as string[];

        input = input.trim();
        reason = reason.trim();
    }

    if (input in Stat) {
        return new StatValue(input as Stat, reason);
    }

    if (input === "prof") {
        return new ProficiencyValue(reason);
    }

    if (regexp_dice.test(input)) {
        const [, count, sides] = regexp_dice.exec(input) as string[];

        return new DiceValue(parseInt(count || "1", 10), parseInt(sides || "0", 10), reason);
    }

    if (regexp_fact.test(input)) {
        const [, fact] = regexp_fact.exec(input) as string[];

        return new FactValue(fact || "", reason);
    }

    if (regexp_mul.test(input)) {
        const [, mul, value] = regexp_mul.exec(input) as string[];

        const inner_value = (value || "")
            .replace("[", "")
            .replace("]", "")
            .replace("+", " + ");

        return new MultiplierValue(
            new FixedValue(parseInt(mul || "1", 10), reason),
            processValueFromString(inner_value, reason),
            reason
        );
    }

    if (!/^[0-9]+$/.test(input)) {
        console.log(input, reason);
    }

    return new FixedValue(parseInt(input), reason);
}

export function processValueFromString(input: string, reason: string, existing?: Value): Value {
    input = input.toString().trim();

    if (input.startsWith("+")) {
        const value = parseValueString(input.substring(1), reason);

        return existing ? combine(value, existing) : new AdditionalValue(value);
    }

    const value = parseValueString(input, reason);

    if (existing instanceof AdditionalValue) {
        return combine(value, existing);
    }
    let exist_additions: AdditionalValue[] = [];

    if (existing instanceof ComboValue) {
        exist_additions = existing.values.filter(s => s instanceof AdditionalValue) as AdditionalValue[];
    }
    if (existing instanceof MultiOptionedValue) {
        const option = existing.options[0];
        if (option instanceof ComboValue) {
            exist_additions = option.values.filter(s => s instanceof AdditionalValue) as AdditionalValue[];
        }
    }


    return existing ? new MultiOptionedValue(existing, exist_additions.length ? new ComboValue(value, ...exist_additions) : value) : value;
}

function combine(value: Value, existing?: Value): Value {
    if (!existing) {
        return value;
    }

    if (existing instanceof AdditionalValue) {
        if (value instanceof AdditionalValue) {
            return new AdditionalValue(new ComboValue(existing.inner, value.inner));
        }
        return combine(existing, value);
    }

    if (existing instanceof MultiOptionedValue) {
        if (value instanceof MultiOptionedValue) {
            return new MultiOptionedValue(...existing.options, ...value.options);
        }

        return new MultiOptionedValue(...existing.options.map(v => combine(value, v)));
    }

    if (value instanceof MultiOptionedValue) {
        return combine(existing, value);
    }

    if (existing instanceof ComboValue) {
        return new ComboValue(...existing.values, value);
    }

    return new ComboValue(existing, value);
}
