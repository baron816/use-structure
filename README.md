# useStructure

Use Objects, Arrays, Maps, and Sets in the imperative way, but keep React State updated correctly.

You mutative calls to arrays will be intercepted so that they're immutative, and your component gets updated correctly.

## Install

`npm install use-structure`

## Usage

### use with objects
```javascript
import { useStructure } from 'use-structure';

function MyComponent() {
    const state = useStructure({
        name: '',
        email: '',
    });

    return (
        <form>
            <input onChange={e => {
                state.name = e.target.value;
            }} value={state.name}/>
            <input onChange={e => {
                state.email = e.target.value;
            }} value={state.email}/>
        </form>
    )
}
```

The assignment operator `myObj.val = newVal` will update your object here.

### use with arrays
```javascript
...
const arr = useStructure([]);
...
<button onClick={() => {
    arr.push(1, 2, 3);
}}>Add value</button>
```

All the mutuative array methods (`push`, `pop`, `shift`, `unshift`, `sort`, `splice`, `reverse`, `copyWith`, and `fill`) will work as you expect them to in this context.

### use with sets
```javascript
...
const set = useStructure(new Set());
...
<button onClick={() => {
    set.add("hello");
}}>Add to set</button>
```

`add`, `delete`, and `clear` will update your set.

### use with maps
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

### use nested data structures
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

# use class instances
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

## Caveats
1. Don't use this if you need to support pre ES6 browsers. This package depends on [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy), which can't be polyfilled.

2. Don't use cyclical graphs. Though it likely could be supported, it's an edge case I don't want to try to address.

3. If you use a class instance, your mutating methods must not return anything/return `undefined`, and your "getters" must not return `undefined` (use `null` instead`). This is to prevent render loops.
