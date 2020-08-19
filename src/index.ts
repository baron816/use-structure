import { useState, useMemo } from "react";

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

    for (const [key, val] of Object.entries(obj)) {
      result[key] = deepCopy(val, update, result, key);
    }

    return objectProxy(result, setObj);
  }
}

function objectProxy(
  obj: Record<any, any>,
  setObj: (newObj: Collection) => void
) {
  return new Proxy(obj, {
    set: function (target, prop, receiver) {
      const newObj = { ...target, [prop]: receiver };
      setObj(newObj);
      return true;
    }
  });
}

function mapProxy(map: Map<any, any>, setObj: (newObj: Collection) => void) {
  return new Proxy(map, {
    get: function (target, prop, receiver) {
      if (prop === "set") {
        return (key: any, value: any) => {
          const newMap = new Map(target);
          newMap.set(key, value);

          setObj(newMap);
        };
      } else if (prop === "delete") {
        return (key: any) => {
          const newMap = new Map(target);
          newMap.delete(key);

          setObj(newMap);
        };
      } else if (prop === "clear") {
        return () => {
          setObj(new Map());
        };
      } else if (prop === "get") {
        return target.get.bind(target);
      } else if (prop === Symbol.iterator) {
        return target[Symbol.iterator].bind(target);
      }

      return Reflect.get(target, prop, receiver);
    }
  });
}

function setProxy(set: Set<any>, setObj: (newObj: Collection) => void) {
  return new Proxy(set, {
    get: function (target, prop, receiver) {
      if (prop === "add") {
        return (val: any) => {
          if (target.has(val)) {
            return;
          }
          const newSet = new Set(target);
          newSet.add(val);
          setObj(newSet);
        };
      } else if (prop === "delete") {
        return (val: any) => {
          if (target.has(val)) {
            const newSet = new Set(target);
            newSet.delete(val);
            setObj(newSet);
          }
        };
      } else if (prop === "clear") {
        return () => {
          setObj(new Set());
        };
      } else if (prop === "has") {
        return target.has.bind(target);
      } else if (prop === Symbol.iterator) {
        return target[Symbol.iterator].bind(target);
      }

      return Reflect.get(target, prop, receiver);
    }
  });
}

function arrayProxy(arr: any[], setObj: (newObj: Collection) => void) {
  return new Proxy(arr, {
    get: function (target, prop, receiver) {
      switch (prop) {
        case "push":
          return (...v: any[]) => {
            setObj([...target, v]);
            return v[v.length - 1];
          };
        case "pop":
          return () => {
            const lastArg = target[target.length - 1];
            const newArr = target.slice(0, target.length - 1);
            setObj(newArr);
            return lastArg;
          };
        case "unshift":
          return (...v: any[]) => {
            const newArr = [...v.reverse(), ...target];
            setObj(newArr);
            return v[0];
          };
        case "shift":
          return () => {
            const [firstArg, ...newArr] = target;
            setObj(newArr);
            return firstArg;
          };
        case "sort":
          return (compareFunction?: (a: number, b: number) => number) => {
            const newArr = [...target];
            newArr.sort(compareFunction);
            setObj(newArr);
            return newArr;
          };
        case "splice":
          return (start: number, deleteCount: number, ...items: any[]) => {
            const newArr = [...target];
            newArr.splice(start, deleteCount, ...items);
            setObj(newArr);
            return newArr;
          };
        case "reverse":
          return () => {
            const newArr = [...target].reverse();
            setObj(newArr);
            return newArr;
          };
        case "copyWithin":
          return (idx: number, start: number, end?: number) => {
            const newArr = [...target];
            newArr.copyWithin(idx, start, end);
            setObj(newArr);
            return newArr;
          };
        case "fill":
          return (value: any, start?: number, end?: number) => {
            const newArr = [...target];
            newArr.fill(value, start, end);
            setObj(newArr);
            return newArr;
          };
        default:
          return Reflect.get(target, prop, receiver);
      }
    },
    set: function (target, prop, receiver) {
      if (typeof prop !== "symbol" && !Number.isNaN(Number(prop))) {
        const newArr = [
          ...target.slice(0, Number(prop)),
          receiver,
          ...target.slice(Number(prop) + 1)
        ];
        setObj(newArr);
        return true;
      }
      return Reflect.get(target, prop, receiver);
    }
  });
}
