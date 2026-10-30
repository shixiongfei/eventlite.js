# EventLite.js

[![NPM Version](https://img.shields.io/npm/v/eventlite.js)](https://www.npmjs.com/package/eventlite.js)

EventLite.js is a very simple and fast event emitter, optimized code with asynchronous support, zero dependencies, written using ES6 standard and works in most JavaScript runtime.

## Install

```bash
npm install eventlite.js
```

## Usage

```js
import { eventlite } from "eventlite.js";

const el = eventlite();

const off = el.on("foo", (value) => console.log(value));

el.emit("foo", "bar");
off();

el.once("foo", () => "done");

// Listeners are called in a microtask; send() resolves after they settle.
console.log(await el.send("foo")); // true
```

ESM only (`"type": "module"`). Requires Node.js 18+ or a modern bundler.

## Options

- `allowDuplicate` - allow the same listener to be registered more than once.
- `useFastMap` - use the internal object-based map instead of `Map`. Event names must be strings or symbols; other values are coerced into object keys.
- `isolate` - isolate synchronous listener errors. Pass `true` to run every listener and swallow their errors, or pass `{ onError }` to receive each error as `(error, event, args)`. Errors thrown by `onError` itself are not caught. Only synchronous throws are isolated; async rejections are reported by `send()`.

## Document

See [eventlite.d.ts](https://github.com/shixiongfei/eventlite.js/blob/master/eventlite.d.ts)
