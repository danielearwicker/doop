import { doop } from "../doop";

@doop
class Animal {

    @doop
    get hasFur() { return doop<boolean, this>() }

    @doop
    get hasTail() { return doop<boolean, this>() }

    @doop
    get legs() { return doop<number, this>() }

    @doop
    get food() { return doop<string, this>() }

    constructor() {
        this.hasTail(true).legs(2);
    }

    describe() {
        const tail = this.hasTail() ? "a" : "no";
        return `Has ${this.legs()} legs, ${tail} tail and likes to eat ${this.food()}.`;
    }
}

@doop
class Farm {

    @doop
    get owner() { return doop<Animal, this>() }

    @doop
    get bestPig() { return doop<Animal, this>() }
}

@doop
class Piglet extends Animal {

    @doop
    get haycorns() { return doop<number, this>() }

    @doop
    get ofLittleBrain() { return doop<boolean, this>() }

    constructor() {
        super();
    }

    describe() {
        return super.describe() + " And is nervous.";
    }
}

@doop
class Bear extends Animal {

    @doop
    get ofLittleBrain() { return doop<boolean, this>() }

    constructor(ofLittleBrain: boolean) {
        super();
        this.hasTail(false)
    }

    describe() {
        return super.describe() + (
            this.ofLittleBrain()
                ? " And is of very little brain."
                : " And is quite smart.");
    }
}

@doop
class Pooh extends Bear {

    @doop
    get isHumming() { return doop<boolean, this>() }

    constructor() {
        super(true);
    }
}

@doop
class SuperPiglet extends Piglet {

    @doop
    get flying() { return doop<boolean, this>() }
}

@doop
class Empty { }

@doop
class NoConstructor {

    @doop
    get message() { return doop<string, this>() }
}

@doop
class Mixed {

    @doop
    get x() { return doop<number, this>() }

    y = 25;
}

describe("doop", () => {

    it("allows mutation inside constructor", () => {
        const a = new Animal();
        expect(a.hasFur()).toEqual(undefined);
        expect(a.food()).toEqual(undefined);
        expect(a.hasTail()).toEqual(true);
        expect(a.legs()).toEqual(2);
    });

    it("supports inheritance", () => {
        const b = new Bear(false);
        expect(b.hasFur()).toEqual(undefined);
        expect(b.food()).toEqual(undefined);
        expect(b.hasTail()).toEqual(false);
        expect(b.legs()).toEqual(2);
    });

    it("supports multiple levels of inheritance", () => {
        const b = new Pooh();
        expect(b.hasFur()).toEqual(undefined);
        expect(b.food()).toEqual(undefined);
        expect(b.hasTail()).toEqual(false);
        expect(b.legs()).toEqual(2);
        expect(b.isHumming()).toEqual(undefined);

        expect(b.describe()).toEqual("Has 2 legs, no tail and likes to eat undefined. And is quite smart.");
    });

    it("ignores mutation attempt outside constructor", () => {
        const a = new Animal();
        expect(a.legs()).toEqual(2);
        a.legs(4);
        expect(a.legs()).toEqual(2);

        expect(a.describe()).toEqual("Has 2 legs, a tail and likes to eat undefined.");
    });

    it("returns new revisions on set of property", () => {
        const a = new Animal();
        expect(a.legs()).toEqual(2);
        const b = a.legs(4);
        expect(a.legs()).toEqual(2);
        expect(b.legs()).toEqual(4);

        expect(b.describe()).toEqual("Has 4 legs, a tail and likes to eat undefined.");
    });

    it("doesn't muddle up values between properties", () => {
        const p = new Piglet();
        expect(p.hasFur()).toEqual(undefined);
        expect(p.food()).toEqual(undefined);
        expect(p.hasTail()).toEqual(true);
        expect(p.legs()).toEqual(2);

        const p2 = p.hasFur(true).food("Haycorns").hasTail(false).legs(15);
        expect(p.hasFur()).toEqual(undefined);
        expect(p.food()).toEqual(undefined);
        expect(p.hasTail()).toEqual(true);
        expect(p.legs()).toEqual(2);
        expect(p2.hasFur()).toEqual(true);
        expect(p2.food()).toEqual("Haycorns");
        expect(p2.hasTail()).toEqual(false);
        expect(p2.legs()).toEqual(15);

        const p3 = p2.food("Mash").hasTail(true).legs(800);
        expect(p.hasFur()).toEqual(undefined);
        expect(p.food()).toEqual(undefined);
        expect(p.hasTail()).toEqual(true);
        expect(p.legs()).toEqual(2);
        expect(p2.hasFur()).toEqual(true);
        expect(p2.food()).toEqual("Haycorns");
        expect(p2.hasTail()).toEqual(false);
        expect(p2.legs()).toEqual(15);
        expect(p3.hasFur()).toEqual(true);
        expect(p3.food()).toEqual("Mash");
        expect(p3.hasTail()).toEqual(true);
        expect(p3.legs()).toEqual(800);

        expect(p.describe()).toEqual("Has 2 legs, a tail and likes to eat undefined. And is nervous.");
        expect(p2.describe()).toEqual("Has 15 legs, no tail and likes to eat Haycorns. And is nervous.");
        expect(p3.describe()).toEqual("Has 800 legs, a tail and likes to eat Mash. And is nervous.");
    });

    it("tolerates an empty class", () => new Empty());

    it("tolerates a constructorless class", () => {
        const o = new NoConstructor().message("hi");
        expect(o.message()).toEqual("hi");
    });

    it("doesn't clone any plain instance properties", () => {
        const m = new Mixed();
        expect(m.x()).toEqual(undefined);
        expect(m.y).toEqual(25);

        const m2 = m.x(42);
        expect(m2.x()).toEqual(42);
        expect(m2.y).toEqual(undefined); // instance fields go to undefined

        // original unaffected
        expect(m.x()).toEqual(undefined);
        expect(m.y).toEqual(25);
    });

    it("doesn't confuse properties in same position in peer classes", () => {
        const p = new SuperPiglet().haycorns(32);
        expect(p.haycorns()).toEqual(32);

        const p2 = p.ofLittleBrain(false);
        expect(p2.ofLittleBrain()).toEqual(false);
        expect(p2.haycorns()).toEqual(32);
    });
});
