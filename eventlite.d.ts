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

export declare type ListenerFn<T extends any[] = any[]> = (...args: T) => void;
export declare type EventName = string | symbol;
export declare type EventLiteOptions = { allowDuplicate?: boolean };

export declare type EventTypes = EventName | object;

export declare type EventKeys<T extends EventTypes> = T extends EventName
  ? T
  : keyof T;

export declare type EventArgs<
  T extends EventTypes,
  K extends EventKeys<T>,
> = T extends EventName
  ? any[]
  : T[Extract<K, keyof T>] extends ListenerFn
    ? Parameters<T[Extract<K, keyof T>]>
    : T[Extract<K, keyof T>] extends any[]
      ? T[Extract<K, keyof T>]
      : any[];

/** A very simple and fast event emittera */
export declare class EventLite<T extends EventTypes = EventName> {
  constructor(options?: EventLiteOptions);

  /** Add an event listener */
  addListener<K extends EventKeys<T>>(
    event: K,
    fn: ListenerFn<EventArgs<T, K>>,
    context?: any,
    once?: boolean,
  ): this;

  /** Remove an event listener */
  removeListener<K extends EventKeys<T>>(
    event: K,
    fn: ListenerFn<EventArgs<T, K>>,
    context?: any,
  ): this;

  /** Remove all event listeners */
  removeAllListeners<K extends EventKeys<T>>(event?: K): this;

  /** Emit an event */
  emit<K extends EventKeys<T>>(event: K, ...args: EventArgs<T, K>): this;

  /** Async send an event */
  send<K extends EventKeys<T>>(
    event: K,
    ...args: EventArgs<T, K>
  ): Promise<boolean>;

  /** Add an event listener */
  on<K extends EventKeys<T>>(
    event: K,
    fn: ListenerFn<EventArgs<T, K>>,
    context?: any,
  ): () => void;

  /** Add an event listener and just emit once */
  once<K extends EventKeys<T>>(
    event: K,
    fn: ListenerFn<EventArgs<T, K>>,
    context?: any,
  ): () => void;

  /** Remove an event listener or remove all event listeners */
  off<K extends EventKeys<T>>(
    event: K,
    fn?: ListenerFn<EventArgs<T, K>>,
    context?: any,
  ): this;

  /** Get all event names */
  eventNames(): Array<EventKeys<T>>;

  /** Get all listeners by event name */
  listeners<K extends EventKeys<T>>(
    event: K,
  ): Array<ListenerFn<EventArgs<T, K>>>;

  /** Get the number of listeners by event name */
  listenerCount<K extends EventKeys<T>>(
    event: K,
    fn?: ListenerFn<EventArgs<T, K>>,
    context?: any,
  ): number;
}

/** Create a new EventLite object */
export declare function eventlite<T extends EventTypes = EventName>(
  options?: EventLiteOptions,
): EventLite<T>;

export default EventLite;
