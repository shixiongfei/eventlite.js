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

export declare type ListenerFn = (...args: any[]) => void;
export declare type EventName = string | symbol;
export declare type EventLiteOptions = { allowDuplicate?: boolean };

/** A very simple and fast event emittera */
export declare class EventLite {
  constructor(options?: EventLiteOptions);

  /** Add an event listener */
  addListener(event: EventName, fn: ListenerFn, context?: any, once?: boolean): this;

  /** Remove an event listener */
  removeListener(event: EventName, fn: ListenerFn, context?: any): this;

  /** Remove all event listeners */
  removeAllListeners(event?: EventName): this;

  /** Emit an event */
  emit(event: EventName, ...args: any[]): this;

  /** Add an event listener */
  on(event: EventName, fn: ListenerFn, context?: any): () => void;

  /** Add an event listener and just emit once */
  once(event: EventName, fn: ListenerFn, context?: any): () => void;

  /** Remove an event listener or remove all event listeners */
  off(event: EventName, fn?: ListenerFn, context?: any): this;

  /** Get all event names */
  eventNames(): EventName[];

  /** Get all listeners by event name */
  listeners(event: EventName): ListenerFn[];

  /** Get the number of listeners by event name */
  listenerCount(event: EventName, fn?: ListenerFn, context?: any): number;
}

/** Create a new EventLite object */
export declare function eventlite(options?: EventLiteOptions): EventLite;

export default EventLite;
