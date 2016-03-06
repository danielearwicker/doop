import { Doop } from "./doop";

@Doop
class Animal {

    @Doop
    get hasFur() { return Doop<boolean, this>() }

    @Doop
    get hasTail() { return Doop<boolean, this>() }

    @Doop
    get legs() { return Doop<number, this>(); }

    @Doop
    get food() { return Doop<string, this>(); }

    constructor() {
        this.hasTail(true).legs(2);
    }

    describe() {
        const tail = this.hasTail() ? "a" : "no";
        return `Has ${this.legs()} legs, ${tail} tail and likes to eat ${this.food()}.`;
    }
}

console.log(new Animal().hasTail(false).legs(2).food("honey").describe());

@Doop
class Bear extends Animal {

    @Doop
    get ofLittleBrain() { return Doop<boolean, this>() }

    saddleBags = 42;

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

let b = new Bear(true).legs(55);

console.log(b.describe());

const c = b.ofLittleBrain(false);

console.log(b.describe());
console.log(c.describe());

const d = c.food("Haycorns");

console.log(b.describe());
console.log(c.describe());
console.log(d.describe());

console.log(b.food());
console.log(c.food());
console.log(d.food());

console.log(d.food);
