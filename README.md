# eslint-plugin-valtio

[Valtio](https://github.com/pmndrs/valtio) linting plugin for better development.

## Installation

```bash
npm install eslint-plugin-valtio --save-dev
```

for yarn users:

```bash
yarn add -D eslint-plugin-valtio
```

## Usage

### eslint v9 / flat config

```js
const valtio = require('eslint-plugin-valtio')

module.exports = [
  valtio.configs['flat/recommended'],
  {
    rules: {
      'valtio/state-snapshot-rule': ['warn'],
      'valtio/avoid-this-in-proxy': ['warn'],
    },
  },
]
```

### eslint v8 and below

Add `valtio` to the `extends` section of your `.eslintrc` configuration file.

```json
{
  "extends": ["plugin:valtio/recommended"]
}
```

## Rules

Alternatively, you can enable rules in the plugin, selectively.

```json
{
  "rules": {
    "valtio/state-snapshot-rule": "warn",
    "valtio/avoid-this-in-proxy": "warn"
  }
}
```

## Why

This plugin helps you catch common mistakes that can occur in [valtio](https://github.com/pmndrs/valtio). Here are some cases that this plugin catches.


## Rules Breakdown

### Snapshots in callbacks are not recommended

We shouldn't use snapshots in callbacks, because snapshots can be stale there.

```jsx
const state = proxy({ count: 0 })

function App() {
  const snap = useSnapshot(state)
  const handleClick = () => {
    console.log(snap.count) // This is not recommended as it can be stale.
  }
  return (
    <div>
      {snap.count} <button onClick={handleClick}>click</button>
    </div>
  )
}
```

### Proxies in render phase is not recommended

In render phase, it's better to use snapshots (as they're made to be compatible with react's reactivity) instead of states directly.

```jsx
const state = proxy({ count: 0 })

function App() {
  return (
    <div>{state.count} // This is not recommended as it is not reactive.</div>
  )
}
```

### Snapshots mutating is not possible

Snapshots are made to be used in the react render phase,
and not mutable.
So, we need to mutate proxy states directly.

```jsx
const state = proxy({ count: 0 })

function App() {
  const snap = useSnapshot(state)
  const handleClick = () => {
    ++snap.count // This doesn't work. Use proxy state instead.
  }
  return <button onClick={handleClick}>mutate</button>
}
```

### Computed declaration order

In the way valtio treats objects in `proxyWithComputed`, the order of fields matters; for example, `quadrupled` comes before `doubled`, but it depends on `doubled`, so the order is wrong! So we need to bring `doubled` first.

```jsx
const state = proxyWithComputed(
  {
    count: 0,
  },
  {
    quadrupled: (snap) => snap.doubled * 2, // Not found, If a computed field deriving value is created from another computed, the computed source should be declared first.
    doubled: (snap) => snap.count * 2,
  }
)
```

### Using `this` in proxy (`valtio/avoid-this-in-proxy`)

When working with `proxy` using `this` in it's context as long as taken care of will work as expected but since the implementation differs from a simple `proxy` to a `snapshot` version of the proxy, using `this` could get confusing. This rule is specifically for beginners that are adapting to the structure/differences in valtio.

```jsx
const state = proxy({
  count: 0,
  inc() {
    ++state.count // works as the state is being modified
  },
})

const state = proxy({
  count: 0,
  inc() {
    ++this.count // works as the context belongs to proxy
  },
})

const state = snapshot(
  proxy({
    count: 0,
    inc() {
      ++this.count // won't work since the params are now frozen since you are in a snapshot.
    },
  })
)
```
