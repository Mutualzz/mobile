import { makeAutoObservable } from "mobx";

type Node<T> = { v: T; prev: Node<T> | null; next: Node<T> | null };

export class ObservableOrderedSet<T> {
    head: Node<T> | null = null; // non-observable (fast mutations)
    tail: Node<T> | null = null; // non-observable
    index = new Map<T, Node<T>>(); // non-observable
    _version = 0; // observable bump for reactions

    constructor(initial?: Iterable<T>) {
        makeAutoObservable(this, {
            head: false,
            tail: false,
            index: false,
            _version: true, // observable
        });

        if (initial) for (const v of initial) this.addLast(v);
    }

    get size() {
        return this.index.size;
    }

    has(v: T) {
        return this.index.has(v);
    }

    addFirst(v: T) {
        if (this.index.has(v)) return;
        const node: Node<T> = { v, prev: null, next: this.head };
        if (this.head) this.head.prev = node;
        else this.tail = node;
        this.head = node;
        this.index.set(v, node);
        this.bump();
    }

    addLast(v: T) {
        if (this.index.has(v)) return;
        const node: Node<T> = { v, prev: this.tail, next: null };
        if (this.tail) this.tail.next = node;
        else this.head = node;
        this.tail = node;
        this.index.set(v, node);
        this.bump();
    }

    delete(v: T) {
        const node = this.index.get(v);
        if (!node) return false;
        if (node.prev) node.prev.next = node.next;
        else this.head = node.next;
        if (node.next) node.next.prev = node.prev;
        else this.tail = node.prev;
        this.index.delete(v);
        this.bump();
        return true;
    }

    moveToFront(v: T) {
        const node = this.index.get(v);
        if (!node || node === this.head) return;

        // detach
        if (node.prev) node.prev.next = node.next;
        if (node.next) node.next.prev = node.prev;
        else this.tail = node.prev;

        // attach to front
        node.prev = null;
        node.next = this.head;
        if (this.head) this.head.prev = node;
        this.head = node;

        this.bump();
    }

    moveAfter(a: T | null, b: T) {
        // place b after a (or to front if a === null)
        const nb = this.index.get(b);
        if (!nb) return;
        if (a === null) {
            this.moveToFront(b);
            return;
        }

        const na = this.index.get(a);
        if (!na || na === nb || na.next === nb) return;

        // detach nb
        if (nb.prev) nb.prev.next = nb.next;
        else this.head = nb.next;
        if (nb.next) nb.next.prev = nb.prev;
        else this.tail = nb.prev;

        // insert after na
        nb.prev = na;
        nb.next = na.next;
        if (na.next) na.next.prev = nb;
        else this.tail = nb;
        na.next = nb;

        this.bump();
    }

    replace(items: Iterable<T>) {
        this.clear();
        for (const v of items) this.addLast(v);
    }

    clear() {
        this.head = this.tail = null;
        this.index.clear();
        this.bump();
    }

    toArray(): T[] {
        // depend on version so observers update
        void this._version;
        const out: T[] = [];
        for (let n = this.head; n; n = n.next) out.push(n.v);
        return out;
    }

    private bump() {
        this._version++;
    }
}
