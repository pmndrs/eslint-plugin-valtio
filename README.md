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
