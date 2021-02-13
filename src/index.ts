import { useState, useMemo, useEffect } from "react";

type Collection = Record<any, any> | any[] | Set<any>;

/**
 * Returns a stateful object which can set imparatively.
 * Any 'mutations' to the object will correctly update
 * the component's state.
 *
 * @param initialObject The initial state value. Can pass
 * a function to instantiate initial state (similar to useState).
 */
export function useStructure<T extends Collection>(
  initialObject: T | (() => T)
): T {
  const [deepObj, setDeepObj] = useState<T>(() => {
    return isFunction(initialObject) ? initialObject() : initialObject;
  });

  return useMemo(() => {
    const copy = deepCopy(deepObj, update);

    function update(newObj?: any) {
      setDeepObj(newObj ?? copy);
    }

    return copy;
  }, [deepObj]);
}

/**
 * Creates a `useStructure` hook that shares state across all components that
 * are composed of the hook. Use for "global" state.
 *
 * @param initialObject Initial state value.
 * @param {boolean} [includeObserver] If true, createGlobalStructure will return
 * an array of [0] the hook, and [1] and observer that listens to state changes.
 */
export function createGlobalStructure<
  T extends Collection,
  R extends boolean = false
>(
  initialObject: T,
  includeObserver?: R
): R extends true ? [() => T, Observer<T>] : () => T {
  const observer = new Observer(initialObject);

  function useGlobalStructure(): T {
    const [deepObj, setDeepObj] = useState<T>(observer.value);

    useEffect(() => {
      return observer.subscribe(setDeepObj);
    }, []);

    return useMemo(() => {
      const copy = deepCopy(deepObj, update);

      function update(newObj?: any) {
        observer.update(newObj ?? copy);
      }

      return copy;
    }, [deepObj]);
  }

  // @ts-ignore
  return includeObserver ? [useGlobalStructure, observer] : useGlobalStructure;
}

function deepCopy(
  obj: Collection,
  update: (newObj?: Collection) => void,
  parent?: Record<string, any>,
  parentKey?: string | number
) {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  function setObj(newObj: Collection) {
    if (parent != null && parentKey != null) {
      if (parent instanceof Map) {
        parent.set(parentKey, newObj);
      } else {
        parent[parentKey] = newObj;
      }
      update();
    } else {
      update(newObj);
    }
  }

  if (obj instanceof Set) {
    const newSet = new Set();

    for (const val of obj) {
      newSet.add(deepCopy(val, update, newSet));
    }

    return setProxy(newSet, setObj);
  } else if (obj instanceof Map) {
    const newMap = new Map();

    for (const [key, val] of obj) {
      newMap.set(key, deepCopy(val, update, newMap, key));
    }

    return mapProxy(newMap, setObj);
  } else if (Array.isArray(obj)) {
    const newArr: any[] = [];

    obj.forEach((val, idx) => {
      newArr[idx] = deepCopy(val, update, newArr, idx);
    });

    return arrayProxy(newArr, setObj);
  } else {
    const result: Record<any, any> = {};

    for (const key of getAllPropertyNames(obj)) {
      result[key] = deepCopy(obj[key], update, result, key);
    }
    return objectProxy(result, setObj);
  }
}

function getAllPropertyNames(obj: Record<any, any>) {
  const methods = new Set<string>();
  while (obj !== Object.prototype) {
    let keys = Reflect.ownKeys(obj);
    (keys.filter((v) => typeof v === "string") as string[]).forEach((k) =>
      methods.add(k)
    );
    obj = Reflect.getPrototypeOf(obj);
  }
  return methods;
}

function objectProxy(
  obj: Record<any, any>,
  setObj: (newObj: Collection) => void
) {
  let memo: Record<any, any> | null = null;
  return new Proxy(obj, {
    get(target, prop, receiver) {
      if (
        typeof prop === "string" &&
        getAllPropertyNames(target).has(prop) &&
        typeof target[prop] === "function"
      ) {
        return (...args: any[]) => {
          if (memo == null) {
            memo = Object.assign(
              Object.create(Object.getPrototypeOf(target)),
              target
            );
          }

          const result = memo?.[prop](...args);
          if (memo && result === undefined) {
            setObj(memo);
          }
          return result;
        };
      }
      return Reflect.get(target, prop, receiver);
    },
    set(target, prop, value) {
      if (typeof prop === "symbol") {
        return false;
      }
      if (memo == null) {
        memo = { ...target };
      }

      memo[prop] = value;
      setObj(memo);
      return true;
    },
  });
}

function mapProxy(map: Map<any, any>, setObj: (newObj: Collection) => void) {
  let memo: Map<any, any> | null = null;
  return new Proxy(map, {
    get(target, prop, receiver) {
      if (prop === "set") {
        return (key: any, value: any) => {
          if (memo == null) {
            memo = new Map(target);
          }
          memo.set(key, value);

          setObj(memo);
          return memo;
        };
      } else if (prop === "delete") {
        return (key: any) => {
          if (memo == null) {
            memo = new Map(target);
          }
          if (memo.delete(key)) {
            setObj(memo);
            return true;
          } else {
            return false;
          }
        };
      } else if (prop === "clear") {
        return () => {
          memo = new Map();
          setObj(memo);
        };
      } else if (prop === "get") {
        return target.get.bind(target);
      } else if (prop === Symbol.iterator) {
        return target[Symbol.iterator].bind(target);
      } else if (prop === "size") {
        return target.size;
      }

      return Reflect.get(target, prop, receiver);
    },
  });
}

function setProxy(set: Set<any>, setObj: (newObj: Collection) => void) {
  let memo: Set<any> | null = null;
  return new Proxy(set, {
    get(target, prop, receiver) {
      if (prop === "add") {
        return (val: any) => {
          if (target.has(val)) {
            return;
          }
          if (memo == null) {
            memo = new Set(target);
          }
          memo.add(val);
          setObj(memo);
        };
      } else if (prop === "delete") {
        return (key: any) => {
          if (memo == null) {
            memo = new Set(target);
          }
          if (memo.delete(key)) {
            setObj(memo);
            return true;
          } else {
            return false;
          }
        };
      } else if (prop === "clear") {
        return () => {
          memo = new Set();
          setObj(memo);
        };
      } else if (prop === "has") {
        return target.has.bind(target);
      } else if (prop === Symbol.iterator) {
        return target[Symbol.iterator].bind(target);
      } else if (prop === "size") {
        return target.size;
      }

      return Reflect.get(target, prop, receiver);
    },
  });
}

const arrayMethods = new Set([
  "push",
  "pop",
  "unshift",
  "shift",
  "sort",
  "splice",
  "reverse",
  "copyWithin",
  "fill",
]);

function arrayProxy(arr: any[], setObj: (newObj: Collection) => void) {
  let memo: any[] = [];
  return new Proxy(arr, {
    get(target, prop, receiver) {
      if (typeof prop === "string" && arrayMethods.has(prop)) {
        return (...v: any[]) => {
          if (memo.length === 0) {
            memo.push(...target);
          }
          // @ts-ignore
          const result = memo[prop](...v);
          setObj(memo);
          return result;
        };
      } else {
        return Reflect.get(target, prop, receiver);
      }
    },
    set(target, prop, value, receiver) {
      const lookup = Number(prop);
      if (!Number.isNaN(lookup)) {
        if (memo.length === 0) {
          memo.push(...target);
        }

        memo[lookup] = value;

        setObj(memo);
        return true;
      }
      return Reflect.set(target, prop, value, receiver);
    },
  });
}

type Subscriber<T> = (val: T) => void;

class Observer<T> {
  subscribers: Set<Subscriber<T>>;
  value: T;

  constructor(val: T) {
    this.value = val;
    this.subscribers = new Set<Subscriber<T>>();
  }

  unsubscribe(fn: Subscriber<T>): () => void {
    return () => {
      this.subscribers.delete(fn);
    };
  }

  subscribe(fn: Subscriber<T>): () => void {
    this.subscribers.add(fn);
    return this.unsubscribe(fn);
  }

  update(newVal: T | ((oldVal: T) => T)): void {
    this.value = isFunction(newVal) ? newVal(this.value) : newVal;

    for (const sub of this.subscribers) {
      sub(this.value);
    }
  }
}

function isFunction(val: any): val is Function {
  return typeof val === "function";
}
