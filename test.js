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

console.log(event.eventNames());
console.log(event.listeners("hello"));

console.log("-----");

class Countdown extends EventLite {
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
