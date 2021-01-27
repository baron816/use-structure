# useStructure

Use Objects, Arrays, Maps, and Sets in the imperative way, but keep React State updated correctly.

Your mutative calls to arrays will be intercepted so that they're immutative, and your component gets updated correctly.

## Install

`npm install use-structure`

## useStructure Usage

### Objects

```javascript
import { useStructure } from "use-structure";

function MyComponent() {
  const state = useStructure({
    name: "",
    email: "",
  });

  return (
    <form>
      <input
        onChange={(e) => {
          state.name = e.target.value;
        }}
        value={state.name}
      />
      <input
        onChange={(e) => {
          state.email = e.target.value;
        }}
        value={state.email}
      />
    </form>
  );
}
```

The assignment operator `myObj.val = newVal` will update your object here.

### Arrays

```javascript
...
const arr = useStructure([]);
...
<button onClick={() => {
    arr.push(1, 2, 3);
}}>Add value</button>
```

All the mutuative array methods (`push`, `pop`, `shift`, `unshift`, `sort`, `splice`, `reverse`, `copyWith`, and `fill`) will work as you expect them to in this context.

### Sets

```javascript
...
const set = useStructure(new Set());
...
<button onClick={() => {
    set.add("hello");
}}>Add to set</button>
```

`add`, `delete`, and `clear` will update your set.

### Maps

```javascript
...
const map = useStructure(new Map());
...
<button onClick={() => {
    map.set('a', 1);
}}>Add to map</button>
...
```

`set`, `delete`, and `clear` will update your map.

### Nested data structures

```javascript
const state = useStructure({
    people: [
        new Map(
            ['name', ''],
            ['addresses', [{ street: '', city: ''}]],
        )
    ]
});
...
<input onChange={() => {
    state.people[i].get('addresses')[j].city = 'SF';
}} value={state.people[i].get('addresses')[j]}/>
```

Use any number of nested Objects, Sets, Maps, and Arrays. All of the appropriate methods will still work correctly.

### Class instances

```javascript
class Counter {
  constructor(initialVal = 0) {
    this.count = initialVal;
  }

  increment() {
    this.count += 1;
  }

  decrement() {
    this.count -= 1;
  }
}

function MyComponent() {
    const counter = useStructure(() => new Counter());

    return (
        <h1>{counter.count}</h1>
        <button onClick={() => counter.increment()}>increment</button>
        <button onClick={() => counter.decrement()}>decrement</button>
    )
}
```

Note that if your class method returns a value, it should not be `undefined` (use `null` instead). If it returns `undefined`, it's an indication that you don't want to cause a rerender (you just want to derive some value).

## createGlobalStructure

`createGlobalStructure` allows you to use state from `useStructure` across multiple components, without having to use Context.

```javascript
const useCounter = createGlobalStructure({ counter: 0 });

function Component1() {
  const counter = useCounter();

  return (
    <div>
      <h1>Count: {counter.count}</h1>
      <button
        onPress={() => {
          counter.count += 1; // State changes here update both Component1 and Component2
        }}
      >
        Increment
      </button>
    </div>
  );
}

function Component2() {
  const counter = useCounter();

  return (
    <div>
      <h1>Same Count: {counter.count}</h1> // This will update when button on
      Component1 is pressed
    </div>
  );
}
```

### Observer

`createGlobalStructure` accepts a second optional boolean value, which will cause the function to return a tuple--the first value will be the the same generated hook, the second is an observer that you can use to `subscribe` callbacks to, or force updates.

```javascript
const [useCounter, counterObserver] = createGlobalStructure({ counter}, true);

counterObserver.subscribe(counter => {
  console.log(counter.count); // Will log the count whenever the button on Component1 is pressed
})

...

function Component1() {
    const counter = useCounter();

  return (
    <div>
      <h1>Count: {counter.count}</h1>
      <button onPress={() => {
          counter.count += 1;
        }}
      >Increment</button>
    </div>
  )
}

...

function UpdateCounter(count) {
  counterObserver.update({ count }); // Can be called from anywhere in the app and components using `useCounter` will update.
}

```

## Caveats

1. Don't use this if you need to support pre ES6 browsers. This package depends on [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy), which can't be polyfilled.

2. If you're making multiple updates on nested structures in a single render, always update in order of inner structures to outer structures. Otherwise, you'll overwrite your inner structures and those changes won't be updated on your component.

3. Don't use cyclical graphs. Though it likely could be supported, it's an edge case I don't want to try to address.

4. If you use a class instance, your mutating methods must not return anything/return `undefined`, and your "getters" must not return `undefined` (use `null` instead`). This is to prevent render loops.

5. Any methods on your objects shouldn't be async. Your components won't update correctly if you're trying to set state from within those promises.
