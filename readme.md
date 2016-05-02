[![Build Status](https://travis-ci.org/danielearwicker/doop.svg?branch=master)](https://travis-ci.org/danielearwicker/doop)

## doop

... is a way of writing immutable classes in TypeScript, with a fairly minimal syntax for declaring properties (you only have to state the property name and type once), and convenient/fast clone-with-update, all with static type checking and support for inheritance.

I'm going to pretend the name stands for:

     Declarative Object-Oriented Persistence

* *Persistence* in the sense of immutable data structures, nothing to do with
I/O serialization.

* *Declarative* in that decorators are used to drive metaprogramming that takes
care of all the behind-the-scenes implementation stuff for you.

But really it's a [Futurama reference](http://futurama.wikia.com/wiki/Democratic_Order_of_Planets).

## Installation

    npm install doop

The package includes TypeScript declarations so you don't need to install them separately.

How to declare a class with three properties:

```typescript
import { doop } from "../doop";

@doop
class Animal {

    @doop
    get hasTail() { return doop<boolean, this>() }

    @doop
    get legs() { return doop<number, this>(); }

    @doop
    get food() { return doop<string, this>(); }

    constructor() {
        this.hasTail(true).legs(2);
    }

    describe() {
        const tail = this.hasTail() ? "a" : "no";
        return `Has ${this.legs()} legs, ${tail} tail and likes to eat ${this.food()}.`;
    }
}
```

And here's how you'd use it:

```typescript
const a = new Animal();
expect(a.legs()).toEqual(2); // jasmine spec-style assertion

// create a modified clone
const b = a.legs(4);
expect(b.legs()).toEqual(4);

// original object is unaffected
expect(a.legs()).toEqual(2);
```

That is, you call the property with no arguments to get the value, and you call it with one argument to create a new, separate instance of the class with that property's value modified but all other `doop` properties having the same value as the original instance. Cloning is super-fast.

(Avoid defining any ordinary instance properties on the same class; they will not be copied and will have the value `undefined` on a new cloned instance.)

## More details

See the [background info](http://danielearwicker.github.io/Introducing_doop.html).


