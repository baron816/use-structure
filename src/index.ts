import { useState, useMemo, useEffect } from "react";

type Collection = Record<any, any> | any[] | Set<any>;

export function useStructure<T extends Collection>(
  initialObj: T | (() => T)
): T {
  const [deepObj, setDeepObj] = useState<T>(() => {
    // @ts-ignore
    return typeof initialObj === "function" ? initialObj() : initialObj;
  });

  return useMemo(() => {
    const copy = deepCopy(deepObj, update);

    function update(newObj?: any) {
      setDeepObj(newObj ?? copy);
    }

    return copy;
  }, [deepObj]);
}

export function createGlobalStructure<T extends Collection>(initialObj: T) {
  const observer = new Observer(initialObj);

  return function useStructure(): T {
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
  };
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
    get: function (target, prop, receiver) {
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
    set: function (target, prop, value) {
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
    get: function (target, prop, receiver) {
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
    get: function (target, prop, receiver) {
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

function arrayProxy(arr: any[], setObj: (newObj: Collection) => void) {
  let memo: any[] = [];
  return new Proxy(arr, {
    get: function (target, prop, receiver) {
      switch (prop) {
        case "push":
          return (...v: any[]) => {
            if (memo.length === 0) {
              memo.push(...target);
            }
            memo.push(...v);
            setObj(memo);
            return v[v.length - 1];
          };
        case "pop":
          return () => {
            if (memo.length === 0) {
              memo.push(...target);
            }
            const lastVal = memo.pop();
            setObj(memo);
            return lastVal;
          };
        case "unshift":
          return (...v: any[]) => {
            if (memo.length === 0) {
              memo.push(...target);
            }
            memo.unshift(...v);
            setObj(memo);
            return v[0];
          };
        case "shift":
          return () => {
            if (memo.length === 0) {
              memo.push(...target);
            }
            const firstVal = memo.shift();
            setObj(memo);
            return firstVal;
          };
        case "sort":
          return (compareFunction?: (a: number, b: number) => number) => {
            if (memo.length === 0) {
              memo.push(...target);
            }

            memo.sort(compareFunction);
            setObj(memo);
            return memo;
          };
        case "splice":
          return (start: number, deleteCount: number, ...items: any[]) => {
            if (memo.length === 0) {
              memo.push(...target);
            }
            memo.splice(start, deleteCount, ...items);
            setObj(memo);
            return memo;
          };
        case "reverse":
          return () => {
            if (memo.length === 0) {
              memo.push(...target);
            }
            memo.reverse();
            setObj(memo);
            return memo;
          };
        case "copyWithin":
          return (idx: number, start: number, end?: number) => {
            if (memo.length === 0) {
              memo.push(...target);
            }

            memo.copyWithin(idx, start, end);
            setObj(memo);
            return memo;
          };
        case "fill":
          return (value: any, start?: number, end?: number) => {
            if (memo.length === 0) {
              memo.push(...target);
            }
            memo.fill(value, start, end);
            setObj(memo);
            return memo;
          };
        default:
          return Reflect.get(target, prop, receiver);
      }
    },
    set: function (target, prop, value, receiver) {
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

  update(newVal: T): void {
    this.value = newVal;

    for (const sub of this.subscribers) {
      sub(this.value);
    }
  }
}
