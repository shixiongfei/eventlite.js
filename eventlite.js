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
  /**
   * @typedef {{fn: Listener, context: any}} EventListener
   */

  constructor() {
    /** @type {{[event: string]: EventListener | EventListener[]}} */
    this._events = Object.create(null);
  }

  /**
   * Add an event listener
   * @param {string} event - Event name
   * @param {Listener} listener - Listener
   * @param {*} [context] - Context
   * @returns {this}
   */
  addListener(event, listener, context) {
    if (typeof listener !== "function") {
      throw new TypeError("The listener must be a function");
    }

    context = context || this;

    const listeners = this._events[event];

    if (!listeners) {
      this._events[event] = { fn: listener, context: context };
      return this;
    }

    if (listeners.fn) {
      if (listeners.fn !== listener || listeners.context != context) {
        this._events[event] = [listeners, { fn: listener, context: context }];
      }

      return this;
    }

    // const index = listeners.findIndex(
    //   (current) => current.fn === listener && current.context === context,
    // );

    // fast find index
    let index = -1;

    for (let i = 0; i < listeners.length; i++) {
      if (listeners[i].fn === listener && listeners[i].context === context) {
        index = i;
        break;
      }
    }
    // end

    if (index < 0) {
      // this._events[event] = [...listeners, { fn: listener, context: context }];

      // fast copy listeners
      const events = new Array(listeners.length + 1);

      for (let i = 0; i < listeners.length; i++) {
        events[i] = listeners[i];
      }

      events[listeners.length] = { fn: listener, context: context };

      this._events[event] = events;
      // end
    }

    return this;
  }

  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Listener} listener - Listener
   * @param {*} [context] - Context
   * @returns {this}
   */
  removeListener(event, listener, context) {
    const listeners = this._events[event];

    if (listeners) {
      context = context || this;

      // this._events[event] = this._events[event].filter(
      //   (current) => current.fn !== listener || current.context !== context,
      // );
      //
      // if (this._events[event].length === 0) {
      //   delete this._events[event];
      // }

      if (listeners.fn) {
        if (listeners.fn === listener && listeners.context === context) {
          delete this._events[event];
        }

        return this;
      }

      // fast filter listeners
      let count = 0;
      const events = new Array(listeners.length);

      for (let i = 0; i < listeners.length; i++) {
        if (listeners[i].fn !== listener || listeners[i].context !== context) {
          events[count++] = listeners[i];
        }
      }

      if (count === 1) {
        this._events[event] = events[0];
      } else if (count > 1) {
        events.length = count;
        this._events[event] = events;
      } else {
        delete this._events[event];
      }
      // end
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
      this._events = Object.create(null);
      return this;
    }

    if (this._events[event]) {
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
  emit(event, a, b, c, d, e) {
    // if (this._events[event]) {
    //   this._events[event].forEach((listener) =>
    //     listener.fn.apply(listener.context, args),
    //   );
    // }

    // fast emit
    const listeners = this._events[event];

    if (!listeners) {
      return this;
    }

    let args;
    const len = arguments.length;

    if (listeners.fn) {
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

      args = new Array(len - 1);

      for (let i = 1; i < len; i++) {
        args[i - 1] = arguments[i];
      }

      listeners.fn.apply(listeners.context, args);

      return this;
    }

    for (let i = 0; i < listeners.length; i++) {
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
    // end

    return this;
  }

  /**
   * Add an event listener
   * @param {string} event - Event name
   * @param {Listener} listener - Listener
   * @param {*} [context] - Context
   * @returns {() => void} - Remove function
   */
  on(event, listener, context) {
    context = context || this;

    this.addListener(event, listener, context);

    let removed = false;

    return () => {
      if (!removed) {
        removed = true;
        this.removeListener(event, listener, context);
      }
    };
  }

  /**
   * Add an event listener and just emit once
   * @param {string} event - Event name
   * @param {Listener} listener - Listener
   * @param {*} [context] - Context
   * @returns {() => void} - Remove function
   */
  once(event, listener, context) {
    context = context || this;

    // const remove = this.on(event, (...args) => {
    //   remove();
    //   listener.apply(context, args);
    // });

    // fast emit
    const remove = this.on(event, function (a, b, c, d, e) {
      remove();

      const len = arguments.length;

      switch (len) {
        case 0:
          listener.call(context);
          break;
        case 1:
          listener.call(context, a);
          break;
        case 2:
          listener.call(context, a, b);
          break;
        case 3:
          listener.call(context, a, b, c);
          break;
        case 4:
          listener.call(context, a, b, c, d);
          break;
        case 5:
          listener.call(context, a, b, c, d, e);
          break;
        default: {
          const args = new Array(len);

          for (let i = 0; i < len; i++) {
            args[i] = arguments[i];
          }

          listener.apply(context, args);
        }
      }
    });
    // end

    return remove;
  }

  /**
   * Remove an event listener or remove all event listeners
   * @param {string} event - Event name
   * @param {Listener} [listener] - Listener
   * @param {*} [context] - Context
   * @returns {this}
   */
  off(event, listener, context) {
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
   * @returns {Listener[]}
   */
  listeners(event) {
    const events = this._events[event];

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
