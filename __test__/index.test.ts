import { renderHook, act } from "@testing-library/react-hooks";
import { useStructure } from "../src";

describe("use-structure", () => {
  describe("Array", () => {
    it("represents an array", () => {
      const { result } = renderHook(() => useStructure([]));

      expect(result.current).toEqual([]);
    });

    test("basic push operation", () => {
      const { result, rerender } = renderHook(() => useStructure([]));

      act(() => {
        result.current.push(1);
      });

      rerender();

      expect(result.current).toEqual([1]);
      expect(result.current[0]).toBe(1);
    });

    test("basic pop operation", () => {
      const { result, rerender } = renderHook(() => useStructure([1]));
      let popped;

      act(() => {
        popped = result.current.pop();
      });

      rerender();

      expect(result.current).toEqual([]);
      expect(popped).toBe(1);
    });

    test("basic unshift operation", () => {
      const { result, rerender } = renderHook(() => useStructure([1]));

      act(() => {
        result.current.unshift(2);
      });

      rerender();

      expect(result.current).toEqual([2, 1]);
    });

    test("basic shift operation", () => {
      const { result, rerender } = renderHook(() => useStructure([1, 2]));
      let shifted;

      act(() => {
        shifted = result.current.shift();
      });

      rerender();

      expect(result.current).toEqual([2]);
      expect(shifted).toBe(1);
    });

    test("basic sort operation", () => {
      const { result, rerender } = renderHook(() =>
        useStructure([5, 11, 2838, -5, 4, -23232, 0, 39393])
      );

      act(() => {
        result.current.sort((a, b) => Number(a) - Number(b));
      });

      rerender();

      expect(result.current).toEqual([-23232, -5, 0, 4, 5, 11, 2838, 39393]);
    });

    test("basic splice operation", () => {
      const { result, rerender } = renderHook(() =>
        useStructure([1, 2, 3, 4, 5])
      );

      act(() => {
        result.current.splice(1, 2);
      });

      rerender();

      expect(result.current).toEqual([1, 4, 5]);
    });

    test("basic reverse operation", () => {
      const { result, rerender } = renderHook(() =>
        useStructure([1, 2, 3, 4, 5])
      );

      act(() => {
        result.current.reverse();
      });

      rerender();

      expect(result.current).toEqual([5, 4, 3, 2, 1]);
    });

    test("basic copyWithin operation", () => {
      const { result, rerender } = renderHook(() =>
        useStructure([1, 2, 3, 4, 5])
      );

      act(() => {
        result.current.copyWithin(0, 3, 4);
      });

      rerender();

      expect(result.current).toEqual([4, 2, 3, 4, 5]);
    });

    test("basic fill operation", () => {
      const { result, rerender } = renderHook(() =>
        useStructure([1, 2, 3, 4, 5])
      );

      act(() => {
        result.current.fill(6, 1, 3);
      });

      rerender();

      expect(result.current).toEqual([1, 6, 6, 4, 5]);
    });

    test("basic set operation", () => {
      const { result, rerender } = renderHook(() =>
        useStructure([1, 2, 3, 4, 5])
      );

      act(() => {
        result.current[3] = 6;
      });

      rerender();

      expect(result.current).toEqual([1, 2, 3, 6, 5]);
    });

    test("multi-set operation", () => {
      const { result, rerender } = renderHook(() =>
        useStructure([1, 2, 3, 4, 5])
      );

      act(() => {
        result.current[3] = 6;
        result.current[0] = 0;
      });

      rerender();

      expect(result.current).toEqual([0, 2, 3, 6, 5]);
    });

    test("nested arrays", () => {
      const { result, rerender } = renderHook(() =>
        useStructure([
          [1, 2],
          [3, 4],
        ])
      );

      act(() => {
        result.current[0][1] = 6;
        result.current[1].push(5);
        result.current.push([7, 8]);
      });

      rerender();

      expect(result.current).toEqual([
        [1, 6],
        [3, 4, 5],
        [7, 8],
      ]);
    });
  });

  describe("Object", () => {
    it("respresents an object", () => {
      const { result } = renderHook(() => useStructure({}));

      expect(result.current).toEqual({});
    });

    test("reassgning and adding properties", () => {
      const { result, rerender } = renderHook<
        undefined,
        { a: number; b?: number }
      >(() =>
        useStructure({
          a: 1,
        })
      );

      act(() => {
        result.current.a = 2;
        result.current.b = 3;
      });

      rerender();

      expect(result.current).toEqual({ a: 2, b: 3 });
    });

    test("nested objects", () => {
      const { result, rerender } = renderHook(() =>
        useStructure({ a: { b: 2 } })
      );
      act(() => {
        result.current.a.b = 3;
      });

      rerender();
      expect(result.current).toEqual({ a: { b: 3 } });
    });

    test("multi-set nested objects", () => {
      const { result, rerender } = renderHook(() =>
        useStructure({ a: { b: 2, c: 3 }, d: 4 })
      );

      act(() => {
        result.current.a.c = 6;
        result.current.d = 5;
      });

      rerender();
      expect(result.current).toEqual({ a: { b: 2, c: 6 }, d: 5 });
    });
  });

  describe("Map", () => {
    it("represents as Map", () => {
      const { result } = renderHook(() => useStructure(new Map()));

      expect(result.current).toEqual(new Map());
    });

    test("setting a value", () => {
      const { result, rerender } = renderHook(() =>
        useStructure(new Map([["a", 1]]))
      );

      act(() => {
        result.current.set("a", 2);
      });

      rerender();
      expect(result.current.size).toBe(1);
      expect(result.current.get("a")).toBe(2);
    });

    test("setting multiple values", () => {
      const { result, rerender } = renderHook(() =>
        useStructure(new Map([["a", 1]]))
      );

      act(() => {
        result.current.set("a", 2);
        result.current.set("b", 3);
      });

      rerender();
      expect(result.current).toEqual(
        new Map([
          ["a", 2],
          ["b", 3],
        ])
      );
    });

    test("deleting a value", () => {
      const { result, rerender } = renderHook(() =>
        useStructure(new Map([["a", 1]]))
      );

      act(() => {
        result.current.delete("a");
      });

      rerender();
      expect(result.current.get("a")).toBeUndefined();
    });

    test("clear", () => {
      const { result, rerender } = renderHook(() =>
        useStructure(
          new Map([
            ["a", 1],
            ["b", 2],
          ])
        )
      );

      act(() => {
        result.current.clear();
      });

      rerender();
      expect(result.current).toEqual(new Map());
    });

    test("Symbol.iterator", () => {
      const { result, rerender } = renderHook(() =>
        useStructure(
          new Map([
            ["a", 1],
            ["b", 2],
            ["c", 3],
          ])
        )
      );

      act(() => {
        result.current.set("d", 4);
      });

      rerender();
      expect([...result.current]).toEqual([
        ["a", 1],
        ["b", 2],
        ["c", 3],
        ["d", 4],
      ]);
    });

    test("nested maps", () => {
      const { result, rerender } = renderHook(() =>
        useStructure(new Map([["a", new Map()]]))
      );

      act(() => {
        result.current.get("a").set("b", 1);
        result.current.set("c", new Map([["d", 2]]));
      });

      rerender();
      expect(result.current.get("a").get("b")).toBe(1);
      expect(result.current.get("c").get("d")).toBe(2);
    });
  });

  describe("Set", () => {
    it("represents a Set", () => {
      const { result } = renderHook(() => useStructure(new Set()));

      expect(result.current).toEqual(new Set());
    });

    test("add a value", () => {
      const { result, rerender } = renderHook(() => useStructure(new Set()));

      act(() => {
        result.current.add(1);
      });

      rerender();
      expect(result.current.has(1)).toBeTruthy();
    });

    test("add multiple values", () => {
      const { result, rerender } = renderHook(() => useStructure(new Set([1])));

      act(() => {
        result.current.add(1);
        result.current.add(2);
        result.current.add(4);
      });

      rerender();
      expect(result.current).toEqual(new Set([1, 2, 4]));
    });

    test("delete a value", () => {
      const { result, rerender } = renderHook(() =>
        useStructure(new Set([1, 2, 3]))
      );

      act(() => {
        result.current.delete(2);
      });

      rerender();
      expect(result.current).toEqual(new Set([1, 3]));
    });

    test("clear", () => {
      const { result, rerender } = renderHook(() =>
        useStructure(new Set([1, 2, 3]))
      );

      act(() => {
        result.current.clear();
      });

      rerender();
      expect(result.current).toEqual(new Set());
    });

    test("Symbol.iterator", () => {
      const { result, rerender } = renderHook(() =>
        useStructure(new Set([1, 3, 2]))
      );

      act(() => {
        result.current.add(-1);
      });

      rerender();
      expect([...result.current]).toEqual([1, 3, 2, -1]);
    });
  });

  describe("Class", () => {
    test("basic class", () => {
      class Counter {
        value: number;

        constructor() {
          this.value = 0;
        }

        increment() {
          this.value += 1;
        }

        decrement() {
          this.value -= 1;
        }
      }

      const { result, rerender } = renderHook(() =>
        useStructure(new Counter())
      );

      expect(result.current.value).toBe(0);

      act(() => {
        result.current.increment();
      });
      rerender();
      expect(result.current.value).toBe(1);

      act(() => {
        result.current.decrement();
        result.current.decrement();
      });
      rerender();
      expect(result.current.value).toBe(-1);
    });

    test("class with getter", () => {
      class Temperature {
        temp: number;
        unit: "celsius" | "fahrenheit";

        constructor(initialTemp: number, unit: "celsius" | "fahrenheit") {
          this.temp = initialTemp;
          this.unit = unit;
        }

        toF() {
          if (this.unit === "celsius") {
            return (this.temp * 9) / 5 + 32;
          }
          return this.temp;
        }

        toC() {
          if (this.unit === "fahrenheit") {
            return ((this.temp - 32) * 5) / 9;
          }

          return this.temp;
        }

        swapUnit() {
          if (this.unit === "celsius") {
            this.temp = this.toF();
            this.unit = "fahrenheit";
          } else {
            this.temp = this.toC();
            this.unit = "celsius";
          }
        }
      }

      const { result, rerender } = renderHook(() =>
        useStructure(new Temperature(32, "fahrenheit"))
      );

      expect(result.current.temp).toBe(32);
      expect(result.current.unit).toBe("fahrenheit");
      expect(result.current.toC()).toBe(0);

      act(() => {
        result.current.swapUnit();
      });

      rerender();

      expect(result.current.temp).toBe(0);
      expect(result.current.unit).toBe("celsius");
      expect(result.current.toF()).toBe(32);

      act(() => {
        result.current.swapUnit();
      });

      rerender();

      expect(result.current.temp).toBe(32);
      expect(result.current.unit).toBe("fahrenheit");
      expect(result.current.toF()).toBe(32);
    });

    test("extended class", () => {
      class Rectangle {
        width: number;
        length: number;

        constructor(width: number, length: number) {
          this.width = width;
          this.length = length;
        }

        area() {
          return this.width * this.length;
        }

        rotate() {
          [this.width, this.length] = [this.length, this.width];
        }
      }

      class Square extends Rectangle {
        constructor(side: number) {
          super(side, side);
        }

        diagonal() {
          return Math.sqrt(this.width ** 2 + this.length ** 2);
        }
      }

      const { result, rerender } = renderHook(() =>
        useStructure(new Square(5))
      );

      expect(result.current.area()).toBe(25);
      expect(Math.round(result.current.diagonal())).toBe(7);

      act(() => {
        result.current.length = 10;
      });
      rerender();

      expect(result.current.area()).toBe(50);

      act(() => {
        result.current.rotate();
      });
      rerender();

      expect(result.current.length).toBe(5);
      expect(result.current.width).toBe(10);
    });
  });
});
