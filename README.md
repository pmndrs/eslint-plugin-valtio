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

Add `valtio` to the `extends` section of your `.eslintrc` configuration file. 

```json
{
  "extends": [
      "plugin:valtio/recommended"
    ]
}
```

You can enable the rule to activate the plugin.

```json
{
  "rules": {
    "valtio/state-snapshot-rule": "warn"
  } 
}
```

## Why
This plugin helps you catch common mistakes that can occur in [valtio](https://github.com/pmndrs/valtio). Here are some cases that this plugin catches.

### Snapshots in callbacks
For example, we shouldn't use snapshots in callbacks like useEffects, because snapshots are not stable there.
```jsx
const state = proxy({ count: 0})
function App() {
  const snapshot = useSnapshot(state)
  useEffect(() => {
    ++snapshot.count // Better to just use proxy state.
  })
  return (
    <div>{snapshot.count}</div>
  )
}
```
### Proxies in render phase
In render phase, it's better to use Snapshots (as they're made to be compatible with react's reactivity) instead of states directly.
```jsx
const state = proxy({ count: 0})
function App() {
  return (
    <div>
      {state.count} // Using proxies in the render phase would cause unexpected problems.
    </div>
  )
}
``` 
### State mutating
Snapshots are made to be used with react, so we recommend them for mutating, and not states directly.
```jsx
const state = proxy({ count: 0})
function App() {
  const handleClick = () => {
    state.count = state.count + 1 // Mutating a proxy object itself. this might not be expected as it's not reactive.
  }
 return <button onClick={handleClick}>mutate</button> 
}
```
### Computed declaration order
In the way valtio treats objects in `proxyWithComputed`, the order of fields matters; for example, `quadrupled` comes before `doubled`, but it depends on `doubled`, so the order is wrong! So we need to bring `doubled` first. 
```jsx
const state = proxyWithComputed({
  count: 0,
}, {
  quadrupled: (snap) => snap.doubled * 2, // Not found, If a computed field deriving value is created from another computed, the computed source should be declared first.
  doubled: (snap) => snap.count * 2,
})
```
