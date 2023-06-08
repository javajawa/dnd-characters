import {Feat as IFeat, Item as IItem} from "./schema";
import {ComboValue} from "./values";

export class Item implements IItem {
    readonly name: string;
    readonly description: string;
    readonly link: string;

    readonly equipped: boolean;
    readonly count: number;
    readonly value: number | string;
    readonly weight: number;

    constructor(name: string, description: string, link: string, equipped: boolean, count: number, value: string, weight: number) {
        this.name = name;
        this.description = description;
        this.link = link;
        this.equipped = equipped;
        this.count = count;
        this.value = value;
        this.weight = weight;
    }
}

export class Feat implements IFeat {
    readonly name: string;
    readonly description: string;
    readonly link: string;

    readonly equippable: boolean;
    readonly equipped: boolean;

    constructor(name: string, description: string, link: string, equippable: boolean, equipped?: boolean) {
        this.name = name;
        this.description = description;
        this.link = link;
        this.equippable = equippable;
        this.equipped = equipped ? equipped || false : true;
    }
}

export class Stats {
    readonly str: ComboValue
    readonly dex: ComboValue
    readonly con: ComboValue
    readonly int: ComboValue
    readonly wis: ComboValue
    readonly cha: ComboValue

    constructor() {
        this.str = new ComboValue();
        this.dex = new ComboValue();
        this.con = new ComboValue();
        this.int = new ComboValue();
        this.wis = new ComboValue();
        this.cha = new ComboValue();
    }
}
