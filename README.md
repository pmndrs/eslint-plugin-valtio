# eslint-plugin-valtio

[Valtio](https://github.com/pmndrs/valtio) linting plugin for better development. 
## Installation

```
npm install eslint-plugin-valtio --save-dev
```
for yarn users:
```
yarn add -D eslint-plugin-valtio 
```

## Usage

Add `valtio` to the plugins section of your `.eslintrc` configuration file. 

```json
{
  "plugins": ["valtio"]
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
