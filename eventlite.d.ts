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

// @ts-check

export declare type Listener = (...args: any[]) => void;

/** A very simple and fast event emittera */
export declare class EventLite {
  constructor();

  /** Add an event listener */
  addListener(event: string, listener: Listener, context?: any): this;

  /** Remove an event listener */
  removeListener(event: string, listener: Listener, context?: any): this;

  /** Remove all event listeners */
  removeAllListeners(event?: string): this;

  /** Emit an event */
  emit(event: string, ...args: any[]): this;

  /** Add an event listener */
  on(event: string, listener: Listener, context?: any): () => void;

  /** Add an event listener and just emit once */
  once(event: string, listener: Listener, context?: any): this;

  /** Remove an event listener or remove all event listeners */
  off(event: string, listener?: Listener, context?: any): this;

  /** Get all event names */
  eventNames(): string[];

  /** Get all listeners by event name */
  listeners(event: string): Listener[] | undefined;
}

/** Create a new EventLite object */
export declare function eventlite(): EventLite;

export default EventLite;
