/*
 * test.js
 *
 * Copyright (c) 2026 Xiongfei Shi
 *
 * Author: Xiongfei Shi <xiongfei.shi(a)icloud.com>
 * License: Apache-2.0
 *
 * https://github.com/shixiongfei/eventlite.js
 */

import assert from "node:assert";
import { describe, test } from "node:test";
import EventEmitter from "node:events";
import EventLite, { eventlite } from "./eventlite.js";

/**
 * @param {(...args: any[]) => any} callback
 * @param {number} [timeout = 0]
 * @param {any[]} args
 * @returns {Promise<any>}
 */
const delay = (callback, timeout = 0, ...args) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(callback(...args));
      } catch (error) {
        reject(error);
      }
    }, timeout);
  });

/**
 * @param {number} start
 * @param {number} stop
 * @param {number} step
 * @returns {number[]}
 */
const range = (start, stop, step = 1) =>
  Array.from(
    { length: (stop - start) / step + 1 },
    (_, index) => start + index * step,
  );

describe("EventLite Unit Test", () => {
  test("no duplicate listeners", () => {
    /** @type {string[]} */
    const output = [];

    /** @type {EventLite<{foo: (text: string) => void}>} */
    const el = eventlite();

    /** @param {string} text */
    const emitted = (text) => {
      output.push(text);
    };

    el.addListener("foo", emitted);
    el.addListener("foo", emitted);
    el.addListener("foo", emitted, undefined, true);
    el.emit("foo", "bar");

    assert.strictEqual(el.listeners("foo").length, 1);
    assert.strictEqual(el.listenerCount("foo"), 1);
    assert.strictEqual(el.listenerCount("foo", emitted), 1);
    assert.deepStrictEqual(output, ["bar"]);
  });

  test("duplicate listeners", () => {
    /** @type {string[]} */
    const output = [];

    /** @type {EventLite<{foo: [string]}>} */
    const el = eventlite({ allowDuplicate: true });

    /** @param {string} text */
    const emitted = (text) => {
      output.push(text);
    };

    el.addListener("foo", emitted);
    el.addListener("foo", emitted);
    el.addListener("foo", emitted, undefined, true);

    el.emit("foo", "bar");
    el.emit("foo", "baz");

    assert.strictEqual(el.listeners("foo").length, 2);
    assert.strictEqual(el.listenerCount("foo"), 2);
    assert.strictEqual(el.listenerCount("foo", emitted), 2);
    assert.deepStrictEqual(output, ["bar", "bar", "bar", "baz", "baz"]);
  });

  test("add and remove", () => {
    /** @type {EventLite<{foo: [], bar: []}>} */
    const el = eventlite();

    const emitted = () => {};

    el.addListener("foo", () => {});
    assert.strictEqual(el.listeners("foo").length, 1);
    assert.strictEqual(el.listenerCount("foo"), 1);

    el.addListener("foo", emitted);
    assert.strictEqual(el.listeners("foo").length, 2);
    assert.strictEqual(el.listenerCount("foo"), 2);

    el.addListener("foo", () => {});
    assert.strictEqual(el.listeners("foo").length, 3);
    assert.strictEqual(el.listenerCount("foo"), 3);

    el.removeListener("foo", emitted);
    assert.strictEqual(el.listeners("foo").length, 2);
    assert.strictEqual(el.listenerCount("foo"), 2);

    el.removeAllListeners("foo");
    assert.strictEqual(el.listeners("foo").length, 0);
    assert.strictEqual(el.listenerCount("foo"), 0);

    el.addListener("foo", emitted);
    assert.strictEqual(el.listeners("foo").length, 1);
    assert.strictEqual(el.listenerCount("foo"), 1);

    el.removeListener("foo", emitted);
    assert.strictEqual(el.listeners("foo").length, 0);
    assert.strictEqual(el.listenerCount("foo"), 0);

    el.addListener("bar", () => {});
    assert.strictEqual(el.listeners("bar").length, 1);
    assert.strictEqual(el.listenerCount("bar"), 1);

    el.addListener("bar", emitted);
    assert.strictEqual(el.listeners("bar").length, 2);
    assert.strictEqual(el.listenerCount("bar"), 2);

    el.removeAllListeners();
    assert.strictEqual(el.listeners("bar").length, 0);
    assert.strictEqual(el.listenerCount("bar"), 0);

    assert.deepStrictEqual(el.eventNames(), []);
  });

  test("duplicate add and remove", () => {
    /** @type {string[]} */
    const ee_output = [];

    /** @type {string[]} */
    const el_output = [];

    /** @type {EventEmitter<{foo: [string], event: []}>} */
    const ee = new EventEmitter();

    /** @type {EventLite<{foo: [string], event: []}>} */
    const el = eventlite({ allowDuplicate: true });

    /** @param {string} text */
    const ee_emitted = (text) => {
      ee_output.push(text);
    };

    /** @param {string} text */
    const el_emitted = (text) => {
      el_output.push(text);
    };

    ee.once("foo", ee_emitted);
    ee.on("foo", ee_emitted);

    el.once("foo", el_emitted);
    el.on("foo", el_emitted);

    assert.deepStrictEqual(ee.listeners("foo"), [ee_emitted, ee_emitted]);
    assert.strictEqual(ee.listenerCount("foo"), 2);
    assert.strictEqual(ee.listenerCount("foo", ee_emitted), 2);
    assert.deepStrictEqual(el.listeners("foo"), [el_emitted, el_emitted]);
    assert.strictEqual(el.listenerCount("foo"), 2);
    assert.strictEqual(el.listenerCount("foo", el_emitted), 2);

    ee.removeListener("foo", ee_emitted);
    el.removeListener("foo", el_emitted);

    ee.emit("foo", "bar");
    ee.emit("foo", "bar");

    el.emit("foo", "bar");
    el.emit("foo", "bar");

    assert.deepStrictEqual(ee_output, ["bar"]);
    assert.deepStrictEqual(el_output, ["bar"]);

    ee_output.splice(0, ee_output.length);
    el_output.splice(0, el_output.length);

    const ee_cb1 = () => {
      ee_output.push("A");
      ee.off("event", ee_cb2);
    };

    const ee_cb2 = () => {
      ee_output.push("B");
    };

    ee.on("event", ee_cb1);
    ee.on("event", ee_cb2);

    ee.emit("event");
    ee.emit("event");

    assert.deepStrictEqual(ee_output, ["A", "B", "A"]);

    const el_cb1 = () => {
      el_output.push("A");
      el.off("event", el_cb2);
    };

    const el_cb2 = () => {
      el_output.push("B");
    };

    el.on("event", el_cb1);
    el.on("event", el_cb2);

    el.emit("event");
    el.emit("event");

    assert.deepStrictEqual(el_output, ["A", "B", "A"]);
  });

  test("stable iteration 1", () => {
    /** @type {string[]} */
    const output = [];
    const el = eventlite();

    /** @param {string} text */
    const emitted1 = (text) => {
      output.push(text);
    };

    /** @param {string} text */
    const emitted2 = (text) => {
      el.once("foo", emitted1);
      output.push(text);
    };

    el.on("foo", emitted2);

    el.emit("foo", "bar");
    assert.deepStrictEqual(el.listeners("foo"), [emitted2, emitted1]);
    assert.strictEqual(el.listenerCount("foo"), 2);
    assert.strictEqual(el.listenerCount("foo", emitted1), 1);
    assert.strictEqual(el.listenerCount("foo", emitted2), 1);

    assert.deepStrictEqual(output, ["bar"]);

    el.emit("foo", "baz");
    assert.deepStrictEqual(el.listeners("foo"), [emitted2]);
    assert.strictEqual(el.listenerCount("foo"), 1);
    assert.strictEqual(el.listenerCount("foo", emitted1), 0);
    assert.strictEqual(el.listenerCount("foo", emitted2), 1);
    assert.deepStrictEqual(output, ["bar", "baz", "baz"]);

    el.emit("foo", "foobar");
    assert.deepStrictEqual(el.listeners("foo"), [emitted2, emitted1]);
    assert.strictEqual(el.listenerCount("foo"), 2);
    assert.strictEqual(el.listenerCount("foo", emitted1), 1);
    assert.strictEqual(el.listenerCount("foo", emitted2), 1);
    assert.deepStrictEqual(output, ["bar", "baz", "baz", "foobar"]);
  });

  test("stable iteration 2", () => {
    /** @type {string[]} */
    const ee_output = [];

    /** @type {string[]} */
    const el_output = [];

    const ee = new EventEmitter();
    const el = eventlite({ allowDuplicate: true });

    /** @param {string} text */
    const ee_emitted1 = (text) => {
      ee_output.push(text);
    };

    /** @param {string} text */
    const ee_emitted2 = (text) => {
      ee.once("foo", ee_emitted1);
      ee_output.push(text);
    };

    /** @param {string} text */
    const el_emitted1 = (text) => {
      el_output.push(text);
    };

    /** @param {string} text */
    const el_emitted2 = (text) => {
      el.once("foo", el_emitted1);
      el_output.push(text);
    };

    ee.on("foo", ee_emitted2);
    el.on("foo", el_emitted2);

    ee.emit("foo", "bar");
    assert.deepStrictEqual(ee.listeners("foo"), [ee_emitted2, ee_emitted1]);
    assert.deepStrictEqual(ee_output, ["bar"]);

    el.emit("foo", "bar");
    assert.deepStrictEqual(el.listeners("foo"), [el_emitted2, el_emitted1]);
    assert.deepStrictEqual(el_output, ["bar"]);

    ee.emit("foo", "baz");
    assert.deepStrictEqual(ee.listeners("foo"), [ee_emitted2, ee_emitted1]);
    assert.deepStrictEqual(ee_output, ["bar", "baz", "baz"]);

    el.emit("foo", "baz");
    assert.deepStrictEqual(el.listeners("foo"), [el_emitted2, el_emitted1]);
    assert.deepStrictEqual(el_output, ["bar", "baz", "baz"]);

    ee.emit("foo", "zoo");
    assert.deepStrictEqual(ee.listeners("foo"), [ee_emitted2, ee_emitted1]);
    assert.deepStrictEqual(ee_output, ["bar", "baz", "baz", "zoo", "zoo"]);

    el.emit("foo", "zoo");
    assert.deepStrictEqual(el.listeners("foo"), [el_emitted2, el_emitted1]);
    assert.deepStrictEqual(el_output, ["bar", "baz", "baz", "zoo", "zoo"]);
  });

  test("stable iteration 3", () => {
    /** @type {string[]} */
    const output = [];
    const el = eventlite();

    /** @param {string} text */
    const emitted1 = (text) => {
      output.push(text);
    };

    /** @param {string} text */
    const emitted2 = (text) => {
      el.removeListener("foo", emitted1);
      output.push(text);
    };

    el.on("foo", emitted1);
    el.on("foo", emitted2);
    el.emit("foo", "bar");
    el.emit("foo", "baz");

    assert.deepStrictEqual(output, ["bar", "bar", "baz"]);

    el.off("foo", emitted2);
    assert.strictEqual(el.listeners("foo").length, 0);
    assert.strictEqual(el.listenerCount("foo"), 0);
  });

  test("remove function", () => {
    const el = eventlite();

    const removes = [
      el.on("foo", console.log),
      el.once("foo", (...args) => console.log(...args)),
      el.on("foo", (...args) => console.log(...args)),
    ];

    assert.strictEqual(el.listeners("foo").length, 3);
    assert.strictEqual(el.listenerCount("foo"), 3);

    removes.forEach((remove) => remove());

    assert.strictEqual(el.listeners("foo").length, 0);
    assert.strictEqual(el.listenerCount("foo"), 0);
  });

  test("once", () => {
    /** @type {string[]} */
    const output = [];
    const el = eventlite();

    /** @param {string} text */
    const emitted = (text) => {
      el.once("foo", emitted);
      output.push(text);
    };

    el.once("foo", emitted);

    el.emit("foo", "bar");
    el.emit("foo", "baz");
    el.emit("foo", "foobar");

    assert.deepStrictEqual(output, ["bar", "baz", "foobar"]);
  });

  test("context", () => {
    const context = { count: 0 };
    const el = eventlite();

    function add(value = 1) {
      this.count += value;
    }

    function sub(value = 1) {
      this.count -= value;
    }

    el.on("add", add, context);
    el.on("sub", sub, context);

    el.emit("add");
    el.emit("add", 10);
    el.emit("sub", 5);
    el.emit("sub");

    assert.strictEqual(context.count, 5);
    assert.strictEqual(el.listenerCount("add"), 1);
    assert.strictEqual(el.listenerCount("add", add), 0);
    assert.strictEqual(el.listenerCount("add", add, context), 1);
    assert.strictEqual(el.listenerCount("sub"), 1);
    assert.strictEqual(el.listenerCount("sub", sub), 0);
    assert.strictEqual(el.listenerCount("sub", sub, context), 1);
  });

  test("emit", () => {
    /** @type {string[][]} */
    const output = [];
    const el = eventlite();

    /** @param {string[]} args */
    const emitted = (...args) => {
      output.push(args);
    };

    el.emit("foo");
    el.emit("foo", "bar");
    el.emit("foo", "bar", "baz");
    el.emit("foo", "bar", "baz", "boom");
    el.emit("foo", "bar", "baz", "boom", "hello");
    el.emit("foo", "bar", "baz", "boom", "hello", "world");
    el.emit("foo", "bar", "baz", "boom", "hello", "world", "!!!");

    assert.deepStrictEqual(output, []);

    el.on("foo", emitted);

    el.emit("foo");
    el.emit("foo", "bar");
    el.emit("foo", "bar", "baz");
    el.emit("foo", "bar", "baz", "boom");
    el.emit("foo", "bar", "baz", "boom", "hello");
    el.emit("foo", "bar", "baz", "boom", "hello", "world");
    el.emit("foo", "bar", "baz", "boom", "hello", "world", "!!!");

    assert.deepStrictEqual(output, [
      [],
      ["bar"],
      ["bar", "baz"],
      ["bar", "baz", "boom"],
      ["bar", "baz", "boom", "hello"],
      ["bar", "baz", "boom", "hello", "world"],
      ["bar", "baz", "boom", "hello", "world", "!!!"],
    ]);

    output.splice(0, output.length);

    el.on("foo", (...args) => {
      output.push(args);
    });

    el.emit("foo");
    el.emit("foo", "bar");
    el.emit("foo", "bar", "baz");
    el.emit("foo", "bar", "baz", "boom");
    el.emit("foo", "bar", "baz", "boom", "hello");
    el.emit("foo", "bar", "baz", "boom", "hello", "world");
    el.emit("foo", "bar", "baz", "boom", "hello", "world", "!!!");

    assert.deepStrictEqual(output, [
      [],
      [],
      ["bar"],
      ["bar"],
      ["bar", "baz"],
      ["bar", "baz"],
      ["bar", "baz", "boom"],
      ["bar", "baz", "boom"],
      ["bar", "baz", "boom", "hello"],
      ["bar", "baz", "boom", "hello"],
      ["bar", "baz", "boom", "hello", "world"],
      ["bar", "baz", "boom", "hello", "world"],
      ["bar", "baz", "boom", "hello", "world", "!!!"],
      ["bar", "baz", "boom", "hello", "world", "!!!"],
    ]);
  });

  test("class", () => {
    /** @type {[number, number][]} */
    const output = [];

    class Counter extends EventLite {
      constructor() {
        super();
        this.count = 0;

        this.addListener("add", this.onAdd, this);
        this.addListener("sub", this.onSub, this);
      }

      onAdd(value = 1) {
        this.count += value;
        this.emit("changed", value, this.count);
      }

      onSub(value = 1) {
        this.count -= value;
        this.emit("changed", -value, this.count);
      }
    }

    const counter = new Counter();

    const unsubscribe = counter.on("changed", (value, count) => {
      output.push([value, count]);
    });

    counter.emit("add");
    counter.emit("add", 10);
    counter.emit("sub", 5);
    counter.emit("sub");

    unsubscribe();

    assert.deepStrictEqual(output, [
      [1, 1],
      [10, 11],
      [-5, 6],
      [-1, 5],
    ]);
    assert.strictEqual(counter.count, 5);
    assert.deepStrictEqual(counter.eventNames(), ["add", "sub"]);
  });

  test("remove by id on single listener", () => {
    const el = eventlite();

    const off = el.on("a", () => {});
    off();

    assert.strictEqual(el.listeners("a").length, 0);
    assert.strictEqual(el.listenerCount("a"), 0);
  });

  test("remove by id does not affect other duplicates", () => {
    const el = eventlite({ allowDuplicate: true });

    const fn = () => {};

    const off1 = el.on("a", fn);
    const off2 = el.on("a", fn);

    off1();

    assert.strictEqual(el.listeners("a").length, 1);
    assert.strictEqual(el.listenerCount("a"), 1);
  });

  test("array to single downgrade correctness", () => {
    const el = eventlite();

    const fn1 = () => {};
    const fn2 = () => {};

    el.on("a", fn1);
    el.on("a", fn2);

    el.off("a", fn1);

    assert.strictEqual(el.listeners("a").length, 1);
    assert.strictEqual(el.listeners("a")[0], fn2);
    assert.strictEqual(el.listenerCount("a"), 1);
  });

  test("listener order preserved on upgrade to array", () => {
    const el = eventlite();

    /** @type {string[]} */
    const calls = [];

    const a = () => calls.push("a");
    const b = () => calls.push("b");

    el.on("x", a);
    el.on("x", b);

    el.emit("x");

    assert.deepStrictEqual(calls, ["a", "b"]);
  });

  test("eventNames after partial removal", () => {
    const el = eventlite();

    el.on("a", () => {});
    el.on("b", () => {});

    assert.deepStrictEqual(el.eventNames(), ["a", "b"]);

    el.off("a");

    assert.deepStrictEqual(el.eventNames(), ["b"]);
  });

  test("once removed before emit", () => {
    const el = eventlite();

    let called = false;

    const off = el.once("a", () => {
      called = true;
    });

    off();
    el.emit("a");

    assert.strictEqual(called, false);
  });

  test("remove non-existing listener", () => {
    const el = eventlite();

    const fn = () => {};
    const fn2 = () => {};

    el.on("a", fn);
    el.off("a", fn2);

    assert.strictEqual(el.listeners("a").length, 1);
    assert.strictEqual(el.listenerCount("a"), 1);
  });

  test("remove non-existing listener in array", () => {
    const el = eventlite();

    const fn1 = () => {};
    const fn2 = () => {};
    const fn3 = () => {};

    el.on("a", fn1);
    el.on("a", fn2);

    el.off("a", fn3);

    assert.strictEqual(el.listeners("a").length, 2);
    assert.strictEqual(el.listenerCount("a"), 2);
  });

  test("same fn different context should be treated as different listener", () => {
    const el = eventlite();

    const fn = function () {};

    const ctx1 = {};
    const ctx2 = {};

    el.on("a", fn, ctx1);
    el.on("a", fn, ctx2);

    assert.strictEqual(el.listeners("a").length, 2);
    assert.strictEqual(el.listenerCount("a"), 2);
  });

  test("emit after removeAllListeners", () => {
    const el = eventlite();

    let called = false;

    el.on("a", () => (called = true));
    el.removeAllListeners();

    el.emit("a");

    assert.strictEqual(called, false);
  });

  test("remove function idempotent", () => {
    const el = eventlite();

    const off = el.on("a", () => {});

    off();
    off();

    assert.strictEqual(el.listeners("a").length, 0);
    assert.strictEqual(el.listenerCount("a"), 0);
  });

  test("once remove", () => {
    const el = eventlite({ allowDuplicate: true });

    const fn = () => {};

    el.once("foo", fn);
    el.on("foo", fn);

    el.emit("foo");
    el.emit("foo");

    assert.strictEqual(el.listeners("foo").length, 1);
    assert.strictEqual(el.listenerCount("foo"), 1);
  });

  test("symbol event", () => {
    /** @type {string[]} */
    const output = [];

    /** @type {EventLite<{[k: symbol]: [string], foo: [string]}>} */
    const el = eventlite();

    const event = Symbol("foo");

    /** @param {string} text */
    const emitted = (text) => {
      output.push(text);
    };

    el.on(event, emitted);
    el.emit(event, "bar");
    el.emit("foo", "foobar");
    el.emit(Symbol("foo"), "foobar");

    assert.deepStrictEqual(output, ["bar"]);
    assert.deepStrictEqual(el.eventNames(), [event]);
  });

  test("delay function", () => {
    /** @type {string[]} */
    const output = [];

    /** @param {string} text */
    const emitted = (text) => {
      output.push(text);
    };

    delay(emitted, 100, "100");
    delay(emitted, 50, "50");

    delay(() => {
      assert.deepStrictEqual(output, ["50", "100"]);
    }, 100);
  });

  test("async send", async () => {
    /** @type {["async" | "sync", string[]][]} */
    const output = [];

    /**
     * @type {EventLite<{
     *    foo: (...args: string[]) => void,
     *    bar: (...args: string[]) => void,
     *    foobar: (...args: string[]) => void,
     *    baz: (...args: string[]) => void,
     * }>}
     */
    const el = eventlite();

    const syncEmitted = (...args) => {
      output.push(["sync", args]);
    };

    const asyncEmitted = async (...args) => {
      await delay(() => {
        output.push(["async", args]);
      }, 100);
    };

    el.on("foo", syncEmitted);

    await Promise.all([
      el.send("foo"),
      el.send("foo", "bar"),
      el.send("foo", "bar", "baz"),
      el.send("foo", "bar", "baz", "boom"),
      el.send("foo", "bar", "baz", "boom", "hello"),
      el.send("foo", "bar", "baz", "boom", "hello", "world"),
      el.send("foo", "bar", "baz", "boom", "hello", "world", "!!!"),
    ]);

    assert.deepStrictEqual(output, [
      ["sync", []],
      ["sync", ["bar"]],
      ["sync", ["bar", "baz"]],
      ["sync", ["bar", "baz", "boom"]],
      ["sync", ["bar", "baz", "boom", "hello"]],
      ["sync", ["bar", "baz", "boom", "hello", "world"]],
      ["sync", ["bar", "baz", "boom", "hello", "world", "!!!"]],
    ]);

    output.splice(0, output.length);

    el.on("bar", asyncEmitted);

    await Promise.all([
      el.send("bar"),
      el.send("bar", "bar"),
      el.send("bar", "bar", "baz"),
      el.send("bar", "bar", "baz", "boom"),
      el.send("bar", "bar", "baz", "boom", "hello"),
      el.send("bar", "bar", "baz", "boom", "hello", "world"),
      el.send("bar", "bar", "baz", "boom", "hello", "world", "!!!"),
    ]);

    assert.deepStrictEqual(output, [
      ["async", []],
      ["async", ["bar"]],
      ["async", ["bar", "baz"]],
      ["async", ["bar", "baz", "boom"]],
      ["async", ["bar", "baz", "boom", "hello"]],
      ["async", ["bar", "baz", "boom", "hello", "world"]],
      ["async", ["bar", "baz", "boom", "hello", "world", "!!!"]],
    ]);

    output.splice(0, output.length);

    el.on("foobar", asyncEmitted);
    el.on("foobar", syncEmitted);

    await Promise.all([
      el.send("foobar"),
      el.send("foobar", "bar"),
      el.send("foobar", "bar", "baz"),
      el.send("foobar", "bar", "baz", "boom"),
      el.send("foobar", "bar", "baz", "boom", "hello"),
      el.send("foobar", "bar", "baz", "boom", "hello", "world"),
      el.send("foobar", "bar", "baz", "boom", "hello", "world", "!!!"),
    ]);

    assert.deepStrictEqual(output, [
      ["sync", []],
      ["sync", ["bar"]],
      ["sync", ["bar", "baz"]],
      ["sync", ["bar", "baz", "boom"]],
      ["sync", ["bar", "baz", "boom", "hello"]],
      ["sync", ["bar", "baz", "boom", "hello", "world"]],
      ["sync", ["bar", "baz", "boom", "hello", "world", "!!!"]],
      ["async", []],
      ["async", ["bar"]],
      ["async", ["bar", "baz"]],
      ["async", ["bar", "baz", "boom"]],
      ["async", ["bar", "baz", "boom", "hello"]],
      ["async", ["bar", "baz", "boom", "hello", "world"]],
      ["async", ["bar", "baz", "boom", "hello", "world", "!!!"]],
    ]);

    output.splice(0, output.length);

    el.once("baz", asyncEmitted);
    el.on("baz", syncEmitted);

    el.send("baz", "baz1").then((result) => {
      assert.strictEqual(result, true);
    });
    el.emit("baz", "baz2");

    await delay(() => {}, 100);

    assert.deepStrictEqual(output, [
      ["sync", ["baz2"]],
      ["sync", ["baz1"]],
      ["async", ["baz2"]],
    ]);

    output.splice(0, output.length);

    el.off("baz");
    el.once("baz", asyncEmitted);
    el.on("baz", syncEmitted);

    await el.send("baz", "baz1");
    el.emit("baz", "baz2");

    assert.deepStrictEqual(output, [
      ["sync", ["baz1"]],
      ["async", ["baz1"]],
      ["sync", ["baz2"]],
    ]);

    output.splice(0, output.length);

    const retval = await el.send("hello", "world");
    assert.strictEqual(retval, false);
  });

  test("catch exception", async () => {
    const el = eventlite();

    el.on("foo", () => {
      throw new Error("error!");
    });

    el.on("bar", () => {
      return new Promise((_, reject) => {
        delay(() => {
          reject(new Error("promise error!"));
        }, 100);
      });
    });

    el.on("baz", async () => {
      await delay(() => {
        throw new Error("async error!");
      }, 100);
    });

    try {
      el.emit("foo");
    } catch (error) {
      assert.strictEqual(error instanceof Error, true);
      assert.strictEqual(error.message, "error!");
    }

    try {
      await el.send("foo");
    } catch (error) {
      assert.strictEqual(error instanceof Error, true);
      assert.strictEqual(error.message, "error!");
    }

    try {
      await el.send("bar");
    } catch (error) {
      assert.strictEqual(error instanceof Error, true);
      assert.strictEqual(error.message, "promise error!");
    }

    try {
      await el.send("baz");
    } catch (error) {
      assert.strictEqual(error instanceof Error, true);
      assert.strictEqual(error.message, "async error!");
    }
  });

  if (typeof Map === "function") {
    test("FastMap", () => {
      const el1 = eventlite();
      const el2 = eventlite({ useFastMap: true });

      assert.strictEqual(el1._elevts instanceof Map, true);
      assert.strictEqual(el2._elevts instanceof Map, false);

      for (const key of range(1, 10).map((n) => `test_${n}`)) {
        el1.on(key, () => {});
        el2.on(key, () => {});
      }

      assert.deepStrictEqual(el1.eventNames(), el2.eventNames());

      const s1 = Symbol("sym1");
      const s2 = Symbol("sym2");
      const s3 = Symbol("sym3");

      el1.on(s1, () => {});
      el1.on(s2, () => {});
      el1.on(s3, () => {});

      el2.on(s1, () => {});
      el2.on(s2, () => {});
      el2.on(s3, () => {});

      assert.deepStrictEqual(el1.eventNames(), el2.eventNames());

      for (const key of range(2, 10, 2).map((n) => `test_${n}`)) {
        el1.off(key);
        el2.off(key);
      }

      assert.deepStrictEqual(el1.eventNames(), el2.eventNames());

      el1.off(s1);
      el2.off(s1);

      assert.deepStrictEqual(el1.eventNames(), el2.eventNames());

      el1.off(s3);
      el2.off(s3);

      assert.deepStrictEqual(el1.eventNames(), el2.eventNames());
    });
  }
});
