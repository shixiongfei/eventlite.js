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

// @ts-check

/**
 * @typedef {(...args: any[]) => void} Listener
 */

/**
 * A very simple and fast event emitter
 */
export class EventLite {
  constructor() {
    /** @type {{[event: string]: {fn: Listener, context: any}[]}} */
    this._events = {};
  }

  /**
   * Add an event listener
   * @param {string} event - Event name
   * @param {Listener} listener - Listener
   * @param {*} [context = this] - Context
   * @returns {this}
   */
  addListener(event, listener, context = this) {
    if (typeof listener !== "function") {
      throw new TypeError("The listener must be a function");
    }

    const listeners = this._events[event] || [];

    const index = listeners.findIndex(
      (current) => current.fn === listener && current.context === context,
    );

    if (index < 0) {
      this._events[event] = [...listeners, { fn: listener, context: context }];
    }

    return this;
  }

  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Listener} listener - Listener
   * @param {*} [context = this] - Context
   * @returns {this}
   */
  removeListener(event, listener, context = this) {
    if (this._events.hasOwnProperty(event)) {
      this._events[event] = this._events[event].filter(
        (current) => !(current.fn === listener && current.context === context),
      );

      if (this._events[event].length === 0) {
        delete this._events[event];
      }
    }

    return this;
  }

  /**
   * Remove all event listeners
   * @param {string} [event] - Event name
   * @returns {this}
   */
  removeAllListeners(event) {
    if (!event) {
      this._events = {};
      return this;
    }

    if (this._events.hasOwnProperty(event)) {
      delete this._events[event];
    }

    return this;
  }

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param  {...any} args - Arguments
   * @return {this}
   */
  emit(event, ...args) {
    if (this._events.hasOwnProperty(event)) {
      this._events[event].forEach((listener) =>
        listener.fn.apply(listener.context, args),
      );
    }

    return this;
  }

  /**
   * Add an event listener
   * @param {string} event - Event name
   * @param {Listener} listener - Listener
   * @param {*} [context = this] - Context
   * @returns {() => void} - Remove function
   */
  on(event, listener, context = this) {
    this.addListener(event, listener, context);

    const makeRemove = () => {
      let removed = false;

      return () => {
        if (!removed) {
          removed = true;
          this.removeListener(event, listener, context);
        }
      };
    };

    return makeRemove();
  }

  /**
   * Add an event listener and just emit once
   * @param {string} event - Event name
   * @param {Listener} listener - Listener
   * @param {*} [context = this] - Context
   * @returns {() => void} - Remove function
   */
  once(event, listener, context = this) {
    const remove = this.on(event, (...args) => {
      remove();
      listener.apply(context, args);
    });

    return remove;
  }

  /**
   * Remove an event listener or remove all event listeners
   * @param {string} event - Event name
   * @param {Listener} [listener] - Listener
   * @param {*} [context = this] - Context
   * @returns {this}
   */
  off(event, listener, context = this) {
    return listener
      ? this.removeListener(event, listener, context)
      : this.removeAllListeners(event);
  }

  /**
   * Get all event names
   * @returns {string[]}
   */
  eventNames() {
    return Object.keys(this._events);
  }

  /**
   * Get all listeners by event name
   * @param {string} event - Event name
   * @returns {Listener[] | undefined}
   */
  listeners(event) {
    return this._events.hasOwnProperty(event)
      ? this._events[event].map((listener) => listener.fn)
      : undefined;
  }
}

/**
 * Create a new EventLite object
 * @returns {EventLite}
 */
export const eventlite = () => new EventLite();

export default EventLite;
