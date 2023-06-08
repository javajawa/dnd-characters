import {Facts} from "./facts";
import {Skill, skills, Stat} from "./stats";

export abstract class Value {
  abstract reason(facts: Facts): string
  abstract representation(facts: Facts): string
  abstract roll(facts: Facts): number
  abstract can_resolve_without_facts(): boolean
  abstract can_resolve_with_facts(): boolean
  abstract resolve_without_facts(): number
  abstract resolve_with_facts(facts: Facts): number
}

export abstract class NumericValue extends Value {
  override can_resolve_with_facts(): boolean {
    return true;
  }
}

export class FixedValue extends NumericValue {
  readonly _value: number
  readonly _reason: string

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

  override can_resolve_without_facts(): boolean {
    return true;
  }

  override can_resolve_with_facts(): boolean {
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
  private readonly multiplier: Value
  private readonly target: Value
  private readonly _reason: string

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

  override can_resolve_without_facts(): boolean {
    return this.multiplier.can_resolve_without_facts() && this.target.can_resolve_without_facts();
  }

  override can_resolve_with_facts(): boolean {
    return this.multiplier.can_resolve_without_facts() && this.target.can_resolve_without_facts();
  }

  override resolve_without_facts(): number {
    return this.multiplier.resolve_without_facts() * this.target.resolve_without_facts();
  }

  override resolve_with_facts(facts: Facts): number {
    return this.multiplier.resolve_with_facts(facts) * this.target.resolve_with_facts(facts);
  }
}

export class DiceValue extends Value {
  readonly count: number
  readonly sides: number
  readonly _reason: string

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

  override reason(_: Facts): string {
    return this._reason;
  }

  override representation(_: Facts): string {
    return this.count + "d" + this.sides;
  }

  override can_resolve_without_facts(): boolean {
    return false;
  }

  override can_resolve_with_facts(): boolean {
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

export class ComboValue extends Value {
  readonly values: Value[]

  constructor(...values: Value[]) {
    super();

    if (values.length == 0) {
      this.values = [];
      return;
    }

    this.values = values.map((x) => (x instanceof ComboValue ? x.values : x)).flat();
  }

  override representation(facts: Facts) {
    const dice: DiceValue[] = this.values.filter(x => x instanceof DiceValue) as DiceValue[];
    const statics: Value[] = this.values.filter(x => x.can_resolve_with_facts());
    const other: Value[] = this.values.filter(x => !((x instanceof DiceValue) || (x.can_resolve_with_facts())));

    const static_part = statics.length ? statics.reduce((total, value) => total + value.resolve_with_facts(facts), 0).toString(10) : [];
    const grouped_dice: DiceValue[] = Object.entries(
        dice.reduce((totals: DiceGrouping, die) => {
          const sides = die.sides;
          totals[sides] = die.count + (totals[sides] || 0);
          return totals;
        }, {})
    ).map(
        ([sides, count]) =>
        new DiceValue(count, parseInt(sides), "")
    );

    return [...other.map(value => value.representation(facts)), grouped_dice.map(value => value.representation(facts)), static_part].flat().join(" + ");
  }

  override reason(facts: Facts) {
    return this.values.map(r => r.representation(facts) + " [" + r.reason(facts).replace(/\n/gm, " | ") + "]").join("\n");
  }

  override roll(facts: Facts) {
    return this.values.reduce((total, val) => total + val.roll(facts), 0);
  }
  can_resolve_without_facts(): boolean {
      return this.values.every(v => v.can_resolve_without_facts());
  }
  can_resolve_with_facts(): boolean {
      return this.values.every(v => v.can_resolve_with_facts());
  }
  resolve_without_facts(): number {
      return this.values.reduce((total, v) => total + v.resolve_without_facts(), 0);
  }
  resolve_with_facts(facts: Facts): number {
      return this.values.reduce((total, v) => total + v.resolve_with_facts(facts), 0);
  }
}

export class MultiOptionedValue extends Value {
  options: Value[]

  constructor(...values: Value[]) {
    super();

    this.options = values;
  }

  override representation(facts: Facts): string {
    return this.options.map(x => x.representation(facts)).join(" or ");
  }

  override reason(facts: Facts): string {
    return this.options.map(x => x.representation(facts) + " [" + x.reason(facts).replace(/\n/mg, ", ") + "]").join("\n");
  }

  override roll(_: Facts): number {
    return 0;
  }

  override can_resolve_without_facts(): boolean {
    return this.options.every(v => v.can_resolve_without_facts());
  }

  override can_resolve_with_facts(): boolean {
    return this.options.every(v => v.can_resolve_with_facts());
  }

  resolve_with_facts(facts: Facts): number {
    return Math.max(...this.options.map(x => x.resolve_with_facts(facts)));
  }

  resolve_without_facts(): number {
    return Math.max(...this.options.map(x => x.resolve_without_facts()));
  }
}

class StatValue extends Value {
  readonly stat: Stat;
  readonly _reason: string;

  constructor(stat: Stat, reason: string) {
    super();

    this.stat = stat;
    this._reason = reason;
  }

  can_resolve_with_facts(): boolean {
    return true;
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
    return facts.modifier(this.stat);
  }

  resolve_without_facts(): number {
    return 0;
  }

  roll(facts: Facts): number {
    return facts.modifier(this.stat);
  }
}

export class SkillValue extends ComboValue {
  constructor(skill: Skill, facts: Facts) {
    let components: Value[] = [new StatValue(skills[skill], "Stat for " + skill)];

    if (skill in facts.proficiencies.skill) {
      components.push(new ProficiencyValue(facts.proficiencies.skill[skill] || ""))
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

  can_resolve_with_facts(): boolean {
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
}

const regexp_dice = /([0-9]*)d([0-9]+)/;
const regexp_fact = /\{([a-z_]+)}/;
const regexp_comment = /(.+)\((.+)\)/;

function parseValueString(input: string, reason: string): Value {
  if (input.includes("+")) {
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
    // @ts-ignore
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
    let [, count, sides] = regexp_dice.exec(input) as string[];

    return new DiceValue(parseInt(count || "1", 10), parseInt(sides || "0", 10), reason);
  }

  if (regexp_fact.test(input)) {
    let [, fact] = regexp_fact.exec(input) as string[];

    return new FixedValue(7, fact || "");
  }

  // FIXME: Write all the handling code here.
  return new FixedValue(parseInt(input), reason);
}

export function processValueFromString(input: string, reason: string, existing?: Value): Value {
  input = input.toString().trim();

  if (input.startsWith("+")) {
    return combine(processValueFromString(input.substring(1), reason), existing);
  }

  if (input.startsWith("*")) {
    console.error("Multipliers not implemented", input, reason);

    return existing || new FixedValue(0, reason);
  }

  const value = parseValueString(input, reason);

  return existing ? new MultiOptionedValue(existing, value) : value;
}

function combine(value: Value, existing?: Value): Value {
  if (!existing) {
    return value;
  }

  if (existing instanceof MultiOptionedValue) {
    if (value instanceof MultiOptionedValue) {
      return new MultiOptionedValue(...existing.options, ...value.options);
    }

    return new MultiOptionedValue(...existing.options.map(v => combine(value, v)))
  }

  if (value instanceof MultiOptionedValue) {
    return combine(existing, value);
  }

  if (existing instanceof ComboValue) {
    return new ComboValue(...existing.values, value);
  }

  return new ComboValue(existing, value);
}
