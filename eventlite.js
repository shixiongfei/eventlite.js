/*
 * eventlite.js
 *
 * Copyright (c) 2026 Xiongfei Shi
 *
 * Author: Xiongfei Shi <xiongfei.shi(a)icloud.com>
 * License: Apache-2.0
 *
 * https://github.com/shixiongfei/eventlite.js
 */

/**
 * @typedef {(...args: any[]) => void} Listener
 * @typedef {{fn: Listener, context: any, once: boolean, removed: boolean}} EventListener
 */

function _Map() {}

if (Object.create) {
  _Map.prototype = Object.create(null);
}

class FastMap {
  constructor() {
    this._map = new _Map();
  }

  get isFastMap() {
    return true;
  }

  clear() {
    this._map = new _Map();
  }

  has(key) {
    return this._map[key] !== undefined;
  }

  get(key) {
    return this._map[key];
  }

  set(key, value) {
    this._map[key] = value;
    return this;
  }

  delete(key) {
    if (!this._map[key]) {
      return false;
    }

    this._map[key] = undefined;
    return true;
  }

  *keys() {
    for (const key in this._map) {
      if (this._map[key]) {
        yield key;
      }
    }
  }

  *values() {
    for (const key in this._map) {
      if (this._map[key]) {
        yield this._map[key];
      }
    }
  }
}

/**
 * @param {Map<string, EventListener | EventListener[]>} _events
 * @param {string} event
 * @param {Listener} fn
 * @param {*} context
 * @param {boolean} once
 * @returns {EventListener | undefined}
 */
function _newEL(_events, event, fn, context, once) {
  if (typeof fn !== "function") {
    throw new TypeError("The listener must be a function");
  }

  const listeners = _events.get(event);

  if (!listeners) {
    const listener = { fn, context, once, removed: false };

    _events.set(event, listener);
    return listener;
  }

  if (listeners.fn) {
    if (listeners.fn !== fn || listeners.context !== context) {
      const listener = { fn, context, once, removed: false };

      _events.set(event, [listeners, listener]);
      return listener;
    }

    return undefined;
  }

  for (let i = 0; i < listeners.length; i++) {
    if (listeners[i].fn === fn && listeners[i].context === context) {
      return undefined;
    }
  }

  const listener = { fn, context, once, removed: false };
  const events = new Array(listeners.length + 1);

  for (let i = 0; i < listeners.length; i++) {
    events[i] = listeners[i];
  }

  events[listeners.length] = listener;
  _events.set(event, events);

  return listener;
}

/**
 * A very simple and fast event emitter
 */
export class EventLite {
  constructor() {
    /** @type {Map<string, EventListener | EventListener[]>} */
    try {
      this._events = Object.create ? new FastMap() : new Map();
    } catch {
      this._events = new FastMap();
    }
  }

  /**
   * Add an event listener
   * @param {string} event - Event name
   * @param {Listener} fn - Listener
   * @param {*} [context] - Context
   * @param {boolean} [once = false] - Once listener
   * @returns {this}
   */
  addListener(event, fn, context, once = false) {
    _newEL(this._events, event, fn, context || this, once);
    return this;
  }

  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Listener} fn - Listener
   * @param {*} [context] - Context
   * @returns {this}
   */
  removeListener(event, fn, context) {
    const listeners = this._events.get(event);

    if (!listeners) {
      return this;
    }

    context = context || this;

    if (listeners.fn) {
      if (listeners.fn === fn && listeners.context === context) {
        listeners.removed = true;
        this._events.delete(event);
      }
      return this;
    }

    let count = 0;
    const events = new Array(listeners.length);

    for (let i = 0; i < listeners.length; i++) {
      if (listeners[i].fn !== fn || listeners[i].context !== context) {
        events[count++] = listeners[i];
      } else {
        listeners[i].removed = true;
      }
    }

    if (count === 0) {
      this._events.delete(event);
      return this;
    }

    if (count === 1) {
      this._events.set(event, events[0]);
      return this;
    }

    events.length = count;
    this._events.set(event, events);

    return this;
  }

  /**
   * Remove all event listeners
   * @param {string} [event] - Event name
   * @returns {this}
   */
  removeAllListeners(event) {
    if (!event) {
      this._events.clear();
      return this;
    }

    if (this._events.has(event)) {
      this._events.delete(event);
    }

    return this;
  }

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param  {...any} args - Arguments
   * @return {this}
   */
  emit(event, a, b, c, d, e) {
    const listeners = this._events.get(event);

    if (!listeners) {
      return this;
    }

    const len = arguments.length;

    if (listeners.fn) {
      if (listeners.once) {
        this.removeListener(event, listeners.fn, listeners.context);
      }

      switch (len) {
        case 1:
          listeners.fn.call(listeners.context);
          return this;
        case 2:
          listeners.fn.call(listeners.context, a);
          return this;
        case 3:
          listeners.fn.call(listeners.context, a, b);
          return this;
        case 4:
          listeners.fn.call(listeners.context, a, b, c);
          return this;
        case 5:
          listeners.fn.call(listeners.context, a, b, c, d);
          return this;
        case 6:
          listeners.fn.call(listeners.context, a, b, c, d, e);
          return this;
      }

      const args = new Array(len - 1);

      for (let i = 1; i < len; i++) {
        args[i - 1] = arguments[i];
      }

      listeners.fn.apply(listeners.context, args);

      return this;
    }

    let args;

    for (let i = 0; i < listeners.length; i++) {
      if (listeners[i].once) {
        this.removeListener(event, listeners[i].fn, listeners[i].context);
      }

      switch (len) {
        case 1:
          listeners[i].fn.call(listeners[i].context);
          break;
        case 2:
          listeners[i].fn.call(listeners[i].context, a);
          break;
        case 3:
          listeners[i].fn.call(listeners[i].context, a, b);
          break;
        case 4:
          listeners[i].fn.call(listeners[i].context, a, b, c);
          break;
        case 5:
          listeners[i].fn.call(listeners[i].context, a, b, c, d);
          break;
        case 6:
          listeners[i].fn.call(listeners[i].context, a, b, c, d, e);
          break;
        default: {
          if (!args) {
            args = new Array(len - 1);

            for (let j = 1; j < len; j++) {
              args[j - 1] = arguments[j];
            }
          }

          listeners[i].fn.apply(listeners[i].context, args);
        }
      }
    }

    return this;
  }

  /**
   * Add an event listener
   * @param {string} event - Event name
   * @param {Listener} fn - Listener
   * @param {*} [context] - Context
   * @returns {() => void} - Remove function
   */
  on(event, fn, context) {
    const el = _newEL(this._events, event, fn, context || this, false);

    return () => {
      if (el && !el.removed) {
        this.removeListener(event, el.fn, el.context);
      }
    };
  }

  /**
   * Add an event listener and just emit once
   * @param {string} event - Event name
   * @param {Listener} fn - Listener
   * @param {*} [context] - Context
   * @returns {() => void} - Remove function
   */
  once(event, fn, context) {
    const el = _newEL(this._events, event, fn, context || this, true);

    return () => {
      if (el && !el.removed) {
        this.removeListener(event, el.fn, el.context);
      }
    };
  }

  /**
   * Remove an event listener or remove all event listeners
   * @param {string} event - Event name
   * @param {Listener} [fn] - Listener
   * @param {*} [context] - Context
   * @returns {this}
   */
  off(event, fn, context) {
    return fn
      ? this.removeListener(event, fn, context)
      : this.removeAllListeners(event);
  }

  /**
   * Get all event names
   * @returns {string[]}
   */
  eventNames() {
    return Array.from(this._events.keys());
  }

  /**
   * Get all listeners by event name
   * @param {string} event - Event name
   * @returns {Listener[]}
   */
  listeners(event) {
    const events = this._events.get(event);

    if (!events) {
      return [];
    }

    if (events.fn) {
      return [events.fn];
    }

    const listeners = new Array(events.length);

    for (let i = 0; i < events.length; i++) {
      listeners[i] = events[i].fn;
    }

    return listeners;
  }
}

/**
 * Create a new EventLite object
 * @returns {EventLite}
 */
export const eventlite = () => new EventLite();

export default EventLite;
