export class Val {
  constructor(val, reason) {
    this._val = parseInt(val, 10);
    this._reason = reason;
  }

  get val() {
    if (typeof this._val !== "number") {
      console.error("Bad value", this._val, this);
    }
    return this._val;
  }

  get reason() {
    return this._reason;
  }

  roll() {
    return this.val;
  }
}

export class MulVal extends Val {
  constructor(mul, val, reason) {
    super(0, reason);

    this._val = val;
    this.mul = mul;
  }

  get val() {
    return this.mul * this._val.val;
  }

  get reason() {
    return this.mul + "× " + this._reason;
  }

  roll() {
    return this.mul * this._val.roll();
  }
}

export class StatVal extends Val {
  constructor(stat, reason) {
    super(0, "+" + stat + (reason ? ", " + reason : ""));
    this._stat = stat;
  }

  get val() {
    return window.character.stat_mod(this._stat).val;
  }
}

export class ProfVal extends Val {
  constructor(reason) {
    super(0, reason);
  }

  get val() {
    return window.character.proficiency.val;
  }

  get reason() {
    return "proficiency bouns, " + this._reason;
  }
}

export class DiceVal extends Val {
  constructor(_val, reason) {
    let [val, sides] = _val.split("d");

    super(val, reason);
    this.sides = parseInt(sides, 10);
  }

  get val() {
    return this._val + "d" + this.sides;
  }

  roll() {
    let total = 0;
    for (let i = 0; i < this._val; ++i) {
      total += Math.floor(Math.random() * this.sides);
    }
    return total;
  }
}

export class ComboVal extends Val {
  constructor(...vals) {
    super(0, "");

    this._vals = vals.map((x) => (x instanceof ComboVal ? x._vals : x)).flat();
  }

  get val() {
    const dice_vals = this._vals.reduce((out, val) => {
      if (val instanceof DiceVal) {
        out[val.sides] = val._val + (out[val.sides] || 0);
      } else {
        out[0] = (out[0] || 0) + val.val;
      }

      return out;
    }, {});

    const sides = Object.keys(dice_vals).sort().reverse();

    const result = sides
      .filter((count) => dice_vals[count] != 0)
      .map((count) =>
        count != 0 ? dice_vals[count] + "d" + count : dice_vals[count]
      )
      .join("+");

    return result || "0";
  }

  get reason() {
    return this._vals.map((r) => r.val + " [" + r.reason + "]").join("\n");
  }

  roll() {
    return this._vals.reduce((total, val) => total + val.roll(), 0);
  }
}
