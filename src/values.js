export class NumericValue {
    constructor(val, reason) {
        this.value = val;
        this.reason = reason;
    }
    get representation() {
        return this.value.toString(10);
    }
    roll() {
        return this.value;
    }
}
export class MultiplierValue {
    constructor(mul, val, reason) {
        if (typeof val === "number") {
            val = new NumericValue(val, reason);
        }
        this.target = val;
        this.multiplier = mul;
        this.reason = mul + "× " + reason;
    }
    get representation() {
        if (this.target instanceof NumericValue) {
            return (this.multiplier * this.target.value).toString(10);
        }
        // FIXME: Need to handle a number of cases here.
        return this.multiplier.toString(10) + "×(" + this.target.representation + ")";
    }
    roll() {
        return this.multiplier * this.target.roll();
    }
}
// export class StatVal extends Val {
//   constructor(stat, reason) {
//     super(0, "+" + stat + (reason ? ", " + reason : ""));
//     this._stat = stat;
//   }
//
//   get val() {
//     return window.character.stat_mod(this._stat).val;
//   }
// }
//
// export class ProfVal extends Val {
//   constructor(reason) {
//     super(0, reason);
//   }
//
//   get val() {
//     return window.character.proficiency.val;
//   }
//
//   get reason() {
//     return "proficiency bouns, " + this._reason;
//   }
// }
//
// export class DiceVal extends Val {
//   constructor(_val, reason) {
//     let [val, sides] = _val.split("d");
//
//     super(val, reason);
//     this.sides = parseInt(sides, 10);
//   }
//
//   get val() {
//     return this._val + "d" + this.sides;
//   }
//
//   roll() {
//     let total = 0;
//     for (let i = 0; i < this._val; ++i) {
//       total += Math.floor(Math.random() * this.sides);
//     }
//     return total;
//   }
// }
//
// export class ComboVal implements Value {
//
//
//   constructor(...vals: Value[]) {
//     this._vals = vals.map((x) => (x instanceof ComboVal ? x._vals : x)).flat();
//   }
//
//   get val() {
//     const dice_vals = this._vals.reduce((out, val) => {
//       if (val instanceof DiceVal) {
//         out[val.sides] = val._val + (out[val.sides] || 0);
//       } else {
//         out[0] = (out[0] || 0) + val.val;
//       }
//
//       return out;
//     }, {});
//
//     const sides = Object.keys(dice_vals).sort().reverse();
//
//     const result = sides
//       .filter((count) => dice_vals[count] != 0)
//       .map((count) =>
//         count != 0 ? dice_vals[count] + "d" + count : dice_vals[count]
//       )
//       .join("+");
//
//     return result || "0";
//   }
//
//   get reason() {
//     return this._vals.map((r) => r.val + " [" + r.reason + "]").join("\n");
//   }
//
//   roll() {
//     return this._vals.reduce((total, val) => total + val.roll(), 0);
//   }
// }
//# sourceMappingURL=values.js.map