/** Storage implementation is very simple: uses an array indexed
    by order of declaration. Cloning an array is very fast, see:
    https://github.com/facebook/immutable-js/issues/286
*/
function makeDoopDescriptor(index: number, target: any, key: string) {

    const original = target[key];

    let defaultValue: any;

    // This implements the getter/setter for each Doop property
    function Doop(val: any) {

        if (arguments.length == 0) {
            // Get: this is easy, just fetch from our secret array
            const val = this.$__Doop__$ && this.$__Doop__$[index];
            return (val === undefined) ? defaultValue : val;
        }

        // Set: first make sure our secret array exists
        if (!this.$__Doop__$) {
            this.$__Doop__$ = [];
        }

        // While running inside constructor, just mutate the value
        if (this.$__Doop__$Constructing) {
            this.$__Doop__$[index] = val;

            // And return the same (albeit mutated) instance
            return this;
        }

        // Make a new instance based on prototype
        const revision = Object.create(target);

        // Copy the secret array from the original object
        const copy = revision.$__Doop__$ = this.$__Doop__$.slice(0);

        // Mutate the new secret array
        copy[index] = val;

        // Return the mutated clone
        return revision;
    }

    const mapper: Mapper<any, any, any> = original && original.$__Doop__$Mapper;
    const isField: Mapper<any, any, any> = original && original.$__Doop__$Field;
    let reducers: any;

    if (mapper || isField) {
        reducers = target.$__Doop__$Reducers;

        if (isField) {
            defaultValue = original.$__Doop__$Init;
            (Doop as any).$__Doop__$Field = true;
            (Doop as any).$__Doop__$Init = original.$__Doop__$Init;
        }

        (Doop as any).self = (container: Cursor<any>): Cursor<any> => {
            return cursor(
                container()[key](),
                (action: Action<any, any>) => container({
                    type: key + ".self",
                    payload: action,
                    $: undefined
                }));
        }

        reducers[key + ".self"] = (container: any, childAction: any) => {
            const child = container[key]();
            const reduce = child.$__Doop__$Reduce;
            if (reduce) {
                const newChild = reduce(child, childAction);
                return container[key](newChild);
            }
            return container;
        }
    }

    if (mapper) {
        defaultValue = mapper.empty;
        (Doop as any).$__Doop__$Mapper = mapper;

        const defaultItem = (Doop as any).$__Doop__$DefaultItem = original.$__Doop__$DefaultItem;

        (Doop as any).item = (container: Cursor<any>, address: any): Cursor<any> => {
            const val = mapper.get(container()[key](), address);

            return cursor(val === undefined ? defaultItem : val,
                (itemAction: Action<any, any>) => {
                    container({
                        type: key + ".item",
                        payload: { address, itemAction },
                        $: undefined
                    });
                }
            );
        };

        (Doop as any).remove = (address: any): Action<any, any> => {
            return {
                type: key + ".item",
                payload: { address, undefined },
                $: undefined
            };
        };

        reducers[key + ".item"] = (container: any, { address, itemAction }: any) => {
            const collection = container[key]();
            const item = mapper.get(collection, address);
            const defaulted = item === undefined ? defaultItem : item;
            const reduce = defaulted.$__Doop__$Reduce;
            if (reduce) {
                const newItem = itemAction === undefined ? undefined : reduce(defaulted, itemAction);
                const newCollection = mapper.set(collection, address, newItem);
                return container[key](newCollection);
            }
            return container;
        }
    }

    return {
        writable: true,
        enumerable: true,
        configurable: true,
        value: Doop
    };
}

function clone(obj: any) {
    return obj && JSON.parse(JSON.stringify(obj));
}

function assign<Target, Source>(target: Target, source: Source): Target & Source {
    Object.keys(source).forEach(key => {
        (target as any)[key] = (source as any)[key];
    });
    return target as Target & Source;
}

/** This overload is used in property declarations. Maybe prefer 'field 'as it
    supports supplying an initial value.
*/
export function doop<V, O>(): Doop<V, O>;

/** This overload acts as a decorator on a class, indicating that it is
    immutable.
*/
export function doop(target: any): any;

/** This overload acts as a decorator on a property getter, and converts it into
    an ordinary function which (this is the beautiful hack) is syntactically
    compatible with a getter that returns the Doop interface.
*/
export function doop(
    target: any,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>): TypedPropertyDescriptor<any> | void;

export function doop(
        target?: any,
        propertyKey?: string | symbol,
        descriptor?: TypedPropertyDescriptor<any>): TypedPropertyDescriptor<any> | void {

    if (!target) {
        // We're being used to declare the property
        return undefined;
    }

    if (!propertyKey) {
        const wrapper = function(...args: any[]) {
            // During construction, set the flag so Doop setters can mutate
            this.$__Doop__$Constructing = (this.$__Doop__$Constructing || 0) + 1;
            try {
                target.apply(this, args);
            } finally {
                this.$__Doop__$Constructing--;
            }
            return this;
        }

        const prototype = wrapper.prototype = /*Object.create(*/target.prototype/*)*/;
        prototype.$__Doop__$Reducers = {};

        Object.keys(target).forEach(key => {
            let staticField = target[key];
            if (staticField && staticField.$__Doop__$ActionName) {

                staticField = staticField.$__Doop__$ActionName(key);

                if (staticField.$__Doop__$Reducer) {
                    prototype.$__Doop__$Reducers[key] = staticField.$__Doop__$Reducer;
                }
            }
            (wrapper as any)[key] = staticField;
        });

        const indices = prototype.$__Doop__$Indices = clone(prototype.$__Doop__$Indices);

        if (indices) {
            /** Redefine inherited Doop properties. Why? See makeDoopDescriptor.
                when the user sets a property we clone the object, which starts
                with giving the prototype to Object.create. This better not be
                the base class's prototype, or we'll get an instance of the base
                class. So we just create new definitions at every level of
                inheritance.
            */
            for (const key of Object.keys(indices)) {
                Object.defineProperty(prototype, key, makeDoopDescriptor(indices[key], prototype, key));
            }
        }

        prototype.$__Doop__$Reduce = (state: any, action: any) => {
            const reduce = prototype.$__Doop__$Reducers[action.type];
            return reduce ? reduce(state, action.payload) : state;
        };

        prototype.toJSON = function() {
            const obj: any = {};
            for (const key of Object.keys(indices)) {
                obj[key] = this[key]();
            }
            return obj;
        }

        return wrapper;
    }

    // Allocate an index on this type
    const index = target.$__Doop__$Count || 0;
    target.$__Doop__$Count = index + 1;

    // Create the indices map so we can redefine properties in inheriting classes
    const indices = target.$__Doop__$Indices || (target.$__Doop__$Indices = {});
    indices[propertyKey] = index;
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

/**
 * An action that can be sent to a cursor (or Redux store)
 */
export interface Action<Target, Payload> {
    type: string;
    payload: Payload;
    $: Target;
}

function makeAction<State, Payload>(name: string, reduce: (state: State, payload: Payload) => State) {

    const func = (payload: Payload) => {
        return { type: name, payload: payload, $: undefined as any };
    }

    let merged: {
        (payload: Payload): Action<State, Payload>;
        $__Doop__$ActionName(newName: string): typeof merged;
        $__Doop__$Reducer: typeof reduce;
    };

    merged = assign(func, {
        $__Doop__$ActionName(newName: string) {
            return newName === name ? merged : makeAction<State, Payload>(newName, reduce);
        },
        $__Doop__$Reducer: reduce
    });

    return merged;
}

export function action<Payload, State>(reduce: (state: State, payload: Payload) => State)
    : (payload: Payload) => Action<State, Payload>;

export function action<State>(reduce: (state: State) => State): () => Action<State, void>;

export function action<State, Payload>(reduce: (state: State, payload: Payload) => State)
    : (payload: Payload) => Action<State, Payload> {

    return makeAction<State, Payload>("(noname)", reduce);
}

export interface Cursor<State> {
    (): State;
    (action: Action<State, any>): void;
}

function cursor<State>(
    snapshot: State,
    dispatch: (action: Action<State, any>) => void
): Cursor<State> {

    return (action?: Action<State, any>) => {
        if (action) {
            dispatch(action);
        }
        return snapshot;
    };
}

export interface Mapper<Item, Collection, Address> {
    readonly empty: Collection;
    get(container: Collection, address: Address): Item;
    set(container: Collection, address: Address, value: Item): Collection;
}

export function arraySet<T>(array: T[], index: number, value: T) {
    const clone = array.slice(0);
    clone[index] = value;
    return clone;
}

export const arrayMapper: Mapper<any, any[], number> = {
    empty: [],
    get(array, index) { return array[index]; },
    set: arraySet
};

export function merge<Target, Source>(first: Target, second: Source): Target & Source {
    return assign(assign({}, first), second);
}

const objectMapper: Mapper<any, any, any> = {
    empty: {},
    get(obj, key) { return obj[key]; },
    set(obj, key, value) {
        if (value === undefined) {
            var clone = assign({}, obj);
            delete clone[key];
            return clone;
        }
        return merge(obj, { [key]: value });
    }
};

export const objectMapperString: Mapper<any, { [name: string]: any }, string> = objectMapper;
export const objectMapperNumber: Mapper<any, { [name: number]: any }, number> = objectMapper;

export interface Field<Type, Container> extends Doop<Type, Container> {
    self(container: Cursor<Container>): Cursor<Type>;
}

export function field<Type, Container>(init?: Type) {
    // posts actions using field name
    return { $__Doop__$Field: true, $__Doop__$Init: init  } as any as Field<Type, Container>;
}

export interface CollectionField<Item, Collection, Address, Container> extends Field<Collection, Container> {
    item(container: Cursor<Container>, address: Address): Cursor<Item>;
    remove(address: Address): Action<Container, Address>;
}

export function collection<Item, Collection, Address, Container>(
    mapper: Mapper<Item, Collection, Address>,
    defaultItem?: Item
) {
    // posts actions that include the address in the payload
    return {
        $__Doop__$Mapper: mapper,
        $__Doop__$DefaultItem: defaultItem
    } as any as CollectionField<Item, Collection, Address, Container>;
}

export function createReducer<State>(init: State) {
    return (state: State, action: Action<State, any>) => {
        if (!state) {
            return init;
        }
        const reducer = (state as any).$__Doop__$Reduce;
        if (reducer) {
            return reducer(state, action) as State;
        }
        return state;
    };
}

export interface CommonStore<State> {
    subscribe(handler: () => void): { () : void; };
}

export interface SimpleStore<State> extends CommonStore<State> {
    cursor(): Cursor<State>;
}

export function createStore<State>(init: State): SimpleStore<State> {

    const reducer = createReducer(init);
    const subscribers: (() => void)[] = [];
    let state = reducer(undefined as any, { type: "$__Doop__$initAction" } as Action<State, any>);;

    function dispatch(action: Action<State, any>) {
        const newState = reducer(state, action);
        if (newState !== state) {
            state = newState;
            subscribers.forEach(s => s());
        }
    }

    return {
        cursor() {
            return cursor(state, dispatch);
        },
        subscribe(handler: () => void) {
            subscribers.push(handler);
            return () => {
                const index = subscribers.indexOf(handler);
                if (index !== -1) {
                    subscribers.splice(index);
                }
            }
        }
    };
}

// Redux integration
export interface ReduxStore<State> extends CommonStore<State> {
    getState(): State;
    dispatch(action: Action<State, any>): void;
}

export function cursorFromStore<State>(store: ReduxStore<State>) {
    return cursor(store.getState(), store.dispatch);
}
