/*
 * eventlite.d.ts
 *
 * Copyright (c) 2026 Xiongfei Shi
 *
 * Author: Xiongfei Shi <xiongfei.shi(a)icloud.com>
 * License: Apache-2.0
 *
 * https://github.com/shixiongfei/eventlite.js
 */

export declare type Listener = (...args: any[]) => void;

/**
 * A very simple and fast event emitter
 */
export declare class EventLite {
  constructor();

  /**
   * Add an event listener
   * @param {string} event - Event name
   * @param {Listener} listener - Listener
   * @returns {this}
   */
  addListener(event: string, listener: Listener): this;

  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Listener} listener - Listener
   * @returns {this}
   */
  removeListener(event: string, listener: Listener): this;

  /**
   * Remove all event listeners
   * @param {string} [event] - Event name
   * @returns {this}
   */
  removeAllListeners(event?: string): this;

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param  {...any} args - Arguments
   * @return {this}
   */
  emit(event: string, ...args: any[]): this;

  /**
   * Add an event listener
   * @param {string} event - Event name
   * @param {Listener} listener - Listener
   * @returns {() => void} - Remove function
   */
  on(event: string, listener: Listener): () => void;

  /**
   * Add an event listener and just emit once
   * @param {string} event - Event name
   * @param {Listener} listener - Listener
   * @returns {this}
   */
  once(event: string, listener: Listener): this;

  /**
   * Remove an event listener or remove all event listeners
   * @param {string} event - Event name
   * @param {Listener} [listener] - Listener
   * @returns {this}
   */
  off(event: string, listener?: Listener): this;
}

/**
 * Create a new EventLite object
 * @returns {EventLite}
 */
export declare function eventlite(): EventLite;

export default EventLite;
