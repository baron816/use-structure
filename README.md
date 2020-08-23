# useStructure

Use Objects, Arrays, Maps, and Sets in the imperative way, but keep React State updated correctly.

You mutative calls to arrays will be intercepted so that they're immutative, and your component gets updated correctly.

## Usage

### use with objects
```javascript
import { useStructure } from 'useStructure';

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

## Caveats
1. Don't use this if you need to support pre ES6 browsers. This package depends on [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy), which can't be polyfilled.

2. Don't use cyclical graphs. Though it likely could be supported, it's an edge case I don't want to try to address.

4. Object, Array, Map, Set are the only types of objects that are supported. If you pass an object that has its own methods on it, those methods won't update the component correctly.