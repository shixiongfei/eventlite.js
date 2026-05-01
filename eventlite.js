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
 */

/**
 * A very simple and fast event emitter
 */
export class EventLite {
  constructor() {
    /** @type {{[event: string]: Listener[]}} */
    this._events = {};
  }

  /**
   * Add an event listener
   * @param {string} event - Event name
   * @param {Listener} listener - Listener
   * @returns {this}
   */
  addListener(event, listener) {
    if (typeof listener !== "function") {
      throw new TypeError("The listener must be a function");
    }

    const listeners = this._events[event] ?? [];

    if (listeners.indexOf(listener) < 0) {
      this._events[event] = [...listeners, listener];
    }

    return this;
  }

  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Listener} listener - Listener
   * @returns {this}
   */
  removeListener(event, listener) {
    if (this._events.hasOwnProperty(event)) {
      this._events[event] = this._events[event].filter(
        (current) => current !== listener,
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
      this._events[event].forEach((listener) => listener.apply(this, args));
    }

    return this;
  }

  /**
   * Add an event listener
   * @param {string} event - Event name
   * @param {Listener} listener - Listener
   * @returns {() => void} - Remove function
   */
  on(event, listener) {
    this.addListener(event, listener);
    return () => this.removeListener(event, listener);
  }

  /**
   * Add an event listener and just emit once
   * @param {string} event - Event name
   * @param {Listener} listener - Listener
   * @returns {this}
   */
  once(event, listener) {
    const remove = this.on(event, (...args) => {
      remove();
      listener.apply(this, args);
    });

    return this;
  }

  /**
   * Remove an event listener or remove all event listeners
   * @param {string} event - Event name
   * @param {Listener} [listener] - Listener
   * @returns {this}
   */
  off(event, listener) {
    return listener
      ? this.removeListener(event, listener)
      : this.removeAllListeners(event);
  }
}

/**
 * Create a new EventLite object
 * @returns {EventLite}
 */
export const eventlite = () => new EventLite();

export default EventLite;
