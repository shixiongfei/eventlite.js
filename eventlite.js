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

function _Map() {}

function _FastMap() {
  this._map = new _Map();
  this._count = 0;

  /** @type {() => void} */
  this.clear = () => {
    this._map = new _Map();
    this._count = 0;
  };

  /** @type {(key: string) => boolean} */
  this.has = (key) => {
    return this._map[key] !== undefined;
  };

  /** @type {(key: string) => any} */
  this.get = (key) => {
    return this._map[key];
  };

  /** @type {(key: string, value: any) => this} */
  this.set = (key, value) => {
    if (!this._map[key]) {
      this._count++;
    }

    this._map[key] = value;
    return this;
  };

  /** @type {(key: string) => boolean} */
  this.delete = (key) => {
    if (!this._map[key]) {
      return false;
    }

    if (--this._count === 0) {
      this._map = new _Map();
      return true;
    }

    this._map[key] = undefined;
    return true;
  };

  /** @type {() => MapIterator<string>} */
  this.keys = function* () {
    const map = this._map;

    for (const key in map) {
      if (map[key]) {
        yield key;
      }
    }
  };
}

if (Object.create) {
  _Map.prototype = Object.create(null);
}

/** @type {() => number} */
const ELID = (() => {
  let count = 0;

  const Id = (function* () {
    for (;;) yield count++;
  })();

  return () => Id.next().value;
})();

/**
 * @typedef {(...args: any[]) => void} Listener
 * @typedef {{id: number, fn: Listener, context: any, once: boolean, removed: boolean}} EventListener
 * @typedef {{allowDuplicate?: boolean}} EventLiteOptions
 */

/**
 * @param {EventLite} el
 * @param {string} event
 * @param {Listener} fn
 * @param {*} context
 * @param {boolean} once
 * @returns {EventListener | undefined}
 */
function _newEL(el, event, fn, context, once) {
  if (typeof fn !== "function") {
    throw new TypeError("The listener must be a function");
  }

  const listeners = el._elevts.get(event);

  if (!listeners) {
    const listener = { id: ELID(), fn, context, once, removed: false };

    el._elevts.set(event, listener);
    return listener;
  }

  if (listeners.fn) {
    if (
      el._elopts.allowDuplicate ||
      listeners.fn !== fn ||
      listeners.context !== context
    ) {
      const listener = { id: ELID(), fn, context, once, removed: false };

      el._elevts.set(event, [listeners, listener]);
      return listener;
    }

    return undefined;
  }

  const length = listeners.length;

  if (!el._elopts.allowDuplicate) {
    for (let i = 0; i < length; i++) {
      if (listeners[i].fn === fn && listeners[i].context === context) {
        return undefined;
      }
    }
  }

  const listener = { id: ELID(), fn, context, once, removed: false };
  const events = new Array(length + 1);

  for (let i = 0; i < length; i++) {
    events[i] = listeners[i];
  }

  events[length] = listener;
  el._elevts.set(event, events);

  return listener;
}

/**
 * @param {EventLite} el
 * @param {string} event
 * @param {Listener} [fn]
 * @param {*} [context]
 * @param {number} [id]
 * @returns {boolean}
 */
function _delEL(el, event, fn, context, id) {
  const listeners = el._elevts.get(event);

  if (!listeners) {
    return false;
  }

  if (listeners.fn) {
    if (
      listeners.id === id ||
      (listeners.fn === fn && listeners.context === context)
    ) {
      listeners.removed = true;
      el._elevts.delete(event);

      return true;
    }

    return false;
  }

  let removed = false;
  const length = listeners.length;

  for (let i = length - 1; i >= 0; i--) {
    const listener = listeners[i];

    if (
      listener.id === id ||
      (listener.fn === fn && listener.context === context)
    ) {
      listener.removed = true;
      removed = true;
      break;
    }
  }

  if (!removed) {
    return false;
  }

  if (length === 2) {
    if (listeners[0].removed) {
      el._elevts.set(event, listeners[1]);
    } else {
      el._elevts.set(event, listeners[0]);
    }

    return true;
  }

  const events = new Array(length - 1);

  for (let i = 0, j = 0; i < length; i++) {
    if (!listeners[i].removed) {
      events[j++] = listeners[i];
    }
  }

  el._elevts.set(event, events);

  return true;
}

/**
 * A very simple and fast event emitter
 */
export class EventLite {
  /**
   * @param {EventLiteOptions} [options = {}]
   */
  constructor(options = {}) {
    /** @type {EventLiteOptions} */
    this._elopts = options;

    try {
      /** @type {Map<string, EventListener | EventListener[]>} */
      this._elevts = Object.create ? new _FastMap() : new Map();
    } catch {
      /** @type {Map<string, EventListener | EventListener[]>} */
      this._elevts = new _FastMap();
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
    _newEL(this, event, fn, context || this, once);
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
    _delEL(this, event, fn, context || this);
    return this;
  }

  /**
   * Remove all event listeners
   * @param {string} [event] - Event name
   * @returns {this}
   */
  removeAllListeners(event) {
    if (!event) {
      this._elevts.clear();
      return this;
    }

    if (this._elevts.has(event)) {
      this._elevts.delete(event);
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
    const listeners = this._elevts.get(event);

    if (!listeners) {
      return this;
    }

    const len = arguments.length;

    if (listeners.fn) {
      if (listeners.once) {
        _delEL(this, event, undefined, undefined, listeners.id);
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
    const length = listeners.length;

    for (let i = 0; i < length; i++) {
      const listener = listeners[i];

      if (listener.once) {
        _delEL(this, event, undefined, undefined, listener.id);
      }

      switch (len) {
        case 1:
          listener.fn.call(listener.context);
          break;
        case 2:
          listener.fn.call(listener.context, a);
          break;
        case 3:
          listener.fn.call(listener.context, a, b);
          break;
        case 4:
          listener.fn.call(listener.context, a, b, c);
          break;
        case 5:
          listener.fn.call(listener.context, a, b, c, d);
          break;
        case 6:
          listener.fn.call(listener.context, a, b, c, d, e);
          break;
        default: {
          if (!args) {
            args = new Array(len - 1);

            for (let j = 1; j < len; j++) {
              args[j - 1] = arguments[j];
            }
          }

          listener.fn.apply(listener.context, args);
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
    const el = _newEL(this, event, fn, context || this, false);

    return () => {
      if (el && !el.removed) {
        _delEL(this, event, undefined, undefined, el.id);
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
    const el = _newEL(this, event, fn, context || this, true);

    return () => {
      if (el && !el.removed) {
        _delEL(this, event, undefined, undefined, el.id);
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
    return Array.from(this._elevts.keys());
  }

  /**
   * Get all listeners by event name
   * @param {string} event - Event name
   * @returns {Listener[]}
   */
  listeners(event) {
    const events = this._elevts.get(event);

    if (!events) {
      return [];
    }

    if (events.fn) {
      return [events.fn];
    }

    const length = events.length;
    const listeners = new Array(length);

    for (let i = 0; i < length; i++) {
      listeners[i] = events[i].fn;
    }

    return listeners;
  }
}

/**
 * Create a new EventLite object
 * @param {EventLiteOptions} [options]
 * @returns {EventLite}
 */
export const eventlite = (options) => new EventLite(options);

export default EventLite;
