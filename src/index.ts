import { useState, useMemo } from "react";

export type StateArray<T> = T & { set(newArray: T): void };

export function useArray<T extends any[]>(initialArr?: T): StateArray<T> {
  const [arr, setArr] = useState<any[]>(initialArr ?? []);

  return useMemo(
    () =>
      new Proxy(arr, {
        get: function (obj, prop) {
          switch (prop) {
            case "push":
              return (...v: any[]) => setArr([...obj, ...v]);
            case "pop":
              return () => {
                const lastArg = obj[obj.length - 1];
                const newArr = obj.slice(0, obj.length - 1);
                setArr(newArr);
                return lastArg;
              };
            case "unshift":
              return (...v: any[]) => setArr([...v.reverse(), ...obj]);
            case "shift":
              return () => {
                const [firstArg, ...newArr] = obj;
                setArr(newArr);
                return firstArg;
              };
            case "sort":
              return (compareFunction?: (a: number, b: number) => number) => {
                const newArr = [...obj];
                newArr.sort(compareFunction);
                setArr(newArr);
                return newArr;
              };
            case "splice":
              return (start: number, deleteCount: number, ...items: T) => {
                const newArr = [...obj];
                newArr.splice(start, deleteCount, ...items);
                setArr(newArr);
                return newArr;
              };
            case "reverse":
              return () => {
                const newArr = [...obj].reverse();
                setArr(newArr);
                return newArr;
              };
            case "copyWithin":
              return (target: number, start: number, end?: number) => {
                const newArr = [...obj];
                newArr.copyWithin(target, start, end);
                setArr(newArr);
                return newArr;
              };
            case "fill":
              return (value: any, start?: number, end?: number) => {
                const newArr = [...obj];
                newArr.fill(value, start, end);
                setArr(newArr);
                return newArr;
              };
            case "set":
              return (newArr: T) => {
                setArr(newArr);
                return;
              };
            default:
              // @ts-ignore
              return Reflect.get(...arguments);
          }
        },
        set: function (obj, prop, newVal) {
          if (typeof prop !== "symbol" && !Number.isNaN(Number(prop))) {
            const newArr = [
              ...obj.slice(0, Number(prop)),
              newVal,
              ...obj.slice(Number(prop) + 1)
            ];
            setArr(newArr);
            return true;
          }
          // @ts-ignore
          return Reflect.get(...arguments);
        }
      }) as StateArray<T>,
    [arr]
  );
}
