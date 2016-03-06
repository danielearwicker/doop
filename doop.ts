/*  Storage implementation is very simple: uses an array indexed
    by order of declaration. Cloning an array is very fast, see:
    https://github.com/facebook/immutable-js/issues/286
*/

function makeDoopDescriptor(index: number, target: any) {

    // This implements the getter/setter for each Doop property
    function Doop(val: any) {

        if (arguments.length == 0) {
            // Get: this is easy, just fetch from our secret array
            return this.$__Doops__$ && this.$__Doops__$[index];
        }

        // Set: first make sure our secret array exists
        if (!this.$__Doops__$) {
            this.$__Doops__$ = [];
        }

        // While running inside constructor, just mutate the value
        if (this.$__Doops__$Constructing) {
            this.$__Doops__$[index] = val;

            // And return the same (albeit mutated) instance
            return this;
        }

        // Make a new instance based on prototype
        const revision = Object.create(target);

        // Copy the secret array from the original object
        const Doops = revision.$__Doops__$ = this.$__Doops__$.slice(0);

        // Mutate the new secret array
        Doops[index] = val;

        // Return the mutated clone
        return revision;
    }

    return {
        writable: true,
        enumerable: true,
        configurable: true,
        value: Doop
    };
}

/** This overload is used in property declarations. It always returns null; its
    only job is to provide a brief way to state the type of the property getter.
*/
export function Doop<V, O>(): Doop<V, O>;

/** This overload acts as a decorator on a class, indicating that it is
    immutable.
*/
export function Doop(target: any): any;

/** This overload acts as a decorator on a property getter, and converts it into
    an ordinary function which (this is the beautiful hack) is syntactically
    compatible with a getter that returns the Doop interface.
*/
export function Doop(
    target: any,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>): TypedPropertyDescriptor<any> | void;

export function Doop(
        target?: any,
        propertyKey?: string | symbol,
        descriptor?: TypedPropertyDescriptor<any>): TypedPropertyDescriptor<any> | void {

    if (!target) {
        // We're being used to declare the property
        return null;
    }

    if (!propertyKey) {
        function wrapper(...args: any[]) {
            // During construction, set the flag so Doop setters can mutate
            this.$__Doops__$Constructing = (this.$__Doops__$Constructing || 0) + 1;
            target.apply(this, args);
            this.$__Doops__$Constructing--;
            return this;
        }

        const prototype = wrapper.prototype = target.prototype;

        const indices = prototype.$__Doops__$Indices;

        if (indices) {
            // Redefine inherited Doop properties
            for (const key of Object.keys(indices)) {
                Object.defineProperty(prototype, key, makeDoopDescriptor(indices[key], prototype));
            }
        }

        return wrapper;
    }

    // Allocate an index on this type
    const index = target.$__Doops__$Count || 0;
    target.$__Doops__$Count = index + 1;

    // Create the indices map so we can redefine properties in inheriting classes
    const indices = target.$__Doops__$Indices || (target.$__Doops__$Indices = {});
    indices[propertyKey] = index;

    return makeDoopDescriptor(index, target);
}

/** As far as TypeScript is concerned, a Doop property is a getter that returns
    an instance of some object that supports this interface.

    But at runtime we reconfigure it to be an ordinary function that implements
    this interface directly, so that `this` refers to the owner object.
*/
export interface Doop<V, O> {
    (): V;
    (newValue: V): O;
}
