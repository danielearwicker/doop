import { doop } from "../doop";
import * as Doop from "../doop";

@doop
class Publisher {

    @doop
    get name() { return Doop.field<string, this>() }

    @doop
    get reputation() { return Doop.field<number, this>(3) }

    static /*readonly*/ upvote = Doop.action<Publisher>(
        pub => pub.reputation(Math.min(5, pub.reputation() + 1)));

    static /*readonly*/ downvote = Doop.action<Publisher>(
        pub => pub.reputation(Math.max(1, pub.reputation() - 1)));
}

@doop
class ForeignPublisher extends Publisher {

    static /*readonly*/ upvote = Publisher.downvote;

    static /*readonly*/ downvote = Publisher.upvote;
}

@doop
class Book {
    
    @doop
    get title() { return Doop.field<string, this>() }

    @doop
    get price() { return Doop.field<number, this>() }

    @doop
    get publisher() { return Doop.field<Publisher, this>(new Publisher()) }

    static /*readonly*/ setTitleAndPrice = 
        Doop.action<{title: string, price: number}, Book>(
            (book, {title, price}) => book.title(title).price(price));

    static /*readonly*/ publish = Doop.action<string, Book>(
        (book, name) => book.publisher(new Publisher().name(name)));

    static /*readonly*/ publishOverseas = Doop.action<string, Book>(
        (book, name) => book.publisher(new ForeignPublisher().name(name)));
}

@doop
class Shelf {

    @doop
    get books() { return Doop.collection<Book, 
                            { [id: number]: Book }, 
                            number, 
                            this>(Doop.objectMapperNumber) }
    constructor() {
        // NB. don't need to initialise collections
    }

    static /*readonly*/ addBook = Doop.action<number, Shelf>(
        (shelf, id) => shelf.books(Doop.merge(shelf.books(), { [id]: new Book() })));
}

const enableLogging = true;

function log(message: string, data: any) {
    if (!enableLogging) {
        return;
    }
    console.log(`--------------- ${message} ---------------`);
    console.log(JSON.stringify(data, null, 4));
}

function createTestStore<State>(init: State) {
    const store = Doop.createStore(init);

    store.subscribe(() => {
        log("changed", store.cursor()());
    });

    return store;
}

describe("doop", () => {

    it("supports a basic test of setup", () => {
        
        const root = createTestStore(new Shelf());

        root.cursor()(Shelf.addBook(8001));

        const firstBook = root.cursor()().books.item(root.cursor(), 8001);

        firstBook(Book.setTitleAndPrice({ title: "1985", price: 2.99 }));
        firstBook(Book.publish("Penguin"));

        const firstBookPublisher = firstBook().publisher.self(firstBook); 
        expect(firstBookPublisher().reputation()).toEqual(3);

        firstBookPublisher(Publisher.upvote());

        const rc1 = root.cursor();
        expect(rc1().books()[8001].price()).toEqual(2.99);
        expect(rc1().books()[8001].publisher().name()).toEqual("Penguin");
        expect(rc1().books()[8001].publisher().reputation()).toEqual(4);

        // Sets new ForeignPublisher, reputation back to 3
        firstBook(Book.publishOverseas("Der Schtumphenpressen"));

        // Upvote is now downward!
        firstBookPublisher(Publisher.upvote());

        const rc2 = root.cursor();
        expect(rc2().books()[8001].publisher().name()).toEqual("Der Schtumphenpressen");
        expect(rc2().books()[8001].publisher().reputation()).toEqual(2);
    });
});
