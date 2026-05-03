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

import EventLite, { eventlite } from "./eventlite.js";

const event = eventlite();

event.addListener("hello", console.log);

// The same listener will ignore
event.addListener("hello", console.log);

// Will see "world!"" 1 time
event.emit("hello", "world!");

console.log("-----");

// Only trigger 1 time
event.once("hello", (...args) => console.log("Once!", ...args));

const remove = event.on("hello", (...args) => console.log(...args));

// Will see "world!" 3 times
event.emit("hello", "world!");

console.log("-----");

// Again, will see "world!" 2 times
event.emit("hello", "world!");

console.log("-----");

remove();

// Will see "world!"" 1 time
event.emit("hello", "world!");

console.log("-----");

const context = { foo: "bar" };

function emitted() {
  console.log(this === context); // true
}

event.once("event", emitted, context);
event.on("another", emitted, context);

event.emit("event");
event.emit("another");

event.removeListener("another", emitted, context);

console.log("-----");

class Counter {
  constructor() {
    this.count = 0;
    console.log("Counter init", this.count);
  }

  add(value = 1) {
    this.count += value;
    console.log("Counter add", value, "now is", this.count);
  }

  sub(value = 1) {
    this.count -= value;
    console.log("Counter sub", value, "now is", this.count);
  }
}

const counter = new Counter();

event.on("add", counter.add, counter);
event.once("sub", counter.sub, counter);

event.emit("add");
event.emit("add", 10);
event.emit("sub", 5);
event.emit("sub");

console.log("-----");

console.log(event.eventNames());
console.log(event.listeners("hello"));
console.log(event.listeners("world"));
console.log(event.listeners("add"));
console.log(event.listeners("sub"));

console.log("-----");

class Countdown extends EventLite {
  /** @param {number} seconds */
  constructor(seconds) {
    super();

    setTimeout(
      function trigger() {
        if (seconds < 1) {
          return;
        }

        this.emit("countdown", --seconds);
        setTimeout(trigger.bind(this), 1000);
      }.bind(this),
      1000,
    );
  }
}

const countdown = new Countdown(10);

countdown.on("countdown", (seconds) => console.log("Countdown:", seconds));
