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
  this._maxCount = 0;

  /** @type {() => void} */
  this.clear = () => {
    this._map = new _Map();
    this._count = 0;
    this._maxCount = 0;
  };

  /** @type {(key: string | symbol) => boolean} */
  this.has = (key) => {
    return !!this._map[key];
  };

  /** @type {(key: string | symbol) => any} */
  this.get = (key) => {
    return this._map[key];
  };

  /** @type {(key: string | symbol, value: any) => this} */
  this.set = (key, value) => {
    if (!this._map[key]) {
      this._count++;

      if (this._map[key] === undefined) {
        this._maxCount++;
      }
    }

    this._map[key] = value;
    return this;
  };

  /** @type {(key: string | symbol) => boolean} */
  this.delete = (key) => {
    if (!this._map[key]) {
      return false;
    }

    if (--this._count === 0) {
      this._map = new _Map();
      this._maxCount = 0;
      return true;
    }

    this._map[key] = null;

    if (this._count < this._maxCount - this._count) {
      const map = this._map;
      const copied = new _Map();

      for (const key in map) {
        if (map[key]) {
          copied[key] = map[key];
        }
      }

      this._map = copied;
      this._maxCount = this._count;
    }

    return true;
  };

  /** @type {() => MapIterator<string | symbol>} */
  this.keys = function* () {
    const map = this._map;

    for (const key in map) {
      if (map[key]) {
        yield key;
      }
    }
  };
}

if (typeof Object.create === "function") {
  _Map.prototype = Object.create(null);
}

/** @type {() => number} */
const _ELID = (() => {
  let count = 0;

  const Id = (function* () {
    for (;;) yield count++;
  })();

  return () => Id.next().value;
})();

/**
 * @import { ListenerFn, EventName, EventLiteOptions } from "./eventlite.d.ts"
 * @typedef {{id: number, fn: ListenerFn, context: any, once: boolean, removed: boolean}} EventListener
 */

/**
 * @param {ListenerFn} fn - Listener function
 * @param {*} context - Context
 * @param {boolean} once - Once listener
 * @returns {EventListener}
 */
function _EL(fn, context, once) {
  return { id: _ELID(), fn, context, once, removed: false };
}

/**
 * @param {EventLite} el - EventLite
 * @param {EventName} event - Event name
 * @param {ListenerFn} fn - Listener function
 * @param {*} context - Context
 * @param {boolean} once - Once listener
 * @returns {EventListener | undefined}
 */
function _newEL(el, event, fn, context, once) {
  if (typeof fn !== "function") {
    throw new TypeError("The listener must be a function");
  }

  const listeners = el._elevts.get(event);

  if (!listeners) {
    const listener = _EL(fn, context, once);

    el._elevts.set(event, listener);
    return listener;
  }

  if (listeners.fn) {
    if (
      el._elopts.allowDuplicate ||
      listeners.fn !== fn ||
      listeners.context !== context
    ) {
      const listener = _EL(fn, context, once);

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

  const events = new Array(length + 1);

  for (let i = 0; i < length; i++) {
    events[i] = listeners[i];
  }

  const listener = _EL(fn, context, once);
  events[length] = listener;

  el._elevts.set(event, events);
  return listener;
}

/**
 * @param {EventLite} el - EventLite
 * @param {EventName} event - Event name
 * @param {ListenerFn} [fn] - Listener function
 * @param {*} [context] - Context
 * @param {number} [id] - Event id
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

/** @type {() => Map<EventName, EventListener | EventListener[]>} */
const _newELMap = (() => {
  if (typeof Map === "function") {
    return () => new Map();
  }

  return () => new _FastMap();
})();

/** @type {(callback: () => void) => void} */
const _queueMicrotask = (() => {
  if (typeof queueMicrotask === "function") {
    return queueMicrotask;
  }

  return (callback) => {
    Promise.resolve().then(callback);
  };
})();

/**
 * @template T
 * @param {T | Promise<T>} value
 * @returns {value is Promise<T>}
 */
function _isPromise(value) {
  return (
    value !== null &&
    (typeof value === "object" || typeof value === "function") &&
    typeof value.then === "function" &&
    typeof value.catch === "function"
  );
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

    /** @type {Map<EventName, EventListener | EventListener[]>} */
    this._elevts = _newELMap();
  }

  /**
   * Add an event listener
   * @param {EventName} event - Event name
   * @param {ListenerFn} fn - Listener function
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
   * @param {EventName} event - Event name
   * @param {ListenerFn} fn - Listener function
   * @param {*} [context] - Context
   * @returns {this}
   */
  removeListener(event, fn, context) {
    _delEL(this, event, fn, context || this);
    return this;
  }

  /**
   * Remove all event listeners
   * @param {EventName} [event] - Event name
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
   * @param {EventName} event - Event name
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
   * Async send an event
   * @param {EventName} event - Event name
   * @param  {...any} args - Arguments
   * @return {Promise<boolean>}
   */
  send(event, a, b, c, d, e) {
    const _arguments = arguments;
    return new Promise((resolve, reject) => {
      try {
        _queueMicrotask(() => {
          try {
            const listeners = this._elevts.get(event);

            if (!listeners) {
              return resolve(false);
            }

            const len = _arguments.length;

            if (listeners.fn) {
              if (listeners.once) {
                _delEL(this, event, undefined, undefined, listeners.id);
              }

              let retval;

              switch (len) {
                case 1:
                  retval = listeners.fn.call(listeners.context);
                  break;
                case 2:
                  retval = listeners.fn.call(listeners.context, a);
                  break;
                case 3:
                  retval = listeners.fn.call(listeners.context, a, b);
                  break;
                case 4:
                  retval = listeners.fn.call(listeners.context, a, b, c);
                  break;
                case 5:
                  retval = listeners.fn.call(listeners.context, a, b, c, d);
                  break;
                case 6:
                  retval = listeners.fn.call(listeners.context, a, b, c, d, e);
                  break;
                default: {
                  const args = new Array(len - 1);

                  for (let i = 1; i < len; i++) {
                    args[i - 1] = _arguments[i];
                  }

                  retval = listeners.fn.apply(listeners.context, args);
                }
              }

              return _isPromise(retval)
                ? retval
                    .then(() => resolve(true))
                    .catch((error) => reject(error))
                : resolve(true);
            }

            let args, retval;
            let pcnt = 0;

            const length = listeners.length;
            const promises = new Array(length);

            for (let i = 0; i < length; i++) {
              const listener = listeners[i];

              if (listener.once) {
                _delEL(this, event, undefined, undefined, listener.id);
              }

              switch (len) {
                case 1:
                  retval = listener.fn.call(listener.context);
                  break;
                case 2:
                  retval = listener.fn.call(listener.context, a);
                  break;
                case 3:
                  retval = listener.fn.call(listener.context, a, b);
                  break;
                case 4:
                  retval = listener.fn.call(listener.context, a, b, c);
                  break;
                case 5:
                  retval = listener.fn.call(listener.context, a, b, c, d);
                  break;
                case 6:
                  retval = listener.fn.call(listener.context, a, b, c, d, e);
                  break;
                default: {
                  if (!args) {
                    args = new Array(len - 1);

                    for (let j = 1; j < len; j++) {
                      args[j - 1] = _arguments[j];
                    }
                  }

                  retval = listener.fn.apply(listener.context, args);
                }
              }

              if (_isPromise(retval)) {
                promises[pcnt++] = retval;
              }
            }

            if (pcnt === 0) {
              return resolve(true);
            }

            promises.length = pcnt;

            Promise.all(promises)
              .then(() => resolve(true))
              .catch((error) => reject(error));
          } catch (error) {
            reject(error);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Add an event listener
   * @param {EventName} event - Event name
   * @param {ListenerFn} fn - Listener function
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
   * @param {EventName} event - Event name
   * @param {ListenerFn} fn - Listener function
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
   * @param {EventName} event - Event name
   * @param {ListenerFn} [fn] - Listener function
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
   * @returns {EventName[]}
   */
  eventNames() {
    return Array.from(this._elevts.keys());
  }

  /**
   * Get all listeners by event name
   * @param {EventName} event - Event name
   * @returns {ListenerFn[]}
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

  /**
   * Get the number of listeners by event name
   * @param {EventName} event - Event name
   * @param {ListenerFn} [fn] - Listener function
   * @param {*} [context] - Context
   * @returns {number}
   */
  listenerCount(event, fn, context) {
    const events = this._elevts.get(event);

    if (!events) {
      return 0;
    }

    if (!fn) {
      return events.fn ? 1 : events.length;
    }

    context = context || this;

    if (events.fn) {
      return events.fn === fn && events.context === context ? 1 : 0;
    }

    let count = 0;
    const length = events.length;

    for (let i = 0; i < length; i++) {
      if (events[i].fn === fn && events[i].context === context) {
        count++;
      }
    }

    return count;
  }
}

/**
 * Create a new EventLite object
 * @param {EventLiteOptions} [options]
 * @returns {EventLite}
 */
export const eventlite = (options) => new EventLite(options);

export default EventLite;
